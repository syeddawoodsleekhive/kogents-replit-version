import { getToken } from "@/functions";
import axios from "axios";

// Create Axios instance
const Axios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
});

let interceptorRegistered = false;

// In-memory map to track recent requests for throttling
const requestThrottleMap: Record<string, number> = {};

// Register interceptor only in browser context & only once
if (typeof window !== "undefined" && !interceptorRegistered) {
  Axios.interceptors.request.use((config) => {
    const key = `${config.method}:${config.url}`;
    const now = Date.now();

    // Throttle duplicate requests to the same endpoint within 500ms
    if (requestThrottleMap[key] && now - requestThrottleMap[key] < 500) {
      // Cancel request by throwing error (prevents duplicate spamming)
      return Promise.reject(new axios.Cancel(`Throttled: ${key}`));
    }

    // Update last request timestamp
    requestThrottleMap[key] = now;

    // Attach token if available
    const token = getToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  });

  interceptorRegistered = true;
}

// Optionally, you could add a response interceptor for global error handling
// Axios.interceptors.response.use(
//   (response) => response,
//   (error) => Promise.reject(error)
// );

export default Axios;
