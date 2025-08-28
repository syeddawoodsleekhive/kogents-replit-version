import { removeToken, setToken } from "@/functions";
import { getToken } from "@/functions/index-v2";
import axios from "axios";

const Axios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  // timeout: 10000,
  withCredentials: true, // needed for refresh token cookie
  timeout: 5000,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

Axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

Axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return Axios(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          "/auth/refresh",
          {},
          {
            baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
            withCredentials: true, // send refresh token cookie
          }
        );
        const newToken = res.data.access_token;
        setToken(newToken);
        Axios.defaults.headers.common["Authorization"] = "Bearer " + newToken;
        processQueue(null, newToken);
        originalRequest.headers["Authorization"] = "Bearer " + newToken;
        return Axios(originalRequest);
      } catch (err) {
        processQueue(err, null);
        removeToken();
        // Extract workspace from current URL for redirect
        const currentPath = window.location.pathname;
        const workspace = currentPath.split("/")[1];
        window.location.href = `/${workspace}/login`;
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default Axios;
