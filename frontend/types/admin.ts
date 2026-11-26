import type { AccountStatus, User, UserRole } from "./auth";
import type { Challenge, ChallengeEvaluationConfig } from "./challenge";
import type { RuleDefinition, RuleType } from "./rule";

export interface AdminActivityItem {
  id: string;
  event_type: string;
  summary: string;
  actor_email?: string | null;
  created_at: string;
}

export interface AdminDashboardStats {
  total_users: number;
  active_users: number;
  suspended_users: number;
  total_challenges: number;
  published_challenges: number;
  archived_challenges?: number;
  total_rules: number;
  active_rules?: number;
  total_projects: number;
  guided_projects?: number;
  practice_projects?: number;
  total_attempts: number;
  passed_attempts?: number;
  average_attempt_score?: number | null;
  recent_activity?: AdminActivityItem[];
}

export interface AdminCreateChallengePayload {
  title: string;
  slug?: string;
  description: string;
  difficulty: string;
  category?: string | null;
  estimated_minutes?: number | null;
  requirements?: string[];
  hints?: string[];
  is_published?: boolean;
  evaluation_config?: ChallengeEvaluationConfig;
  assigned_rule_ids?: string[];
}

export interface AdminUpdateChallengePayload
  extends Partial<AdminCreateChallengePayload> {
  changelog?: string;
}

export interface AdminCreateRulePayload {
  rule_key: string;
  name: string;
  description: string;
  rule_type: RuleType;
  category: string;
  severity: string;
  is_mandatory?: boolean;
  is_active?: boolean;
  is_practice_available?: boolean;
  config?: Record<string, unknown>;
  applicability?: Record<string, unknown>;
}

export interface AdminUpdateRulePayload extends Partial<AdminCreateRulePayload> {
  create_new_version?: boolean;
  changelog?: string;
}

export interface AdminUpdateUserStatusPayload {
  account_status: AccountStatus;
  reason?: string;
}

export interface ChallengeParticipantSummary {
  user_id: string;
  full_name: string;
  email: string;
  project_id: string;
  project_title: string;
  challenge_version_number?: number | null;
  attempts_count: number;
  best_score: number | null;
  latest_score: number | null;
  passed: boolean;
  last_activity_at: string;
}

export interface ChallengeStatistics {
  challenge_id: string;
  challenge_title?: string;
  total_projects: number;
  unique_participants: number;
  total_attempts: number;
  pass_rate: number;
  average_score: number | null;
  highest_score: number | null;
}

export type AdminUserRecord = User & {
  role: UserRole;
  account_status: AccountStatus;
  projects_count?: number;
  attempts_count?: number;
};

export type AdminChallengeRecord = Challenge;
export type AdminRuleRecord = RuleDefinition;