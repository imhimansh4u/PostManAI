import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Project from "../models/Project.js";
import Test from "../models/Test.js";
import TestRun from "../models/Testrun.js";
import Cookie from "../models/Cookie.js";

// To run a test

const runTest = asyncHandler(async (req, res) => {
  const { testId, projectId, testCase } = req.body;

  if (!testId || !projectId || !testCase) {
    throw new ApiError(400, "testId, projectId and testCase are required");
  }

  const project = await Project.findOne({
    _id: projectId,
    userId: req.user._id,
  }).select("+auth.token");

  if (!project) throw new ApiError(404, "Project not found");
  if (!project.baseUrl)
    throw new ApiError(400, "Project has no base URL configured");

  const test = await Test.findOne({ _id: testId, projectId }); // Check that this testid belongs to this Project Only
  if (!test) throw new ApiError(404, "Test not found in this project");

  const fullUrl = `${project.baseUrl}${testCase.url}`;

  let requestHost = null; //  will be used later
  try {
    requestHost = new URL(fullUrl).hostname;
  } catch (err) {
    requestHost = null;
  }

  const headers = {};
  if (!["GET", "DELETE"].includes(testCase.method)) {
    headers["Content-Type"] = "application/json";
  }

  const resolvedAuth =
    testCase.auth?.type && testCase.auth.type !== "Inherit"
      ? testCase.auth
      : project.auth;

  if (resolvedAuth?.type === "Bearer" && resolvedAuth.token) {
    headers["Authorization"] = `Bearer ${resolvedAuth.token}`;
  } else if (resolvedAuth?.type === "Basic" && resolvedAuth.token) {
    headers["Authorization"] = `Basic ${resolvedAuth.token}`;
  } else if (resolvedAuth?.type === "API-Key" && resolvedAuth.token) {
    headers[resolvedAuth.headerName || "x-api-key"] = resolvedAuth.token;
  }

  let status;
  let actualStatus = null;
  let actualBody = null;
  let responseTime = null;
  let errorMessage = null;
  let aiAnalysis = {};
  let responseCookies = [];

  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeoutMs = 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const fetchOptions = {
      method: testCase.method,
      headers,
      signal: controller.signal,
    };

    // Attach matching cookies from the project's cookie store (RFC-like matching)
    try {
      const urlObj = new URL(fullUrl);
      const requestPath = urlObj.pathname || "/";
      const isSecure = urlObj.protocol === "https:";

      const now = new Date();
      // derive default domain from project.baseUrl to include legacy Project.cookieJar entries
      let defaultDomain = null;
      try {
        if (project.baseUrl) {
          const u = new URL(project.baseUrl);
          defaultDomain = u.hostname;
        }
      } catch (err) {
        defaultDomain = null;
      }

      // fetch Only Valid Cookies
      const curr = new Date();
      const candidateCookiesFromDb = await Cookie.find({
        projectId,
        $or: [{ expires: null }, { expires: { $gte: curr } }],
      });

      const applicable = candidateCookiesFromDb.filter((c) => {
        if (c.expires && c.expires < now) return false;
        if (c.secure && !isSecure) return false;
        if (!requestHost) return false; // can't domain-match with no host to compare against

        const cookieDomain = (c.domain || requestHost).replace(/^\./, "");
        const hostMatch =
          requestHost === cookieDomain ||
          requestHost.endsWith("." + cookieDomain);
        if (!hostMatch) return false;

        const cookiePath = c.path || "/";
        if (!requestPath.startsWith(cookiePath)) return false;
        return true;
      });

      if (applicable.length > 0) {
        const cookieHeader = applicable
          .map((c) => `${c.name}=${c.value}`)
          .join("; ");
        // if testCase already supplied Cookie header, merge
        if (headers["Cookie"]) {
          headers["Cookie"] = `${headers["Cookie"]}; ${cookieHeader}`;
        } else {
          headers["Cookie"] = cookieHeader;
        }
      }
    } catch (err) {
      // non-fatal -> if URL parsing fails or cookie lookup fails, continue without cookies
      console.warn("Cookie attach failed:", err.message);
    }

    if (!["GET", "DELETE"].includes(testCase.method) && testCase.body) {
      fetchOptions.body = JSON.stringify(testCase.body);
    }

    let response;
    try {
      response = await fetch(fullUrl, fetchOptions); // actual api calling
      responseTime = Date.now() - start;
      actualStatus = response.status;

      const rawText = await response.text();
      try {
        actualBody = JSON.parse(rawText);
      } catch {
        actualBody = rawText;
      }
    } finally {
      clearTimeout(timeoutId);
    }

    // Extract Set-Cookie headers (parse attributes) so we can persist cookies to Cookie model
    const parseSetCookieHeaders = (response) => {
      try {
        let setCookieHeaders = [];
        if (response.headers && typeof response.headers.raw === "function") {
          const raw = response.headers.raw();
          if (raw["set-cookie"]) setCookieHeaders = raw["set-cookie"];
        } else if (
          response.headers &&
          typeof response.headers.forEach === "function"
        ) {
          response.headers.forEach((value, key) => {
            if (key && key.toLowerCase() === "set-cookie")
              setCookieHeaders.push(value);
          });
          const sc = response.headers.get && response.headers.get("set-cookie");
          if (sc && !setCookieHeaders.includes(sc)) setCookieHeaders.push(sc);
        }

        const parsed = [];
        setCookieHeaders.forEach((cookieStr) => {
          if (!cookieStr) return;
          const parts = cookieStr.split(";").map((p) => p.trim());
          const [nameValue, ...attrs] = parts;
          const idx = nameValue.indexOf("=");
          if (idx <= 0) return;
          const name = nameValue.substring(0, idx).trim();
          const value = nameValue.substring(idx + 1).trim();
          const cookie = {
            name,
            value,
            domain: null,
            path: "/",
            httpOnly: false,
            secure: false,
            sameSite: null,
            expires: null,
          };
          attrs.forEach((attr) => {
            const [k, ...v] = attr.split("=");
            const key = k.trim().toLowerCase();
            const val = v.join("=").trim();
            if (key === "domain") cookie.domain = val;
            else if (key === "path") cookie.path = val || "/";
            else if (key === "httponly") cookie.httpOnly = true;
            else if (key === "secure") cookie.secure = true;
            else if (key === "samesite") {
              const normalized = val.toLowerCase();
              cookie.sameSite =
                normalized === "lax" ||
                normalized === "strict" ||
                normalized === "none"
                  ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
                  : null; // unrecognized value — don't silently save garbage into the enum
            } else if (key === "expires") {
              const d = new Date(val);
              if (!isNaN(d)) cookie.expires = d;
            } else if (key === "max-age") {
              const seconds = Number(val);
              if (!isNaN(seconds))
                cookie.expires = new Date(Date.now() + seconds * 1000);
            }
          });
          parsed.push(cookie);
        });
        return parsed;
      } catch (err) {
        return [];
      }
    };

    responseCookies = parseSetCookieHeaders(response);

    status = actualStatus === testCase.expectedStatus ? "pass" : "fail";
  } catch (err) {
    status = "error";
    errorMessage = err.message;
  }

  // Step 5.5 — Evaluate assertions
  let assertionResults = [];
  if (status === "pass" && testCase.assertions?.length > 0) {
    assertionResults = evaluateAssertions(
      testCase.assertions,
      actualBody,
      responseTime,
    );
    const anyAssertionFailed = assertionResults.some((r) => !r.passed);
    if (anyAssertionFailed) {
      status = "fail";
    }
  }

  // Step 6 — Regression detection
  let isRegression = false;
  let previousRunId = null;

  const previousRun = await TestRun.findOne({ testId }).sort({ runAt: -1 });
  if (previousRun) {
    previousRunId = previousRun._id;
    if (status === "fail" && previousRun.status === "pass") {
      isRegression = true;
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  let savedTestRunId = null;

  try {
    const [testRun] = await TestRun.create(
      [
        {
          testId,
          projectId,
          userId: req.user._id,
          requestSnapshot: {
            method: testCase.method,
            url: fullUrl,
            headers,
            body: testCase.body || null,
          },
          status,
          actualStatus,
          expectedStatus: testCase.expectedStatus,
          actualBody,
          responseTime,
          errorMessage,
          isRegression,
          previousRunId,
          assertionResults,
          triggeredBy: "manual",
          runAt: new Date(),
        },
      ],
      { session },
    );

    savedTestRunId = testRun._id;

    await Test.findByIdAndUpdate(
      testId,
      {
        "lastRun.status": status,
        "lastRun.runAt": new Date(),
        "lastRun.responseTime": responseTime,
        "lastRun.isRegression": isRegression,
      },
      { session },
    );

    if (status === "pass" && actualBody && testCase.captureAuthToken) {
      const token =
        actualBody.token ||
        actualBody.accessToken ||
        actualBody.data?.token ||
        actualBody.data?.accessToken;
      if (token) {
        await Project.findByIdAndUpdate(
          projectId,
          { "auth.token": token },
          { session },
        );
      }
    }

    // If the response included cookies, persist them into Cookie collection
    if (Array.isArray(responseCookies) && responseCookies.length > 0) {
      for (const c of responseCookies) {
        const domain = c.domain || requestHost || null;
        const path = c.path || "/";
        const update = {
          value: c.value,
          domain,
          path,
          httpOnly: !!c.httpOnly,
          secure: !!c.secure,
          sameSite: c.sameSite || null,
          expires: c.expires || null,
          lastSeen: new Date(),
        };
        try {
          await Cookie.findOneAndUpdate(
            { projectId, name: c.name, domain, path },
            { $set: update },
            { upsert: true, session, returnDocument: "after" },
          );
        } catch (err) {
          console.warn("Cookie upsert failed:", err.message);
        }
      }
    }

    await session.commitTransaction();
  } catch (dbError) {
    await session.abortTransaction();
    console.error("Database updates failed. Rollback triggered:", dbError);
    throw new ApiError(
      500,
      `Failed to save test execution log securely: ${dbError.message}`,
    );
  } finally {
    session.endSession();
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        status,
        actualStatus,
        expectedStatus: testCase.expectedStatus,
        responseTime,
        actualBody,
        isRegression,
        errorMessage,
        assertionResults,
        testRunId: savedTestRunId,
      },
      "Test executed successfully",
    ),
  );
});
// To Get the Test Cases Based on users Description
const getTests = asyncHandler(async (req, res) => {
  const { projectId, description } = req.body;

  if (!projectId || !description) {
    throw new ApiError(422, "Please provide all required fields");
  }

  const project = await Project.findOne({
    _id: projectId,
    userId: req.user._id,
  });

  if (!project) {
    throw new ApiError(404, "Project does not exist");
  }

  let aiTests;
  try {
    const aiUrl = process.env.AI_SERVICE_URL;
    if (!aiUrl) {
      throw new ApiError(500, "AI_SERVICE_URL is not configured");
    }
    const aiResponse = await fetch(`${aiUrl}/ai/generate-test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": process.env.INTERNAL_API_KEY,
      },
      body: JSON.stringify({
        projectId,
        description,
      }),
    });

    if (!aiResponse.ok) {
      let errorMessage = "AI service failed to generate tests";

      try {
        const errorBody = await aiResponse.json();
        errorMessage =
          errorBody?.detail ||
          errorBody?.message ||
          errorBody?.error ||
          errorMessage;
      } catch {
        // ignore JSON parsing issues and keep the fallback message
      }
      throw new ApiError(
        aiResponse.status >= 400 && aiResponse.status < 500 ? 400 : 500,
        errorMessage,
      );
    }

    aiTests = await aiResponse.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      500,
      `AI Test Generation Failed: ${error.message} and ${error?.response?.data}`,
    );
  }

  if (!Array.isArray(aiTests) || aiTests.length === 0) {
    throw new ApiError(500, "AI service returned an invalid test response");
  }

  const normalizedTests = aiTests
    .map((test) => {
      const request = test?.request || {};
      const expectedResponse = test?.expectedResponse || {};

      if (
        !request?.method ||
        !request?.url ||
        expectedResponse?.status === undefined ||
        expectedResponse?.status === null
      ) {
        return null;
      }

      return {
        projectId,
        userId: req.user._id,
        name: test?.testName || "Generated API Test",
        userInput: description,
        aiDescription: test?.description || null,
        method: String(request.method).toUpperCase(),
        url: String(request.url).trim(),
        headers: request.headers || {},
        body: request.body ?? null,
        queryParams: request.queryParams || {},
        expectedStatus: Number(expectedResponse.status),
        assertions: Array.isArray(test?.assertions) ? test.assertions : [],
      };
    })
    .filter(Boolean);

  if (normalizedTests.length === 0) {
    throw new ApiError(
      500,
      "AI service returned incomplete test cases. Please try again with a clearer prompt.",
    );
  }

  const insertedTests = await Test.insertMany(normalizedTests);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { tests: insertedTests },
        "Test cases generated successfully",
      ),
    );
});

// Helper Function to check and evaluate the assersions....

// const evaluateAssertions = (assertions, actualBody, responseTime) => {
//   return assertions.map((assertion) => {
//     try {
//       // responseTime check
//       // "responseTime < 500"
//       if (assertion.startsWith("responseTime")) {
//         const [, operator, value] = assertion.match(
//           /responseTime\s*([<>]=?|===)\s*(\d+)/,
//         );
//         const numValue = Number(value);
//         let passed = false;
//         if (operator === "<") passed = responseTime < numValue;
//         if (operator === ">") passed = responseTime > numValue;
//         if (operator === "<=") passed = responseTime <= numValue;
//         if (operator === ">=") passed = responseTime >= numValue;
//         if (operator === "===") passed = responseTime === numValue;
//         return { assertion, passed, actual: `${responseTime}ms`, error: null };
//       }

//       // Extract the path from assertion
//       // "response.body.token exists" → path = "token"
//       // "response.body.user.email === 'x'" → path = "user.email"
//       const existsMatch = assertion.match(/^response\.body\.(.+?)\s+exists$/);
//       const equalsMatch = assertion.match(
//         /^response\.body\.(.+?)\s*(===|!==)\s*(.+)$/,
//       );
//       const lengthMatch = assertion.match(
//         /^response\.body\.(.+?)\.length\s*([<>]=?|===)\s*(\d+)$/,
//       );

//       // Helper — resolve nested path from object
//       // getNestedValue(body, "user.email") → body.user.email
//       const getNestedValue = (obj, path) => {
//         return path.split(".").reduce((current, key) => {
//           return current !== undefined && current !== null
//             ? current[key]
//             : undefined;
//         }, obj);
//       };

//       // EXISTS check
//       // "response.body.token exists"
//       if (existsMatch) {
//         const path = existsMatch[1];
//         const actual = getNestedValue(actualBody, path);
//         const passed = actual !== undefined && actual !== null;
//         return { assertion, passed, actual: String(actual), error: null };
//       }

//       // EQUALS / NOT EQUALS check
//       // "response.body.success === true"
//       // "response.body.user.email === 'test@test.com'"
//       if (equalsMatch) {
//         const path = equalsMatch[1];
//         const operator = equalsMatch[2];
//         let expectedValue = equalsMatch[3].trim();

//         // Parse expected value type
//         if (expectedValue === "true") expectedValue = true;
//         else if (expectedValue === "false") expectedValue = false;
//         else if (expectedValue === "null") expectedValue = null;
//         else if (!isNaN(expectedValue)) expectedValue = Number(expectedValue);
//         else expectedValue = expectedValue.replace(/^['"]|['"]$/g, ""); // strip quotes

//         const actual = getNestedValue(actualBody, path);
//         const passed =
//           operator === "==="
//             ? actual === expectedValue
//             : actual !== expectedValue;

//         return { assertion, passed, actual: String(actual), error: null };
//       }

//       // LENGTH check
//       // "response.body.items.length > 0"
//       if (lengthMatch) {
//         const path = lengthMatch[1];
//         const operator = lengthMatch[2];
//         const expectedLength = Number(lengthMatch[3]);
//         const actual = getNestedValue(actualBody, path);
//         const actualLength = Array.isArray(actual) ? actual.length : 0;

//         let passed = false;
//         if (operator === ">") passed = actualLength > expectedLength;
//         if (operator === "<") passed = actualLength < expectedLength;
//         if (operator === ">=") passed = actualLength >= expectedLength;
//         if (operator === "<=") passed = actualLength <= expectedLength;
//         if (operator === "===") passed = actualLength === expectedLength;

//         return {
//           assertion,
//           passed,
//           actual: `length ${actualLength}`,
//           error: null,
//         };
//       }

//       // Unrecognized assertion format
//       return {
//         assertion,
//         passed: false,
//         actual: null,
//         error: "Unrecognized assertion format",
//       };
//     } catch (err) {
//       return { assertion, passed: false, actual: null, error: err.message };
//     }
//   });
// };

const updateTest = asyncHandler(async (req, res) => {
  // To change the Test details
  const { testId } = req.params;
  const {
    method,
    url,
    queryParams,
    headers,
    body,
    expectedStatus,
    auth,
    assertions,
  } = req.body;

  // Verify test belongs to this user
  const test = await Test.findOne({
    _id: testId,
    userId: req.user._id,
  });

  if (!test) throw new ApiError(404, "Test not found");

  const updatedTest = await Test.findByIdAndUpdate(
    testId,
    {
      ...(method && { method: method.toUpperCase() }),
      ...(url && { url }),
      ...(queryParams && { queryParams }),
      ...(headers && { headers }),
      ...(body !== undefined && { body }),
      ...(expectedStatus && { expectedStatus }),
      ...(auth && { auth }),
      ...(assertions && { assertions }),
      wasManuallyEdited: true,
    },
    { returnDocument: "after", runValidators: true },
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTest, "Test updated successfully"));
});

// Update project's cookie jar manually

export { runTest, getTests, updateTest };
