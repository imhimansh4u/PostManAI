// Controllers/githubController.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Project from "../models/Project.js";
import {
  buildGithubAuthUrl,
  exchangeCodeForToken,
  fetchUserRepos,
  fetchRepoBranches,
  fetchRepoRouteFiles,
} from "../Services/githubService.js";
import { Octokit } from "@octokit/rest";
import User from "../models/User.js";

// CONTROLLER 1 — connectGithub

const connectGithub = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);
  if (user?.github?.connected) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/dashboard?github=already_connected`,
    );
  }
  const authUrl = buildGithubAuthUrl(req.user._id); //  Building the authURL
  res.redirect(authUrl); // Redirect to the AuthURL
});

// CONTROLLER 2 — githubCallback

const githubCallback = asyncHandler(async (req, res) => {
  // GitHub sends two things in the query params:
  // code  → one-time code to exchange for access token
  // state → whatever we sent earlier (our userId here)
  const { code, state: userId } = req.query;
  // If code is missing, user probably denied access on GitHub
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}`);
  }

  // If state/projectId is missing, something went wrong
  if (!userId) {
    return res.redirect(
      `${process.env.FRONTEND_URL}?github=error&reason=missing_user`,
    );
  }

  // Exchange the one-time code for a real access token
  // This is a server-to-server call — user never sees this
  // exchangeCodeForToken calls GitHub's API with your client_secret
  const accessToken = await exchangeCodeForToken(code);
  const octokit = new Octokit({ auth: accessToken });
  const { data: githubUser } = await octokit.rest.users.getAuthenticated();

  // ── SECURITY CHECK ──
  // Is this GitHub account already linked to a DIFFERENT PostmanAI user?
  const existingUser = await User.findOne({
    "github.githubId": githubUser.id.toString(),
  });

  if (existingUser && existingUser._id.toString() !== userId.toString()) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/dashboard?github=error&reason=account_already_linked`,
    );
  }

  // Save the access token to MongoDB
  // We use dot notation to update only the github nested fields
  // without overwriting the whole github object
  await User.findByIdAndUpdate(userId, {
    "github.githubId": githubUser.id.toString(), // "83742847" — never changes (random number)
    "github.username": githubUser.login, // It will show the github username (like ihimansh4u)
    "github.profileUrl": githubUser.avatar_url,
    "github.connectedAt": new Date(),
    "github.connected": true,
    "github.accessToken": accessToken,
  });

  res.redirect(`${process.env.FRONTEND_URL}`);
});

// To Get all the Repos
const getRepos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const user = await User.findOne({
    _id: userId,
  }).select("+github.accessToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.github.connected) {
    throw new ApiError(400, "GitHub is not connected");
  }

  const repos = await fetchUserRepos(user.github.accessToken);

  return res
    .status(200)
    .json(new ApiResponse(200, repos, "Repositories fetched successfully"));
});

// Controller 2.1-> Getting all branches of a repo
const getBranches = asyncHandler(async (req, res) => {
  const { repoFullName } = req.query;

  if (!repoFullName) {
    throw new ApiError(400, "Repository name is required");
  }

  const user = await User.findById(req.user?._id).select("+github.accessToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.github.connected || !user.github.accessToken) {
    throw new ApiError(400, "GitHub is not connected");
  }

  const [owner, repo] = repoFullName.split("/");

  if (!owner || !repo) {
    throw new ApiError(
      400,
      "Invalid repository format. Expected owner/repo-name",
    );
  }

  const formattedBranches = await fetchRepoBranches(
    user.github.accessToken,
    repoFullName,
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, formattedBranches, "Branches fetched successfully"),
    );
});

// CONTROLLER 3 — selectRepo
// What happens:
// After GitHub connects, user sees a dropdown of their repos
// They pick one → frontend calls this endpoint
// We save their selection to MongoDB
// Now we know WHICH repo to scan when they click Sync

const selectRepo = asyncHandler(async (req, res) => {
  const { projectId, repoFullName, branch = "main" } = req.body;

  // Validate required fields
  if (!projectId || !repoFullName || !branch) {
    throw new ApiError(
      400,
      "Project ID, repository name, and branch are required",
    );
  }

  // Verify project belongs to logged in user
  const project = await Project.findOne({
    _id: projectId,
    userId: req.user._id,
  });

  if (!project) {
    throw new ApiError(404, "Project not found");
  }
  const user = await User.findById(req.user?._id).select("+github.accessToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check GitHub is actually connected before selecting a repo
  if (!user.github.connected || !user.github.accessToken) {
    throw new ApiError(400, "GitHub is not connected to this User yet");
  }

  const [owner, repo] = repoFullName.split("/");

  if (!owner || !repo) {
    throw new ApiError(
      400,
      "Invalid repository format. Expected owner/repo-name",
    );
  }

  const branches = await fetchRepoBranches(
    user.github.accessToken,
    repoFullName,
  );
  const selectedBranch = branches.find((item) => item.name === branch);

  if (!selectedBranch) {
    throw new ApiError(400, "Selected branch does not exist in the repository");
  }

  // Save the selected repo and branch
  // indexStatus stays "idle" — user still needs to click Sync Now
  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    {
      "github.connected": true,
      "github.repoFullName": repoFullName,
      "github.branch": branch,
      "github.indexStatus": "idle",
    },
    { returnDocument: "after" }, // return the updated document
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        repoFullName: updatedProject.github.repoFullName,
        branch: updatedProject.github.branch,
        indexStatus: updatedProject.github.indexStatus,
      },
      `Repository ${repoFullName} on branch ${branch} saved successfully. Click Sync Now to index endpoints.`,
    ),
  );
});

// CONTROLLER 4 — syncRepo

// -> To sync the Repo

const syncRepo = asyncHandler(async (req, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    throw new ApiError(400, "Project ID is required");
  }

  // Fetch project WITH the sensitive accessToken field
  // Remember your schema has select: false on accessToken
  // The + prefix explicitly includes it in this query only

  const user = await User.findById(req.user._id).select("+github.accessToken");

  if (!user) throw new ApiError(404, "User not found");
  // Cant sync if Github is not Connected
  if (!user.github.connected) {
    throw new ApiError(400, "GitHub is not connected");
  }
  const project = await Project.findOne({
    _id: projectId,
    userId: req.user._id,
  });
  if (!project) throw new ApiError(404, "Project not found");
  // Can't sync if no repo has been selected yet
  if (!project.github.repoFullName) {
    throw new ApiError(
      400,
      "No repository selected. Please select a repository first",
    );
  }

  // Step 1: Mark as indexing immediately
  // This makes the sidebar show the spinner right away
  // User gets instant feedback that sync started
  await Project.findByIdAndUpdate(
    projectId,
    {
      "github.indexStatus": "indexing",
      "github.indexError": null,
    },
    { returnDocument: "after" },
  );

  // Step 2: Fetch route files from GitHub via Octokit
  // fetchRepoRouteFiles returns array of { path, content, size }
  const files = await fetchRepoRouteFiles(
    user.github.accessToken,
    project.github.repoFullName,
    project.github.branch,
  );

  // Step 3: Send files to Python AI service for RAG indexing
  // Python will chunk each file by endpoint
  // Embed using sentence-transformers
  // Store in ChromaDB with projectId as collection namespace
  const aiServiceUrl = process.env.AI_SERVICE_URL;
  if (!aiServiceUrl) {
    throw new ApiError(500, "AI_SERVICE_URL is not configured");
  }

  const aiResponse = await fetch(`${aiServiceUrl}/ai/index-repo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": process.env.INTERNAL_API_KEY,
    },
    body: JSON.stringify({
      projectId,
      repoFullName: project.github.repoFullName,
      files, // array of { path, content, size }
    }),
  });

  // If Python service returned an error
  if (!aiResponse.ok) {
    // Mark as error in MongoDB so sidebar shows error state
    await Project.findByIdAndUpdate(
      projectId,
      {
        "github.indexStatus": "error",
        "github.indexError": `AI service error: ${aiResponse.statusText}`,
      },
      { returnDocument: "after" },
    );
    throw new ApiError(500, "Failed to index repository. AI service error");
  }

  // Python returns how many endpoints it found and indexed
  const { endpointCount, indexedFiles } = await aiResponse.json();

  // Step 4: Update MongoDB with successful sync results
  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    {
      "github.indexStatus": "ready",
      "github.lastSynced": new Date(),
      "github.endpointCount": endpointCount,
      "github.indexedFiles": indexedFiles,
      "github.indexError": null,
      ragSource: "github", // tell the system to use GitHub chunks for RAG
    },
    { returnDocument: "after" },
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        endpointCount: updatedProject.github.endpointCount,
        indexedFiles: updatedProject.github.indexedFiles,
        lastSynced: updatedProject.github.lastSynced,
        indexStatus: updatedProject.github.indexStatus,
      },
      `Successfully indexed ${endpointCount} endpoints from ${project.github.repoFullName}`,
    ),
  );
});

