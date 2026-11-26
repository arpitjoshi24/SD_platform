import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  AdminCreateChallengePayload,
  AdminCreateRulePayload,
  AdminDashboardStats,
  AdminUpdateChallengePayload,
  AdminUpdateRulePayload,
  AdminUpdateUserStatusPayload,
  ChallengeParticipantSummary,
  ChallengeStatistics,
} from "@/types/admin";
import type { User } from "@/types/auth";
import type { Challenge, ChallengeVersionInfo } from "@/types/challenge";
import type { RuleDefinition } from "@/types/rule";

export const getAdminChallenges = async (params?: {
  include_archived?: boolean;
  is_published?: boolean;
  difficulty?: string;
  search?: string;
}): Promise<Challenge[]> => {
  const { data } = await api.get<ApiResponse<Challenge[]>>(
    "/admin/challenges",
    { params }
  );
  return data.data;
};

export const createAdminChallenge = async (
  payload: AdminCreateChallengePayload
): Promise<Challenge> => {
  const { data } = await api.post<ApiResponse<Challenge>>(
    "/admin/challenges",
    payload
  );
  return data.data;
};

export const updateAdminChallenge = async (
  challengeId: string,
  payload: AdminUpdateChallengePayload
): Promise<Challenge> => {
  const { data } = await api.put<ApiResponse<Challenge>>(
    `/admin/challenges/${challengeId}`,
    payload
  );
  return data.data;
};

export const createAdminChallengeVersion = async (
  challengeId: string,
  payload: AdminUpdateChallengePayload
): Promise<ChallengeVersionInfo | Challenge> => {
  const { data } = await api.post<
    ApiResponse<ChallengeVersionInfo | Challenge>
  >(`/admin/challenges/${challengeId}/versions`, payload);
  return data.data;
};

export const archiveAdminChallenge = async (
  challengeId: string
): Promise<Challenge> => {
  const { data } = await api.post<ApiResponse<Challenge>>(
    `/admin/challenges/${challengeId}/archive`
  );
  return data.data;
};

export const restoreAdminChallenge = async (
  challengeId: string
): Promise<Challenge> => {
  const { data } = await api.post<ApiResponse<Challenge>>(
    `/admin/challenges/${challengeId}/restore`
  );
  return data.data;
};

export const getAdminChallengeStatistics = async (
  challengeId: string
): Promise<ChallengeStatistics> => {
  const { data } = await api.get<ApiResponse<ChallengeStatistics>>(
    `/admin/challenges/${challengeId}/statistics`
  );
  return data.data;
};

export const getAdminChallengeParticipants = async (
  challengeId: string,
  params?: { limit?: number; offset?: number }
): Promise<ChallengeParticipantSummary[]> => {
  const { data } = await api.get<ApiResponse<ChallengeParticipantSummary[]>>(
    `/admin/challenges/${challengeId}/participants`,
    { params }
  );
  return data.data;
};

export const getAdminRules = async (params?: {
  rule_type?: string;
  category?: string;
  is_active?: boolean;
  is_practice_available?: boolean;
  search?: string;
}): Promise<RuleDefinition[]> => {
  const { data } = await api.get<ApiResponse<RuleDefinition[]>>(
    "/admin/rules",
    { params }
  );
  return data.data;
};

export const createAdminRule = async (
  payload: AdminCreateRulePayload
): Promise<RuleDefinition> => {
  const { data } = await api.post<ApiResponse<RuleDefinition>>(
    "/admin/rules",
    payload
  );
  return data.data;
};

export const updateAdminRule = async (
  ruleId: string,
  payload: AdminUpdateRulePayload
): Promise<RuleDefinition> => {
  const { data } = await api.put<ApiResponse<RuleDefinition>>(
    `/admin/rules/${ruleId}`,
    payload
  );
  return data.data;
};

export const createAdminRuleVersion = async (
  ruleId: string,
  payload: AdminUpdateRulePayload
): Promise<RuleDefinition> => {
  const { data } = await api.post<ApiResponse<RuleDefinition>>(
    `/admin/rules/${ruleId}/versions`,
    payload
  );
  return data.data;
};

export const getAdminUsers = async (params?: {
  role?: string;
  account_status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<User[]> => {
  const { data } = await api.get<ApiResponse<User[]>>("/admin/users", {
    params,
  });
  return data.data;
};

export const getAdminUserById = async (userId: string): Promise<User> => {
  const { data } = await api.get<ApiResponse<User>>(`/admin/users/${userId}`);
  return data.data;
};

export const updateAdminUserStatus = async (
  userId: string,
  payload: AdminUpdateUserStatusPayload
): Promise<User> => {
  const { data } = await api.patch<ApiResponse<User>>(
    `/admin/users/${userId}/status`,
    payload
  );
  return data.data;
};

export const getAdminDashboardStats =
  async (): Promise<AdminDashboardStats | null> => {
    try {
      const { data } = await api.get<ApiResponse<AdminDashboardStats>>(
        "/admin/dashboard/stats"
      );
      return data.data;
    } catch {
      return null;
    }
  };

export const getAdminDashboard = getAdminDashboardStats;