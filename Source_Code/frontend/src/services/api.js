import axios from "axios";
import { clearAuthSession, getAuthToken } from "../utils/auth";

const normalizeBaseUrl = (value) => value.replace(/\/+$/, "");

const joinUrl = (...parts) =>
  parts
    .filter(Boolean)
    .map((part, index) => {
      const value = String(part);
      if (index === 0) {
        return value.replace(/\/+$/, "");
      }
      return value.replace(/^\/+|\/+$/g, "");
    })
    .join("/");

const resolveBaseUrl = () => {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envBaseUrl) {
    if (envBaseUrl.startsWith("/")) {
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "";
      return normalizeBaseUrl(joinUrl(origin, envBaseUrl));
    }

    return normalizeBaseUrl(envBaseUrl);
  }

  if (import.meta.env.PROD) {
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "";
    const basePath = import.meta.env.BASE_URL || "/";
    return normalizeBaseUrl(joinUrl(origin, basePath, "backend/api"));
  }

  return "http://localhost/LocalesPro-main/backend/api";
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      error.userMessage =
        `Tidak bisa terhubung ke server API (${api.defaults.baseURL}). ` +
        "Pastikan backend sudah online dan konfigurasi VITE_API_BASE_URL benar.";
    }

    const isLoginRequest = String(error.config?.url || "").includes("/auth/login.php");
    if (error.response?.status === 401 && !isLoginRequest) {
      clearAuthSession();

      const loginPath = `${import.meta.env.BASE_URL || "/"}login`.replace(/\/{2,}/g, "/");
      if (!window.location.pathname.endsWith("/login")) {
        window.location.href = loginPath.startsWith("/") ? loginPath : `/${loginPath}`;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
