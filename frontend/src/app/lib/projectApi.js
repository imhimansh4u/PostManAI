import api from "./api";

export const createProject = async ({
  name,
  baseUrl,
  description,
  authToken,
}) => {
  const res = await api.post("/postmanai/v1/projects/newProject", {
    name,
    baseUrl,
    description,
    authToken,
  });
  return res.data;
};

export const listProjects = async () => {
  const res = await api.get("/postmanai/v1/projects/listAllProjects");
  console.log(res.data);
  return res.data;
};

export const fetchProjectDetail = async (projectId) => {
  console.log("This is called");
  const res = await api.get(
    `/postmanai/v1/projects/fetchprojectdetail/${projectId}`,
  );
  console.log(res);
  return res.data;
};

export const fetchProjectCookies = async (projectId) => {
  const res = await api.get(`/postmanai/v1/projects/cookies/${projectId}`);
  // APIResponse returns object under data.data
  return res.data?.data?.cookies || {};
};

export const updateProjectCookies = async (projectId, cookies) => {
  const res = await api.post(`/postmanai/v1/projects/cookies/${projectId}`, {
    cookies,
  });
  return res.data?.data?.cookies || {};
};
