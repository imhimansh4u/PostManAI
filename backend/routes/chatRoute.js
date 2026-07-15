import { Router } from "express";
import { startChat, sendChatMessage } from "../Controllers/ChatController.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { verifyProjectOwnership } from "../middleware/verifyProjectOwnership.js";

const router = Router();

router
  .route("/chatbot/:runId/chat/start")
  .post(verifyJWT, verifyProjectOwnership, startChat);
router
  .route("/chatbot/:runId/chat/message")
  .post(verifyJWT, verifyProjectOwnership, sendChatMessage);

export default router;
