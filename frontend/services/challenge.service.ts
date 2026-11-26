import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Challenge, ChallengeVersionInfo } from "@/types/challenge";

export interface ChallengeFilters {
  difficulty?: string;
  category?: string;
  search?: string;
}

export const getChallenges = async (
  filters?: ChallengeFilters
): Promise<Challenge[]> => {
  const { data } = await api.get<ApiResponse<Challenge[]>>("/challenges", {
    params: filters,
  });
  return data.data;
};

export const getChallenge = async (id: string): Promise<Challenge> => {
  const { data } = await api.get<ApiResponse<Challenge>>(`/challenges/${id}`);
  return data.data;
};

export const getChallengeVersion = async (
  challengeId: string,
  versionId: string
): Promise<ChallengeVersionInfo> => {
  const { data } = await api.get<ApiResponse<ChallengeVersionInfo>>(
    `/challenges/${challengeId}/versions/${versionId}`
  );
  return data.data;
};