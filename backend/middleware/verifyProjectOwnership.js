// middleware/verifyProjectOwnership.js
import TestRun from "../models/Testrun.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyProjectOwnership = asyncHandler(async (req, res, next) => {
  try {
    const { runId } = req.params;

    const testRun = await TestRun.findById(runId)
      .populate("testId", "name method")
      .populate("projectId", "userId");

    if (!testRun) {
      return res.status(404).json({ message: "Test run not found" });
    }
    if (testRun.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized for this test run" });
    }

    req.testRun = testRun; // It simply means ki pass this data to the next controller which will handle this data , otherwise we have to refetch this data from the mongodb server
    next();
  } catch (err) {
    res
      .status(500)
      .json({ message: "Ownership check failed", error: err.message });
  }
});
