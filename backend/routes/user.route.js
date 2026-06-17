import { Router } from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
} from "../Controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router =  Router();
router.route("/register").post(registerUser);

// Route for the Login Part
router.route("/login").post(loginUser);

// ROute for the logout Part
router.route("/logout").post(verifyJWT, logoutUser); // Here verifyJWT is a middleware which firstly do its operation and then pass the control to logoutUser through the help of next()..

// To get the Current User
router.route("/me").get(verifyJWT, getCurrentUser);
export default router;
