import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  EvaluateSnapshotPayload,
  EvaluationResult,
} from "@/types/evaluation";

export const evaluateProjectSnapshot = async (
  projectId: string,
  payload: EvaluateSnapshotPayload
): Promise<EvaluationResult> => {
  const { data } = await api.post<ApiResponse<EvaluationResult>>(
    `/projects/${projectId}/evaluate`,
    payload
  );
  return data.data;
};