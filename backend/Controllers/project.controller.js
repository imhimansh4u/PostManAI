import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Project from "../models/Project.js";
import Cookie from "../models/Cookie.js";

const newProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  const { name, baseUrl, description, authToken } = req.body;
  if (
    !name ||
    !baseUrl ||
    typeof name !== "string" ||
    typeof baseUrl !== "string" ||
    name.trim() === "" ||
    baseUrl.trim() === ""
  ) {
    throw new ApiError(
      400,
      "Name and Base URL are required and must be valid text",
    );
  }
  // Check that any Project with similar name exists for that User or not
  const existingProject = await Project.findOne({
    userId: userId,
    name: name,
  });
  if (existingProject) {
    throw new ApiError(
      409,
      "Project with this already exists for You, Please Choose a new Name",
    );
  }
  try {
    let des = "";
    let authTokenused = "";
    if (description) {
      des = description;
    }
    if (authToken) {
      authTokenused = authToken;
    }

    const newProject = await Project.create({
      userId: userId,
      name: name,
      description: des,
      baseUrl: baseUrl,
      authToken: authTokenused,
    });
    const createdProject = await Project.findOne(newProject._id).select(
      "-authToken",
    );
    if (!createdProject) {
      throw new ApiError(
        500,
        "Something Went Wrong While Creating the New Projectee",
      );
    }
    // if all good
    return res
      .status(201)
      .json(new ApiResponse(201, createdProject, "Project Added Succesfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "Something went Wrong while Creating a new Projectssssssss",
    );
  }
});

// To List all the Projects
const listAllProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    userId: req.user._id,
    isArchived: false,
  })
    .sort({ createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

// TO Fetch A single Project Detail
const fetchProjectDetail = asyncHandler(async (req, res) => {
  const { projectid } = req.params;
  if (!projectid) {
    throw new ApiError(400, "Project Id is Required");
  }
  const project = await Project.findOne({
    _id: projectid,
    userId: req.user._id,
  });
  if (!project) {
    console.log("Project Does not Exists");
    throw new ApiError(404, "project does not exists");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project fetched Successfully"));
});

const updateCookies = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { cookies } = req.body;

  if (
    !projectId ||
    !cookies ||
    typeof cookies !== "object" ||
    Array.isArray(cookies)
  ) {
    throw new ApiError(422, "projectId and a cookies object are required");
  }

  const project = await Project.findOne({
    _id: projectId,
    userId: req.user._id,
  });
  if (!project) throw new ApiError(404, "Project not found");

  // Validate every value BEFORE writing anything — fail the whole request up front
  // rather than partially applying a batch and silently dropping bad entries.
  const entries = Object.entries(cookies);
  if (entries.length === 0) {
    throw new ApiError(422, "cookies object must contain at least one entry");
  }
  for (const [name, value] of entries) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new ApiError(
        422,
        `Invalid value for cookie "${name}": must be a non-empty string`,
      );
    }
  }

  // Derive default domain from project.baseUrl for host-only cookie semantics
  let defaultDomain = null;
  try {
    if (project.baseUrl) {
      defaultDomain = new URL(project.baseUrl).hostname;
    }
  } catch (err) {
    defaultDomain = null;
  }

  const now = new Date();
  const path = "/"; // manual edits are assumed project-wide unless UI later exposes path override

  // All-or-nothing: run every upsert inside a transaction so a mid-batch failure
  // doesn't leave some cookies updated and others not, with a misleading 200 response.
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Full replace: wipe all existing cookies for this project first.
    // Safe inside the transaction — the insert below only becomes visible
    // atomically with this delete, so a reader never sees a "cookie gap".
    await Cookie.deleteMany({ projectId }, { session });

    const docsToInsert = entries.map(([name, value]) => ({
      projectId,
      name,
      value,
      domain: defaultDomain,
      path,
      lastSeen: now,
      // httpOnly/secure/sameSite/expires all fall back to schema defaults
      // (false/false/null/null) since insertMany doesn't run $setOnInsert logic
    }));

    await Cookie.insertMany(docsToInsert, { session, ordered: true });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw new ApiError(500, `Failed to update cookies: ${err.message}`);
  } finally {
    session.endSession();
  }

  // Re-fetch fresh, non-expired state to return to the client
  const cookiesFromDb = await Cookie.find({
    projectId,
    $or: [{ expires: null }, { expires: { $gte: now } }],
  });

  // Flat map keyed by name+domain to avoid collapsing same-name cookies on different hosts
  const mapping = {};
  cookiesFromDb.forEach((c) => {
    mapping[`${c.domain || "default"}:${c.name}`] = c.value;
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { cookies: mapping, cookieList: cookiesFromDb },
        "Cookies updated",
      ),
    );
});

// Fetch project's cookie jar
const fetchCookies = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!projectId) throw new ApiError(422, "projectId is required");

  const project = await Project.findOne({
    _id: projectId,
    userId: req.user._id,
  });
  if (!project) throw new ApiError(404, "Project not found");

  const now = new Date();
  const cookiesFromDb = await Cookie.find({
    projectId,
    $or: [{ expires: null }, { expires: { $gte: now } }],
  });
  const mapping = {}; // contains only the (name:value) information about the cookies
  const detailed = []; // Contains the full metadata of the Cookies also
  cookiesFromDb.forEach((c) => {
    mapping[c.name] = c.value;
    detailed.push({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite,
      expires: c.expires,
    });
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { cookies: mapping, cookieList: detailed },
        "Project cookies fetched",
      ),
    );
});
// To Fetch all the Cookies related to this Project
export {
  newProject,
  listAllProjects,
  fetchProjectDetail,
  updateCookies,
  fetchCookies,
};
