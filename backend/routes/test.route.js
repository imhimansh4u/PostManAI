import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { runTest, getTests } from "../Controllers/test.controller.js";

const router = Router();

//TO get all the test
router.route("/get-tests").post(verifyJWT, getTests);
router.route("/run").post(verifyJWT, runTest);

export default router;
