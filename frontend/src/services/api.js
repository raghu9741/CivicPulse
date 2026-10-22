import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

export function getErrorMessage(error) {
  if (!error.response && (error.code === "ERR_NETWORK" || error.message === "Network Error")) {
    return "Cannot reach the CivicPulse API. Check that the backend is running and the frontend API URL is configured.";
  }
  return error.response?.data?.message || error.message || "Something went wrong";
}

export default api;
