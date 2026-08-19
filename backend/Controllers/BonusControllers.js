import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import TestRun from "../models/Testrun.js";
// Aggregation Logic
const getTestStats = async (matchStage) => {
  const [stats] = await TestRun.aggregate([
    { $match: matchStage },
    { $sort: { testId: 1, runAt: -1 } },
    {
      $group: {
        _id: "$testId",
        latestStatus: { $first: "$status" },
      },
    },
    {
      $group: {
        _id: null,
        totalTestCases: { $sum: 1 },
        totalPassing: {
          $sum: { $cond: [{ $eq: ["$latestStatus", "pass"] }, 1, 0] },
        },
        totalFailing: {
          $sum: {
            $cond: [{ $in: ["$latestStatus", ["fail", "error"]] }, 1, 0],
          },
        },
      },
    },
  ]);

  return stats
    ? {
        totalTestCases: stats.totalTestCases,
        totalPassing: stats.totalPassing,
        totalFailing: stats.totalFailing,
      }
    : { totalTestCases: 0, totalPassing: 0, totalFailing: 0 };
};

// GET /dashboard/stats                 // gives global stats only
// GET /dashboar/stats?projectId=xyz   / Gives global + project-specific stats
const combinedTestStats = asyncHandler(async (req, res) => {
  const { projectId } = req.query; // note: query param now, not a required route param
  const userId = req.user._id;

  // Global stats always run — no dependency on projectId
  const globalStatsPromise = getTestStats({
    userId: new mongoose.Types.ObjectId(userId),
  });

  // Project stats only run if a projectId was actually passed
  const projectStatsPromise = projectId
    ? getTestStats({
        userId: new mongoose.Types.ObjectId(userId),
        projectId: new mongoose.Types.ObjectId(projectId),
      })
    : Promise.resolve(null);

  const [globalStats, projectStats] = await Promise.all([
    globalStatsPromise,
    projectStatsPromise,
  ]);

  const responseData = {
    global: globalStats,
    project: projectStats, // will be `null` if no projectId was passed
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, responseData, "Test stats fetched successfully"),
    );
});

// Now to Get the Recent Activity
// GET /dashboard/activity              →  For recent runs across all projects
// GET /dashboard/activity?projectId=x  →  For recent runs scoped to one project
// GET /dashboard/activity?limit=20     -- For override default page size
const getRecentActivity = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId, limit = 10 } = req.query;

  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
    throw new ApiError(400, "limit must be an integer between 1 and 100");
  }

  const matchStage = { userId: new mongoose.Types.ObjectId(userId) };

  if (projectId) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new ApiError(400, "Invalid projectId");
    }
    matchStage.projectId = new mongoose.Types.ObjectId(projectId);
  }

  const runs = await TestRun.find(matchStage)
    .sort({ runAt: -1 })
    .limit(parsedLimit)
    .populate({ path: "projectId", select: "name" }) // only join we actually need
    .lean();

  const activity = runs.map((run) => ({
    runId: run._id,
    projectName: run.projectId?.name || "Unknown Project",
    method: run.requestSnapshot?.method || null,
    url: run.requestSnapshot?.url || null,
    status: run.status,                 // "pass" | "fail" | "error"
    expectedStatus: run.expectedStatus,
    actualStatus: run.actualStatus,
    responseTime: run.responseTime,     // ms — useful for spotting slow endpoints at a glance
    triggeredBy: run.triggeredBy,       // "manual" | "suite" | "regression-check"
    isRegression: run.isRegression,     // flag a run that broke something that was passing before
    runAt: run.runAt,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, activity, "Recent activity fetched successfully"));
});




export { combinedTestStats,getRecentActivity };
