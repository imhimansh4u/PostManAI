import { Router } from "express";
import {
  connectGithub,
  githubCallback,
  selectRepo,
  syncRepo,
  disconnectGithub,
  getRepos,
  getBranches,
  deleteIndexedFiles
} from "../Controllers/github.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit"


const router = Router();

// For the Rate Limiting in the Frontend
const syncLimiter = rateLimit({
   windowMs: 24 * 60 * 60 * 1000, // 24 hours
   max: 5, // max 5 syncs per project per day
   message: "Too many sync requests. Maximum 5 syncs per day allowed."
});


router.route("/connect").get(verifyJWT, connectGithub);
router.route("/callback").get(githubCallback);
router.route("/select-repo").post(verifyJWT, selectRepo);
router.route("/sync").post(verifyJWT,syncLimiter,syncRepo);
router.route("/disconnect").delete(verifyJWT, disconnectGithub);
router.route("/repos").get(verifyJWT, getRepos);
router.route("/branches").get(verifyJWT, getBranches);
router.route("/delete-indexed-files").delete(verifyJWT,deleteIndexedFiles);

export default router;
