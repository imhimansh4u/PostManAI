import { Router } from "express";
import {
  newProject,
  listAllProjects,
  fetchProjectDetail,
  fetchCookies,
  updateCookies,
} from "../Controllers/project.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/newProject").post(verifyJWT, newProject);
router.route("/listAllProjects").get(verifyJWT, listAllProjects);
router
  .route("/fetchprojectdetail/:projectid")
  .get(verifyJWT, fetchProjectDetail);
router
  .route("/cookies/:projectId")
  .get(verifyJWT, fetchCookies)
  .post(verifyJWT, updateCookies);

export default router;
