import api from "@/lib/api";
import type { LoginResponse, RegisterResponse, User } from "@/types/auth";
import type { ApiResponse } from "@/types/api";

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const registerUser = async (
  data: RegisterData
): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>("/auth/register", data);
  return response.data;
};

export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", data);
  return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<ApiResponse<User>>("/auth/me");
  return response.data.data;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};
