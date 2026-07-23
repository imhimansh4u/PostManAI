import { Router } from "express";
import {
  linkTestRunToSuite,
  FetchTestSuite,
  createTestSuite,
  fetchTestRunsBySuite,
} from "../Controllers/TestSuiteController.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// to create a new test Suite
router.route("/create/:projectId").post(verifyJWT, createTestSuite);
// To fetch all the test suits
router.route("/fetch/:projectId").get(verifyJWT, FetchTestSuite);
// to link a TestRun to a perticular Suite
router.route("/link/:runId/:suiteId").put(verifyJWT, linkTestRunToSuite);
// to fetch all the testRuns of a Suite
router.route("/testruns/:suiteId").get(verifyJWT, fetchTestRunsBySuite);
export default router