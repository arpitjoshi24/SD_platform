import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  CreateProjectInput,
  Project,
  ProjectWithSummary,
  UpdateProjectMetadataInput,
} from "@/types/project";

export const getProjects = async (): Promise<ProjectWithSummary[]> => {
  const { data } =
    await api.get<ApiResponse<ProjectWithSummary[]>>("/projects");
  return data.data;
};

export const getProject = async (id: string): Promise<ProjectWithSummary> => {
  const { data } = await api.get<ApiResponse<ProjectWithSummary>>(
    `/projects/${id}`
  );
  return data.data;
};

export const createProject = async (
  payload: CreateProjectInput
): Promise<Project> => {
  const { data } = await api.post<ApiResponse<Project>>("/projects", payload);
  return data.data;
};

export const updateProject = async (
  id: string,
  payload: UpdateProjectMetadataInput
): Promise<Project> => {
  const { data } = await api.patch<ApiResponse<Project>>(
    `/projects/${id}`,
    payload
  );
  return data.data;
};

export const archiveProject = async (id: string): Promise<Project> => {
  const { data } = await api.patch<ApiResponse<Project>>(
    `/projects/${id}`,
    { status: "archived" }
  );
  return data.data;
};