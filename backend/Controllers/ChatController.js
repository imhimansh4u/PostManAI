import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { runTest } from "./test.controller.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import axios from "axios";

import { sanitizeHeaders } from "../utils/filterHeader.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
const AI_TIMEOUT_MS = 20000;

const buildContext = (testRun) => ({
  testRunId: testRun._id.toString(),
  testId: testRun.testId._id.toString(),
  projectId: testRun.projectId._id.toString(),
  testName: testRun.testId.name,
  requestSnapshot: {
    method: testRun.requestSnapshot.method,
    url: testRun.requestSnapshot.url,
    headers: sanitizeHeaders(testRun.requestSnapshot.headers),
    body: testRun.requestSnapshot.body,
  },
  status: testRun.status,
  expectedStatus: testRun.expectedStatus,
  actualStatus: testRun.actualStatus,
  actualBody: testRun.actualBody,
  responseTime: testRun.responseTime,
  assertionResults: testRun.assertionResults,
  errorMessage: testRun.errorMessage,
  isRegression: testRun.isRegression,
});

export const startChat = asyncHandler(async (req, res) => {
  try {
    const context = buildContext(req.testRun);
    console.log("start chat called");
    const { data } = await axios.post(
      `${AI_SERVICE_URL}/chat/start`,
      { context, projectId: context.projectId },
      { timeout: AI_TIMEOUT_MS },
    );
    console.log("called");
    res.status(200).json(new ApiResponse(200, data, "Chat Started"));
  } catch (error) {
    console.error("AI service error:", error.response?.data ?? error.message);
    res.status(502).json({
      message: "AI assistant unavailable right now",
      error: error.response?.data ?? error.message,
    });
  }
});

export const sendChatMessage = asyncHandler(async (req, res) => {
  try {
    const { runId } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ message: "Message is Required" });
    }

    const { data } = await axios.post(
      `${AI_SERVICE_URL}/chat/message`,
      { testRunId: runId, message },
      { timeout: AI_TIMEOUT_MS },
    );

    return res.status(200).json(new ApiResponse(200, data, "Message send"));
  } catch (error) {
    console.error("AI service error:", error.response?.data ?? error.message);
    res.status(502).json({
      message: "AI assistant unavailable right now",
      error: error.response?.data ?? error.message,
    });
  }
});
