import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

let accessToken = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const getAccessToken = () => accessToken;

const isRefreshRequest = (config) => {
  const url = config?.url || "";
  return url.includes("/auth/refresh");
};

const refreshAccessToken = async () => {
  const response = await refreshClient.post("/auth/refresh");
  const token = response.data?.access_token;
  if (token) {
    setAccessToken(token);
  }
  return token;
};

api.interceptors.request.use(
  (config) => {
    if (accessToken && !isRefreshRequest(config)) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if ((status === 401 || status === 422) && original && !original._retry && !isRefreshRequest(original)) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        await refreshPromise;
        return api(original);
      } catch (refreshError) {
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const apiFetch = (config) => api(config);

export const logout = async () => {
  setAccessToken(null);
  try {
    await api.post("/auth/logout");
  } catch (error) {
    // Ignore logout errors; client already cleared the token.
  }
};

export const initAuth = async () => {
  try {
    if (accessToken) {
      const response = await api.get("/me");
      return response.data;
    }
    await refreshAccessToken();
    const response = await api.get("/me");
    return response.data;
  } catch (error) {
    return null;
  }
};

export default api;