// CONTROLLER 5 — disconnectGithub
// User clicks "Disconnect GitHub" in Settings
// We clear all GitHub related data from the project

const disconnectGithub = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user.github.connected) {
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User already Disconnected"));
  }
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      "github.connected": false,
      "github.accessToken": null,
      "github.githubId": null,
      "github.username": null,
      "github.profileUrl": null,
      "github.connectedAt": null,
    },
    { returnDocument: "after" },
  );
  // Dont stop executing (find all the Projects and delete indexed files associated with them)
  const projects = await Project.find({ userId: req.user._id }).select("_id");

  for (const project of projects) {
    try {
      await fetch(`${aiServiceUrl}/ai/delete-index`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": process.env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({ projectId: project._id.toString() }),
      });
    } catch (err) {
      console.warn(
        `Failed to delete vectors for project ${project._id}:`,
        err.message,
      );
    }
  }

  await Project.updateMany(
    { userId: req.user._id },
    {
      "github.connected": false,
      "github.repoFullName": null,
      "github.branch": "main",
      "github.indexStatus": "idle",
      "github.lastSynced": null,
      "github.endpointCount": 0,
      "github.indexedFiles": [],
      "github.indexError": null,
      ragSource: "none",
    },
  );
  return res
    .status(200)
    .json(new ApiResponse(200, null, "GitHub disconnected successfully"));
});

