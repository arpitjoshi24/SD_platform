import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Project, UpdateProjectPayload } from "@/types/project";
import type { EvaluationResult } from "@/types/evaluation";

export const getProjects = async (): Promise<Project[]> => {
  const { data } = await api.get<ApiResponse<Project[]>>("/projects");
  return data.data;
};

export const getProject = async (id: string): Promise<Project> => {
  const { data } = await api.get<ApiResponse<Project>>(`/projects/${id}`);
  return data.data;
};

export const createProject = async (payload: {
  challenge_id: string;
  title: string;
}): Promise<Project> => {
  const { data } = await api.post<ApiResponse<Project>>("/projects", payload);
  return data.data;
};

export const updateProject = async (
  id: string,
  payload: UpdateProjectPayload
): Promise<Project> => {
  const { data } = await api.put<ApiResponse<Project>>(
    `/projects/${id}`,
    payload
  );
  return data.data;
};

export const evaluateProject = async (
  id: string
): Promise<EvaluationResult> => {
  const { data } = await api.post<ApiResponse<EvaluationResult>>(
    `/projects/${id}/evaluate`
  );
  return data.data;
};
