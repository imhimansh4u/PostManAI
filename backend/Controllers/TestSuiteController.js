import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Project from "../models/Project.js";
import Test from "../models/Test.js";
import TestSuite from "../models/TestSuite.js";

// For Creating a new Test Suite
const createTestSuite = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { name, description, color } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Suite name is required");
  }

  // Ownership check — never trust projectId alone, always scope to req.user
  const project = await Project.findOne({
    _id: projectId,
    userId: req.user._id,
  });
  if (!project) throw new ApiError(404, "Project not found");

  const suite = await TestSuite.create({
    projectId,
    userId: req.user._id,
    name: name.trim(),
    description: description?.trim() || null,
    color: color || "#7c3aed",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, suite, "Test suite created successfully"));
});

// For Fetching all the TestSuites
const FetchTestSuite = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid Project ID");
  }
  const project = await Project.findOne({
    _id: projectId,
    userId: req.user._id,
  });
  if (!project) {
    throw new ApiError(404, "Project Does Not Exists");
  }
  const allSuites = await TestSuite.find({
    userId: req.user._id,
    projectId,
  }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        allSuites,
        "Here is the TestSuites for this Project",
      ),
    );
});

// for adding a TestRun to a TestSuite
const linkTestRunToSuite = asyncHandler(async (req, res) => {
  const { runId, suiteId } = req.params;
  const userId = req.user._id;

  // Validate ObjectIds properly — isValid(), not the constructor
  if (
    !mongoose.Types.ObjectId.isValid(suiteId) ||
    !mongoose.Types.ObjectId.isValid(runId)
  ) {
    return res.status(400).json({ message: "Invalid suiteId or runId" });
  }

  const session = await mongoose.startSession();

  try {
    let updatedSuite;

    await session.withTransaction(async () => {
      // Fetch the TestRun — Model is capitalized, instance var is lowercase
      const testRun = await TestRun.findOne({
        _id: runId,
        userId,
      }).session(session);

      if (!testRun) {
        throw new ApiError(404, "TestRun not found or not owned by user");
      }

      // Fetch the suite, scoped to the same user
      const testSuite = await TestSuite.findOne({
        _id: suiteId,
        userId,
      }).session(session);

      if (!testSuite) {
        throw new ApiError(404, "TestSuite does not exist");
      }

      // IDOR guard: run and suite must belong to the same project
      if (!testRun.projectId.equals(testSuite.projectId)) {
        throw new ApiError(
          400,
          "TestRun and TestSuite belong to different projects",
        );
      }

      // Atomic link — filter itself is the concurrency guard.
      // Only succeeds if this run isn't already linked to a suite.
      const linkedRun = await TestRun.findOneAndUpdate(
        { _id: runId, userId, suiteId: null },
        { $set: { suiteId } },
        { new: true, session },
      );

      if (!linkedRun) {
        throw new ApiError(409, "TestRun is already linked to a TestSuite");
      }

      // Update suite stats atomically via $inc — never read-modify-write
      const isPassing = linkedRun.status === "pass";

      updatedSuite = await TestSuite.findOneAndUpdate(
        { _id: suiteId, userId },
        {
          $inc: {
            "stats.totalTests": 1,
            ...(isPassing ? { "stats.passing": 1 } : { "stats.failing": 1 }), // fail AND error both land here
          },
          $set: { "stats.lastRunAt": linkedRun.runAt },
        },
        { new: true, session },
      );
    });

    // res.json() only ever serializes ONE argument — wrap in your ApiResponse
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedSuite.stats, "TestRun linked to TestSuite"),
      );
  } catch (error) {
    // Caught as `error`, referenced as `error` — not `err`
    const status = error.statusCode || 500; // CONFIRM this field name against your actual ApiError class
    const message = error.message || "Failed to link TestRun to TestSuite";
    return res.status(status).json({ message });
  } finally {
    await session.endSession();
  }
});


// To get all the tests of a TestSuite
const fetchTestRunsBySuite = asyncHandler(async (req, res) => {
  const { suiteId } = req.params;
  const userId = req.user._id;

  // Pagination params, with sane defaults and a hard ceiling on limit
  // so a client can't request limit=999999 and blow up the response.
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(suiteId)) {
    throw new ApiError(400, "Invalid Suite ID");
  }

  // Ownership check first — never let a user query runs for a suite
  // they don't own, even indirectly through suiteId alone.
  const testSuite = await TestSuite.findOne({
    _id: suiteId,
    userId,
  });

  if (!testSuite) {
    throw new ApiError(404, "TestSuite does not exist");
  }

  // Run both queries in parallel — the count doesn't depend on the
  // page of results, so there's no reason to wait for one before
  // starting the other.
  const [testRuns, totalRuns] = await Promise.all([
    TestRun.find({ suiteId, userId })
      .sort({ runAt: -1 }) // uses the {suiteId, runAt} index — no collection scan
      .skip(skip)
      .limit(limit),
    TestRun.countDocuments({ suiteId, userId }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        testRuns,
        pagination: {
          page,
          limit,
          totalRuns,
          totalPages: Math.ceil(totalRuns / limit),
        },
      },
      "Here are the TestRuns for this Suite",
    ),
  );
});

export {
  linkTestRunToSuite,
  FetchTestSuite,
  createTestSuite,
  fetchTestRunsBySuite,
};
