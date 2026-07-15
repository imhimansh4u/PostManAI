import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  runTest,
  getTests,
  updateTest,
  updateCookies,
  fetchCookies,
} from "../Controllers/test.controller.js";

const router = Router();

//TO get all the test
router.route("/get-tests").post(verifyJWT, getTests);
// TO run a Test 
router.route("/run").post(verifyJWT, runTest);
// To Update any Test case
router.route("/:testId").patch(verifyJWT, updateTest);
// Cookies: update manually or fetch current jar
router
  .route("/projects/:projectId/cookies")
  .get(verifyJWT, fetchCookies)
  .post(verifyJWT, updateCookies);
export default router;