// Controller 6 -> Delete Indexed Repo Files
const deleteIndexedFiles = asyncHandler(async (req, res) => {
  const { projectId } = req.body;
  if (!projectId) {
    throw new ApiError(400, "ProjectId is Required");
  }

  const userId = req.user?._id;
  // Check if Github of the Project is Connected Or not
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(400, "Project Not Present in the database :");
  }
  if (!project.github.connected) {
    throw new ApiError(400, "Github Not Connected");
  }

  const aiServiceUrl = process.env.AI_SERVICE_URL;
  if (!aiServiceUrl) {
    throw new ApiError(500, "AI_SERVICE_URL is not configured");
  }
  const aiResponse = await fetch(`${aiServiceUrl}/ai/delete-index`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": process.env.INTERNAL_API_KEY,
    },
    body: JSON.stringify({
      projectId,
    }),
  });
  if (!aiResponse.ok) {
    throw new ApiError(500, "Failed to delete indexed files");
  }
  await Project.findByIdAndUpdate(projectId, {
    "github.indexStatus": "idle",
    "github.endpointCount": 0,
    "github.indexedFiles": [],
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Indexed Files Deleted Successfully"));
});

export {
  disconnectGithub,
  connectGithub,
  selectRepo,
  syncRepo,
  githubCallback,
  getRepos,
  getBranches,
  deleteIndexedFiles,
};
