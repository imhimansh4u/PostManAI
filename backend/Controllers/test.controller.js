import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Project from "../models/Project.js";
import Test from "../models/Test.js";
import TestRun from "../models/Testrun.js";

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

  const fullUrl = `${project.baseUrl}${testCase.url}`;

  const headers = {};
  if (!["GET", "DELETE"].includes(testCase.method)) {
    headers["Content-Type"] = "application/json";
  }

  if (project.auth.type === "Bearer" && project.auth.token) {
    headers["Authorization"] = `Bearer ${project.auth.token}`;
  } else if (project.auth.type === "Basic" && project.auth.token) {
    headers["Authorization"] = `Basic ${project.auth.token}`;
  } else if (project.auth.type === "API-Key" && project.auth.token) {
    headers[project.auth.headerName || "x-api-key"] = project.auth.token;
  }

  if (testCase.headers) {
    Object.assign(headers, testCase.headers);
  }

  Object.keys(headers).forEach((key) => {
    if (headers[key] === "Bearer {{token}}" || headers[key] === "{{token}}") {
      delete headers[key];
    }
  });

  let status;
  let actualStatus = null;
  let actualBody = null;
  let responseTime = null;
  let errorMessage = null;
  let aiAnalysis = {};

  try {
    const start = Date.now();
    const fetchOptions = { method: testCase.method, headers };

    if (!["GET", "DELETE"].includes(testCase.method) && testCase.body) {
      fetchOptions.body = JSON.stringify(testCase.body);
    }

    const response = await fetch(fullUrl, fetchOptions);
    responseTime = Date.now() - start;
    actualStatus = response.status;

    try {
      actualBody = await response.json();
    } catch {
      actualBody = await response.text();
    }

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

  // Step 7 — AI Analysis (only for fail/error)
  if (status === "fail" || status === "error") {
    try {
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || "http://localhost:8000";
      const aiResponse = await fetch(`${aiServiceUrl}/ai/explain-error`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": process.env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({
          endPoint: testCase.url,
          expectedStatus: testCase.expectedStatus,
          actualStatus,
          responseBody: actualBody,
          assertionsFailed: assertionResults
            .filter((r) => !r.passed)
            .map((r) => r.assertion),
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        aiAnalysis = {
          shortExplanation: aiData.shortExplanation,
          suggestedFix: aiData.suggestedFix,
          generated: true,
          generatedAt: new Date(),
        };
      }
    } catch (err) {
      console.warn("AI analysis failed:", err.message);
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
          aiAnalysis,
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

    if (status === "pass" && actualBody) {
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

    await session.commitTransaction();
  } catch (dbError) {
    await session.abortTransaction();
    console.error(
      "Database updates failed. Rollback triggered:",
      dbError.message,
    );
    throw new ApiError(500, "Failed to save test execution log securely.");
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
        aiAnalysis,
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
    const aiUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
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

    throw new ApiError(500, `AI Test Generation Failed: ${error.message}`);
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
const evaluateAssertions = (assertions, actualBody, responseTime) => {
  return assertions.map((assertion) => {
    try {
      // responseTime check
      // "responseTime < 500"
      if (assertion.startsWith("responseTime")) {
        const [, operator, value] = assertion.match(
          /responseTime\s*([<>]=?|===)\s*(\d+)/,
        );
        const numValue = Number(value);
        let passed = false;
        if (operator === "<") passed = responseTime < numValue;
        if (operator === ">") passed = responseTime > numValue;
        if (operator === "<=") passed = responseTime <= numValue;
        if (operator === ">=") passed = responseTime >= numValue;
        if (operator === "===") passed = responseTime === numValue;
        return { assertion, passed, actual: `${responseTime}ms`, error: null };
      }

      // Extract the path from assertion
      // "response.body.token exists" → path = "token"
      // "response.body.user.email === 'x'" → path = "user.email"
      const existsMatch = assertion.match(/^response\.body\.(.+?)\s+exists$/);
      const equalsMatch = assertion.match(
        /^response\.body\.(.+?)\s*(===|!==)\s*(.+)$/,
      );
      const lengthMatch = assertion.match(
        /^response\.body\.(.+?)\.length\s*([<>]=?|===)\s*(\d+)$/,
      );

      // Helper — resolve nested path from object
      // getNestedValue(body, "user.email") → body.user.email
      const getNestedValue = (obj, path) => {
        return path.split(".").reduce((current, key) => {
          return current !== undefined && current !== null
            ? current[key]
            : undefined;
        }, obj);
      };

      // EXISTS check
      // "response.body.token exists"
      if (existsMatch) {
        const path = existsMatch[1];
        const actual = getNestedValue(actualBody, path);
        const passed = actual !== undefined && actual !== null;
        return { assertion, passed, actual: String(actual), error: null };
      }

      // EQUALS / NOT EQUALS check
      // "response.body.success === true"
      // "response.body.user.email === 'test@test.com'"
      if (equalsMatch) {
        const path = equalsMatch[1];
        const operator = equalsMatch[2];
        let expectedValue = equalsMatch[3].trim();

        // Parse expected value type
        if (expectedValue === "true") expectedValue = true;
        else if (expectedValue === "false") expectedValue = false;
        else if (expectedValue === "null") expectedValue = null;
        else if (!isNaN(expectedValue)) expectedValue = Number(expectedValue);
        else expectedValue = expectedValue.replace(/^['"]|['"]$/g, ""); // strip quotes

        const actual = getNestedValue(actualBody, path);
        const passed =
          operator === "==="
            ? actual === expectedValue
            : actual !== expectedValue;

        return { assertion, passed, actual: String(actual), error: null };
      }

      // LENGTH check
      // "response.body.items.length > 0"
      if (lengthMatch) {
        const path = lengthMatch[1];
        const operator = lengthMatch[2];
        const expectedLength = Number(lengthMatch[3]);
        const actual = getNestedValue(actualBody, path);
        const actualLength = Array.isArray(actual) ? actual.length : 0;

        let passed = false;
        if (operator === ">") passed = actualLength > expectedLength;
        if (operator === "<") passed = actualLength < expectedLength;
        if (operator === ">=") passed = actualLength >= expectedLength;
        if (operator === "<=") passed = actualLength <= expectedLength;
        if (operator === "===") passed = actualLength === expectedLength;

        return {
          assertion,
          passed,
          actual: `length ${actualLength}`,
          error: null,
        };
      }

      // Unrecognized assertion format
      return {
        assertion,
        passed: false,
        actual: null,
        error: "Unrecognized assertion format",
      };
    } catch (err) {
      return { assertion, passed: false, actual: null, error: err.message };
    }
  });
};

// To change the Test details
// const changeTestDetails = asyncHandler(async (req,res) => {
//   const
// })
export { runTest, getTests };
