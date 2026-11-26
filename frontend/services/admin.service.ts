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
  const { data } = await api.get<
    ApiResponse<Challenge[] | { items?: Challenge[]; challenges?: Challenge[] }>
  >("/admin/challenges", { params });

  const payload = data?.data;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.challenges)) return payload.challenges;
  }
  return [];
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
  const { data } = await api.get<
    ApiResponse<
      User[] | { users?: User[]; items?: User[]; data?: User[] } | null
    >
  >("/admin/users", {
    params,
  });

  const payload = data?.data;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.users)) return payload.users;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
  }
  return [];
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
      if (data?.data) {
        return data.data;
      }
    } catch {
      // Fallback to existing admin endpoints if /admin/dashboard/stats is not yet deployed
    }

    try {
      const [usersRes, challengesRes, rulesRes] = await Promise.allSettled([
        getAdminUsers({ limit: 500 }),
        getAdminChallenges({ include_archived: true }),
        getAdminRules(),
      ]);

      const users = usersRes.status === "fulfilled" ? usersRes.value : [];
      const challenges =
        challengesRes.status === "fulfilled" ? challengesRes.value : [];
      const rules = rulesRes.status === "fulfilled" ? rulesRes.value : [];

      if (
        usersRes.status === "rejected" &&
        challengesRes.status === "rejected" &&
        rulesRes.status === "rejected"
      ) {
        return null;
      }

      const activeUsers = users.filter(
        (u) => (u.account_status ?? "active") === "active"
      ).length;
      const suspendedUsers = users.filter(
        (u) => u.account_status === "suspended"
      ).length;
      const publishedChallenges = challenges.filter(
        (c) => Boolean(c.is_published) && !c.is_archived
      ).length;
      const archivedChallenges = challenges.filter((c) =>
        Boolean(c.is_archived)
      ).length;
      const activeRules = rules.filter((r) => Boolean(r.is_active)).length;
      const totalProjects = users.reduce(
        (acc, u) => acc + (u.projects_count ?? 0),
        0
      );
      const totalAttempts = users.reduce(
        (acc, u) => acc + (u.attempts_count ?? 0),
        0
      );

      return {
        total_users: users.length,
        active_users: activeUsers,
        suspended_users: suspendedUsers,
        total_challenges: challenges.length,
        published_challenges: publishedChallenges,
        archived_challenges: archivedChallenges,
        total_rules: rules.length,
        active_rules: activeRules,
        total_projects: totalProjects,
        total_attempts: totalAttempts,
        average_attempt_score: 0,
        recent_activity: [],
      };
    } catch {
      return null;
    }
  };

export const getAdminDashboard = getAdminDashboardStats;