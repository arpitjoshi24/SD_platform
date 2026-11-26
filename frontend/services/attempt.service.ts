import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  AttemptListResponse,
  ProjectAttempt,
  SaveAttemptPayload,
} from "@/types/attempt";

export const saveProjectAttempt = async (
  projectId: string,
  payload: SaveAttemptPayload
): Promise<ProjectAttempt> => {
  const { data } = await api.post<ApiResponse<ProjectAttempt>>(
    `/projects/${projectId}/attempts`,
    payload
  );
  return data.data;
};

export const getProjectAttempts = async (
  projectId: string,
  params?: { limit?: number; offset?: number }
): Promise<ProjectAttempt[]> => {
  const { data } = await api.get<ApiResponse<ProjectAttempt[] | AttemptListResponse>>(
    `/projects/${projectId}/attempts`,
    { params }
  );

  if (Array.isArray(data.data)) {
    return data.data;
  }
  return data.data?.attempts ?? [];
};

export const getAttemptById = async (
  attemptId: string
): Promise<ProjectAttempt> => {
  const { data } = await api.get<ApiResponse<ProjectAttempt>>(
    `/attempts/${attemptId}`
  );
  return data.data;
};

export const deleteAttemptById = async (
  attemptId: string
): Promise<{ deleted: boolean; id?: string }> => {
  const { data } = await api.delete<
    ApiResponse<{ deleted?: boolean; id?: string } | null>
  >(`/attempts/${attemptId}`);

  return {
    deleted: data.data?.deleted ?? true,
    id: data.data?.id ?? attemptId,
  };
};