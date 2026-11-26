import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  UserActivityResponse,
  UserStatistics,
} from "@/types/activity";

export const getMyStatistics = async (): Promise<UserStatistics> => {
  const { data } = await api.get<ApiResponse<UserStatistics>>(
    "/users/me/statistics"
  );
  return data.data;
};

export const getMyActivity = async (params?: {
  days?: number;
  start_date?: string;
  end_date?: string;
}): Promise<UserActivityResponse> => {
  const { data } = await api.get<ApiResponse<UserActivityResponse>>(
    "/users/me/activity",
    { params }
  );
  return data.data;
};