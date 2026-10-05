import api from "../api/axiosInstance";

export const getUsers = async () => {
  const response = await api.get("/users", {
    params: {
      limit: 100,
      skip: 0,
    },
  });

  return response.data;
};