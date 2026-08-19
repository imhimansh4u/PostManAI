import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { combinedTestStats , getRecentActivity} from "../Controllers/BonusControllers.js";

const router = Router();

// to get all the stats
router.route("/dashboard/getStats").get(verifyJWT,combinedTestStats);
// Now to get the Recent Stats

router.route("/dashboard/activity").get(verifyJWT,getRecentActivity);

export default router;
