import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// User Schema
// This can Handles both regular email/password auth AND GitHub OAuth users.
// A user can connect GitHub OAuth separately after registering normally.

const UserSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [60, "Name cannot exceed 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    //Password (null for pure GitHub OAuth users)
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      default: null,
      // Never return password in any query by default
      select: false,
    },
    avatar: {
      type: String, // URL to profile picture
      default: null,
    },
    // GitHub OAuth Fields
    // Populated when user connects GitHub (OAuth flow)
    github: {
      connected : {type : Boolean , default :false},
      githubId: { type: String, default: null }, // GitHub user ID
      username: { type: String, default: null }, // GitHub @username
      accessToken: { type: String, default: null, select: false }, // Encrypted OAuth token
      profileUrl: { type: String, default: null }, // github.com/username
      connectedAt: { type: Date, default: null },
    },
    //Account Status
    isVerified: {
      type: Boolean,
      default: false, // for future email verification feature
    },
    isActive: {
      type: Boolean,
      default: true, // soft disable account without deleting (Future Work)
    },
    // Password Reset
    resetPasswordToken: { type: String, default: null, select: false },
    resetPasswordExpiry: { type: Date, default: null, select: false },
    refreshToken: {
      type: String,
      default: null,
      select: false, // never expose in API responses
    },
    //Meta
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true, // adds createdAt, updatedAt automatically
  },
);

//  Pre-save Hook: Hash password before saving
UserSchema.pre("save", async function () {
  // Never use a next in pre hook,,,
  // Only hash if password field was modified
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

//Instance Method: Compare password on login
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

//Instance Method: Safe user object (no sensitive fields)
UserSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    github: {
      username: this.github?.username,
      profileUrl: this.github?.profileUrl,
      connectedAt: this.github?.connectedAt,
      connected: this.github?.connected,
    },
    isVerified: this.isVerified,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt,
  };
};

// Generate the Access token
UserSchema.methods.generateAccessToken = async function () {
  // We keep the payload small to save bandwidth on every request
  const payload = {
    id: this._id,
    email: this.email,
  };

  // Sign the token using a secret key and set an expiration time
  const tokenPayload = {
    _id: this._id,
    email: this.email,
  };
  return jwt.sign(tokenPayload, process.env.ACCESS_TOKEN_KEY, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d", // Defaults to 1 day if not specified
  });
};

// Now refresh tokens
UserSchema.methods.generateRefreshToken = async function () {
  // short lived access token
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_KEY,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
  );
};
// Indexes

UserSchema.index({ "github.githubId": 1 });

export default mongoose.model("User", UserSchema);
