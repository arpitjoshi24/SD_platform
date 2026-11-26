import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  AuthResponseData,
  LoginPayload,
  RegisterPayload,
  User,
} from "@/types/auth";

export type RegisterData = RegisterPayload;
export type LoginData = LoginPayload;

export const registerUser = async (
  payload: RegisterData
): Promise<AuthResponseData> => {
  // Never send role from client; backend enforces default 'user' role.
  const sanitizedPayload: RegisterPayload = {
    full_name: payload.full_name,
    email: payload.email,
    password: payload.password,
    ...(payload.timezone ? { timezone: payload.timezone } : {}),
  };

  const { data } = await api.post<ApiResponse<AuthResponseData>>(
    "/auth/register",
    sanitizedPayload
  );
  return data.data;
};

export const loginUser = async (
  payload: LoginData
): Promise<AuthResponseData> => {
  const { data } = await api.post<ApiResponse<AuthResponseData>>(
    "/auth/login",
    payload
  );
  return data.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const { data } = await api.get<ApiResponse<User>>("/auth/me");
  return data.data;
};

export const logoutUser = async (): Promise<void> => {
  await api.post("/auth/logout");
};