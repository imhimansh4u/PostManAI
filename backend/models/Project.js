import mongoose from "mongoose";
//  Project Schema
// A Project = one API being tested. It holds the base URL,
// auth config, GitHub repo connection, and RAG indexing status.
// One user can have many projects.

const ProjectSchema = new mongoose.Schema(
  {
    //Ownership
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    //Basic Info
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [80, "Project name cannot exceed 80 characters"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      default: null,
    },

    // API Config
    // Base URL for all tests in this project
    // e.g. "https://api.myapp.com" or "http://localhost:5000"
    baseUrl: {
      type: String,
      required: [true, "Base URL is required"],
      trim: true,
    },

    // auth section , for any specific testing
    auth: {
      type: {
        type: String,
        enum: ["Bearer", "Basic", "API-Key", "None"],
        default: "None",
      },
      token: { type: String, default: null, select: false },
      headerName: { type: String, default: "x-api-key" },
    },

    // GitHub Integration
    github: {
      // Is GitHub repo connected to this project?
      connected: { type: Boolean, default: false },

      // "owner/repo-name" format e.g. "himanshu/my-api"
      repoFullName: { type: String, default: null },
      // Branch to scan (default: main)
      branch: { type: String, default: "main" },
      // When was repo last scanned and indexed?
      lastSynced: { type: Date, default: null },
      // How many endpoint chunks were indexed into ChromaDB?
      endpointCount: { type: Number, default: 0 },
      // Current state of the indexing pipeline
      // "idle"     → never synced
      // "indexing" → currently scanning + embedding
      // "ready"    → indexed and available for RAG
      // "error"    → last sync failed
      indexStatus: {
        type: String,
        enum: ["idle", "indexing", "ready", "error"],
        default: "idle",
      },
      // Error message if indexStatus === "error"
      indexError: { type: String, default: null },
      // List of file paths that were indexed
      // e.g. ["routes/auth.js", "routes/cart.js"]
      indexedFiles: { type: [String], default: [] },
    },

    //Manual Schema (Option B: no GitHub)
    // User can paste OpenAPI JSON or plain text schema here
    // Python service will chunk + embed this instead of GitHub files
    manualSchema: {
      type: String,
      default: null,
    },

    // Which RAG source is active for this project?
    // "github" → uses GitHub repo chunks in ChromaDB
    // "manual" → uses pasted schema chunks in ChromaDB
    // "none"   → no RAG context, AI generates without codebase context
    ragSource: {
      type: String,
      enum: ["github", "manual", "none"],
      default: "none",
    },

    //Project Stats (denormalized for fast dashboard)
    stats: {
      totalTests: { type: Number, default: 0 },
      totalRuns: { type: Number, default: 0 },
      passing: { type: Number, default: 0 },
      failing: { type: Number, default: 0 },
    },

    // Soft Delete
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);
//  Indexes
ProjectSchema.index({ userId: 1, createdAt: -1 });
ProjectSchema.index({ userId: 1, isArchived: 1 });

export default mongoose.model("Project", ProjectSchema);
