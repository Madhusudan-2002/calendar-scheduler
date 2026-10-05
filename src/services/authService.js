import api from "../api/axiosInstance";

export const login = async (username, password) => {
  const response = await api.post("/auth/login", {
    username,
    password,
    expiresInMins: 2,
  });

  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const refreshToken = async (refreshToken) => {
  const response = await api.post("/auth/refresh", {
    refreshToken,
    expiresInMins: 2,
  });

  return response.data;
};