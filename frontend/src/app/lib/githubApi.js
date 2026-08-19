import api from "./api";
export const connectGithub = () => {
  window.location.href = `http://localhost:1101/postmanai/v1/github/connect`;
};

export const getRepos = async () => {
  const res = await api.get("/postmanai/v1/github/repos");
  return res.data;
};

export const getRepoBranches = async ({ repoFullName }) => {
  const res = await api.get("/postmanai/v1/github/branches", {
    params: { repoFullName },
  });
  return res.data;
};

export const selectRepo = async ({
  projectId,
  repoFullName,
  branch = "main",
}) => {
  const res = await api.post("/postmanai/v1/github/select-repo", {
    projectId,
    repoFullName,
    branch,
  });
  return res.data;
};

export const syncRepo = async ({ projectId }) => {
  const res = await api.post("/postmanai/v1/github/sync", {
    projectId,
  });
  return res.data;
};

export const disconnectGithub = async () => {
  const res = await api.delete("/postmanai/v1/github/disconnect");
  return res.data;
};

export const deleteIndexedFiles = async ({ projectId }) => {
  const res = await api.delete("/postmanai/v1/github/delete-indexed-files", {
    data: { projectId },
  });
  return res.data;
};
