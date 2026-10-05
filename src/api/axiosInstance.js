import axios from "axios";

const api = axios.create({
  baseURL: "https://dummyjson.com",
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

// Add access token to every request
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired access token
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Don't try refresh for login/refresh failures
    const isAuthRequest =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          const refreshToken = localStorage.getItem("refreshToken");

          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          refreshPromise = axios
            .post("https://dummyjson.com/auth/refresh", {
              refreshToken,
              expiresInMins: 2,
            })
            .then((response) => {
              localStorage.setItem(
                "accessToken",
                response.data.accessToken
              );

              if (response.data.refreshToken) {
                localStorage.setItem(
                  "refreshToken",
                  response.data.refreshToken
                );
              }

              return response.data.accessToken;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newAccessToken = await refreshPromise;

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        window.dispatchEvent(new Event("auth:logout"));

        return Promise.reject(normalizeError(refreshError));
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

function normalizeError(error) {
  return {
    status: error.response?.status || 0,
    message:
      error.response?.data?.message ||
      error.message ||
      "Something went wrong",
    data: error.response?.data || null,
  };
}

export default api;