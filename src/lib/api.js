import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function resolveBaseURL() {
  if (process.env.NODE_ENV === "production") return "/api";
  if (API_URL) return API_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return `${window.location.protocol}//${host}:5000/api`;
  }
  return "http://localhost:5000/api";
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise = null;

const refreshTokens = async () => {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/auth/refresh")
      .catch(() => {
        if (!window.location.pathname.startsWith("/auth/")) {
          window.location.href = "/auth/login";
        }
        throw new Error("Session expired");
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes("/auth/login")) {
      originalRequest._retry = true;
      try {
        await refreshTokens();
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === "ERR_NETWORK" || error?.message === "Network Error") {
    return "Cannot reach the server. Please check your connection and try again.";
  }
  if (error?.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }
  return error?.message || fallback;
};

export default api;