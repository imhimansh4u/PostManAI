import api from "./api";

export const getStats = async (projectId) => {
  const url = projectId
    ? `/postmanai/v1/dashboard/getStats?projectId=${projectId}`
    : `/postmanai/v1/dashboard/getStats`;
  const res = await api.get(url);
  return res.data;
};

export const getRecentActivity = async (projectId, limit) => {
  const params = {};
  if (projectId) params.projectId = projectId;
  if (limit) params.limit = limit;
  const res = await api.get("/postmanai/v1/dashboard/activity", { params });
  return res.data;
};
