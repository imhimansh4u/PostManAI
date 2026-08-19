import api from "./api";

// to create the suite
export const createSuite = async (projectId, name, description) => {
  console.log("Creating a new Suite is called: ")
  const res = await api.post(`/postmanai/v1/suite/create/${projectId}`, {
    name: name,
    description: description,
  });
  return res.data.data;
};

// fetching all the suites

export const fetchsuite = async (projectId) => {
  const res = await api.get(`/postmanai/v1/suite/fetch/${projectId}`);
  return res.data.data;
};

// linking a testRun to a TestSuite
export const linkTestRun = async (runId, suiteId) => {
  const res = await api.put(`/postmanai/v1/suite/link/${runId}/${suiteId}`);
  return res.data.data;
};

// Getting testRuns of a testSuite
export const fetchtestRuns = async (suiteId) => {
  const res = await api.get(`/postmanai/v1/suite/testruns/${suiteId}`);
  return res.data.data;
};
