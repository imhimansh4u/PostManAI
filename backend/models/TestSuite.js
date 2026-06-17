import mongoose from "mongoose";
// TestSuite Schema
// A Suite groups multiple Tests together so you can run them
// all at once. e.g. "Auth Tests", "Cart Tests", "Checkout Tests"
// One project can have many suites.

const TestSuiteSchema = new mongoose.Schema(
  {
    //Ownership
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    //  Basic Info 
    name: {
      type: String,
      required: [true, "Suite name is required"],
      trim: true,
      maxlength: [80, "Suite name cannot exceed 80 characters"],
    },

    description: {
      type: String,
      trim: true,
      default: null,
    },

    // Suite Color Tag (for UI) 
    // Hex color to visually distinguish suites in the sidebar
    color: {
      type: String,
      default: "#7c3aed",
    },

    //Stats (denormalized for fast suite view) 
    stats: {
      totalTests: { type: Number, default: 0 },
      passing:    { type: Number, default: 0 },
      failing:    { type: Number, default: 0 },
      lastRunAt:  { type: Date,   default: null },
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes 
TestSuiteSchema.index({ projectId: 1, createdAt: -1 });

export default mongoose.model("TestSuite",TestSuiteSchema);