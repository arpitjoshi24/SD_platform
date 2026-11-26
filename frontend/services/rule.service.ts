import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  ProjectRuleSelection,
  RuleDefinition,
  UpdatePracticeRuleSelectionsPayload,
} from "@/types/rule";

export const getPracticeRules = async (): Promise<RuleDefinition[]> => {
  const { data } = await api.get<ApiResponse<RuleDefinition[]>>(
    "/rules/practice"
  );
  return data.data;
};

export const getProjectRuleSelections = async (
  projectId: string
): Promise<ProjectRuleSelection[]> => {
  const { data } = await api.get<ApiResponse<ProjectRuleSelection[]>>(
    `/rules/projects/${projectId}/selections`
  );
  return data.data;
};

export const updateProjectRuleSelections = async (
  projectId: string,
  payload: UpdatePracticeRuleSelectionsPayload
): Promise<ProjectRuleSelection[]> => {
  const { data } = await api.put<ApiResponse<ProjectRuleSelection[]>>(
    `/rules/projects/${projectId}/selections`,
    payload
  );
  return data.data;
};