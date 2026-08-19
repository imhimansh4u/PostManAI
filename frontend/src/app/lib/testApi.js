import api from "./api";

export const getTests = async (projectId, description) => {
  const res = await api.post("/postmanai/v1/test/get-tests", {
    projectId: projectId,
    description: description,
  });
  return res.data;
};

export const updateTest = async (testid, updates) => {
  const res = await api.patch(`/postmanai/v1/test/${testid}`, updates);
  return res.data;
};

export const runTest = async (payload) => {
  const res = await api.post(`/postmanai/v1/test/run`, payload);
  return res.data;
};
