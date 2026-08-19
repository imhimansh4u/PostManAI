// frontend/lib/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:1101",
  withCredentials: true,   // ← sends cookies automatically
});

export default api;