import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { User } from "@/types/auth";

export interface UpdateProfilePayload {
  full_name?: string;
  timezone?: string;
}

export const getMyProfile = async (): Promise<User> => {
  const { data } = await api.get<ApiResponse<User>>("/users/me");
  return data.data;
};

export const updateMyProfile = async (
  payload: UpdateProfilePayload
): Promise<User> => {
  const { data } = await api.patch<ApiResponse<User>>("/users/me", payload);
  return data.data;
};