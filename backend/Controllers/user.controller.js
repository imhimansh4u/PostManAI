import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/User.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { upload } from "../middleware/multer.middleware.cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User is not found");
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.log("ERROR IN TOKEN GENERATION:", error);
    throw new ApiError(
      500,
      "Somethig went wrong while generating access and Refresh Tokens",
    );
  }
};

//Method To Register the user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body; // Get all the details from the body

  if (
    [name, email, password].some((field) => field?.trim() === "") // validators
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //checking that user already exists or not
  const existedUser = await User.findOne({
    $or: [{ email }],
  });

  if (existedUser) {
    // Return 409 Conflict instead of throwing a generic server error
    return res.status(409).json({
      success: false,
      message: "User already exists with this email.",
    });
  }
  const avatarLocalPath = req.files?.avatar?.[0]?.path; // For the avatar
  let avatar;
  let createdUser;

  if (avatarLocalPath) {
    try {
      avatar = await uploadOnCloudinary(avatarLocalPath);
      if (!avatar?.secure_url) {
        throw new ApiError(500, "Failed to upload avatar");
      }
      console.log("Avatar image uploaded succesfully", avatar);
    } catch (error) {
      console.log("Error Uploading avatar", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, "Failed to upload avatar");
    }
  }

  try {
    const newuser = await User.create({
      // Finally Create a new User
      name,
      avatar: avatar?.secure_url || null,
      email,
      password,
    });

    createdUser = await User.findById(newuser._id).select(
      "-password -refreshToken", // It means dont return these things
    );
    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user",
      );
    }
    // if all good
    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User Registered Succesfully"));
  } catch (error) {
    console.log("Error while registering the user", error);
    if (avatar?.public_id) {
      await deleteFromCloudinary(avatar.public_id); //  It means if anyhow failed to Register then simply Delete the avatar from Cloudingary
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Something went Wrong while Registering the User");
  }
});

// Now function to Login a Existing User
const loginUser = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if ([email, password].some((field) => field?.trim() === "")) {
      return res
        .status(400)
        .json({ success: false, message: "Every field is required" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Couldn't find the user, Please register",
        });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Please enter Correct Credentials" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id,
    );
    const loggedinUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );

    if (!loggedinUser) {
      return res
        .status(404)
        .json({ success: false, message: "This user is not found" });
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, loggedinUser, "User is logged in successfully"),
      );
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Login failed" });
  }
});

// to logout any user
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: null,
      },
    },
    { returnDocument: "after" }, // // This actually sets that the returned value will now be the new one ...
  );
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  return res
    .status(200)
    .clearCookie("accessToken", options) // clear Access token information from the Cookies
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User is logged out successfully"));
});

// Get the currently logged in user
// This route is protected — only works if user has valid JWT cookie
const getCurrentUser = asyncHandler(async (req, res) => {
  // req.user is set by your authMiddleware after verifying JWT
  // So we just return whatever user is already attached to the request
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken", // never send sensitive fields
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

export {
  generateAccessAndRefreshToken,
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
};
