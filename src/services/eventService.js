import api from "../api/axiosInstance";

export const getSeedTodos = async (limit = 100, skip = 0) => {
  const response = await api.get("/todos", {
    params: {
      limit,
      skip,
    },
  });

  return response.data;
};