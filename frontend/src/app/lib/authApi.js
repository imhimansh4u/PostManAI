// frontend/lib/authApi.js
import api from "./api";

// Register
export const registerUser = async (name, email, password) => {
  console.log("This is called")  // for debugging baad me hta dena yaad se .
  const res = await api.post("/postmanai/v1/users/register", {
    name,
    email,
    password,
  });
  return res.data;
};

// Login
export const loginUser = async (email, password) => {
  const res = await api.post("/postmanai/v1/users/login", {
    email,
    password,
  });
  return res.data;
};

// Logout
export const logoutUser = async () => {
  const res = await api.post("/postmanai/v1/users/logout");
  return res.data;
};

// Get current logged in user
export const getCurrentUser = async () => {
  const res = await api.get("/postmanai/v1/users/me");
  return res.data;
};
