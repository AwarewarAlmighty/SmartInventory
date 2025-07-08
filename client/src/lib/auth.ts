import { apiRequest } from "./queryClient";

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    return response.json();
  },

  register: async (email: string, password: string, name: string) => {
    const response = await apiRequest("POST", "/api/auth/register", { email, password, name });
    return response.json();
  },

  me: async () => {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },
};
