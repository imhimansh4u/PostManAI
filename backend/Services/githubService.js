import axios from "axios";
import { Octokit } from "@octokit/rest";

//....This code is the very first step of the GitHub OAuth 2.0 flow. Its sole job is to generate a secure, specialized link that you send to
//....your frontend. When a user clicks that link, they are redirected away from your app and over to GitHub's official website to grant your
//....application permission to access their repositories.

export function buildGithubAuthUrl(userId) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID, //client_id: This is a public identifier for your specific GitHub OAuth App (created in your GitHub Developer Settings). It tells GitHub exactly which application is asking for permission.
    redirect_uri: process.env.GITHUB_CALLBACK_URL, //This is the callback URL of your Node.js backend. Once the user clicks "Approve" on GitHub, GitHub will securely send them back to this specific URL on your server along with a temporary authorization code.
    scope: "repo read:user",
    state: userId,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

//
// FUNCTION 2 — exchangeCodeForToken
//
// GitHub sends a one-time CODE to your callback
// This function exchanges that code for a real token
// Must happen server-to-server — never in frontend
//

export async function exchangeCodeForToken(code) {
  const response = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    },
    {
      headers: { Accept: "application/json" },
    },
  );

  // GitHub returns error inside the response body, not as HTTP error
  // So we check manually
  if (response.data.error) {
    throw new Error(`GitHub OAuth failed: ${response.data.error_description}`);
  }

  return response.data.access_token;
}
//
// FUNCTION 3 — fetchUserRepos
//
// After token exchange, fetch the user's
// repo list to show in the dropdown
//

export async function fetchUserRepos(accessToken) {
  // Give Octokit the token — it handles auth headers automatically
  // Every API call made by this octokit instance will be authenticated
  const octokit = new Octokit({ auth: accessToken });
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated", // most recently updated repos first
    per_page: 100, // max GitHub allows per page
    type: "all", // own repos + org repos they have access to
  });

  // GitHub repo objects have 80+ fields
  // We only return what the frontend dropdown actually needs
  return data.map((repo) => ({
    id: repo.id,
    fullName: repo.full_name, // "himanshu/my-api"
    name: repo.name, // "my-api"
    private: repo.private, // true/false
    defaultBranch: repo.default_branch, // "main" or "master"
    updatedAt: repo.updated_at,
    description: repo.description,
  }));
}

export async function fetchRepoBranches(accessToken, repoFullName) {
  const octokit = new Octokit({ auth: accessToken });
  const [owner, repo] = repoFullName.split("/");

  if (!owner || !repo) {
    throw new Error("Invalid repository format. Expected owner/repo-name");
  }

  const branches = await octokit.paginate(octokit.rest.repos.listBranches, {
    owner,
    repo,
    per_page: 100,
  });

  return branches.map((branch) => ({
    name: branch.name,
    protected: branch.protected,
    commitSha: branch.commit?.sha || null,
  }));
}

//
// FUNCTION 4 — fetchRepoRouteFiles
//
// Called when user clicks "Sync Now"
// Scans the connected repo and returns
// only route/controller files for RAG indexing

export async function fetchRepoRouteFiles(
  accessToken,
  repoFullName, // "himanshu/my-api"
  branch = "main",
) {
  const octokit = new Octokit({ auth: accessToken });
  const [owner, repo] = repoFullName.split("/");

  // 1. Fetch the ENTIRE file tree of the repo in one API call
  const { data: treeData } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: branch,
    recursive: "1",
  });

  console.log("Total files in repo:", treeData.tree.length);

  // 2. Filter to only files that are likely to define API endpoints
  // Filter to only files that are likely to define API endpoints
  // Filter to only files that are likely to define API endpoints / Server Actions
  const routeFiles = treeData.tree.filter((file) => {
    if (file.type !== "blob") return false;

    const path = file.path.toLowerCase();

    // Skip lockfiles, configuration files, styling, and build artifacts
    if (
      path.includes("node_modules") ||
      path.includes(".next") ||
      path.includes("package-lock.json") ||
      path.endsWith(".config.js") ||
      path.endsWith(".config.ts") ||
      path.endsWith(".css")
    ) {
      return false;
    }

    // ── Next.js Server Actions (NEW) ──
    // Captures everything inside the actions folder: src/actions/accounts.js, actions/budget.ts

    const isNextServerAction =
      (path.startsWith("actions/") ||
        path.includes("/actions/") ||
        path.startsWith("backend/") ||
        path.startsWith("/backend/")) &&
      (path.endsWith(".js") ||
        path.endsWith(".ts") ||
        path.endsWith(".jsx") ||
        path.endsWith(".tsx"));

    // ── Next.js App Router API Patterns ──
    const isNextAppRoute =
      path.includes("app/api/") &&
      (path.endsWith("route.js") || path.endsWith("route.ts"));

    // ── Next.js Pages Router API Patterns ──
    const isNextPagesRoute =
      path.includes("pages/api/") &&
      (path.endsWith(".js") ||
        path.endsWith(".ts") ||
        path.endsWith(".jsx") ||
        path.endsWith(".tsx"));

    // ── Express / Node.js standard patterns ──
    const isExpressRoute =
      path.includes("route") ||
      path.includes("routes") ||
      path.includes("controller") ||
      path.includes("controllers") ||
      path.includes("services") ||
      path.includes("service") ||
      path.includes("app") ||
      path.includes("index") || 
      path.includes("main")  ||
      path.includes("server")  ||
      path.includes("handler");

    // ── Python FastAPI / Django patterns ──
    const isPythonRoute =
      path.includes("views.py") ||
      path.includes("urls.py") ||
      path.includes("main.py") ||
      path.includes("routers.py") ||
      path.endsWith("_router.py") ||
      path.endsWith("_routes.py");

    return (
      isNextServerAction ||
      isNextAppRoute ||
      isNextPagesRoute ||
      isExpressRoute ||
      isPythonRoute
    );
  });

  console.log("Filtered route/controller files found:", routeFiles.length);

  // No route files found after rigorous path filtering — warn early
  if (routeFiles.length === 0) {
    throw new Error(
      `No route or controller files matched the filter rules in repo: ${repoFullName}`,
    );
  }

  // 3. Fetch the actual content of each route file in parallel
  const fileContents = await Promise.all(
    routeFiles.map(async (file) => {
      try {
        // Core Protection: If file is > 1MB, skip it or read via raw endpoint
        // Large generated schemas, bundle build maps, or logs shouldn't break your parser
        if (file.size > 1000000) {
          console.warn(
            `Skipping large file [${file.path}] - Size: ${file.size} bytes`,
          );
          return null;
        }

        const { data } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: file.path,
          ref: branch,
        });

        // Error proofing: safeguard against unexpected array structures or blank data returns
        if (!data || !data.content) {
          console.warn(
            `Skipping file ${file.path}: Content field is missing or empty inside GitHub payload.`,
          );
          return null;
        }

        // Decode back to readable text safely
        const content = Buffer.from(data.content, "base64").toString("utf-8");

        return {
          path: file.path,
          content,
          size: file.size,
        };
      } catch (err) {
        console.warn(`Skipping file ${file.path}: ${err.message}`);
        return null;
      }
    }),
  );

  // Clean out null arrays from skipped files
  return fileContents.filter(Boolean);
}
