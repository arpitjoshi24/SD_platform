import api from "@/lib/api";
import type { Challenge } from "@/types/challenge";
import type { ApiResponse } from "@/types/api";

export const getChallenges = async (): Promise<Challenge[]> => {
  const { data } = await api.get<ApiResponse<Challenge[]>>("/challenges");
  return data.data;
};

export const getChallenge = async (id: string): Promise<Challenge> => {
  const { data } = await api.get<ApiResponse<Challenge>>(`/challenges/${id}`);
  return data.data;
};
