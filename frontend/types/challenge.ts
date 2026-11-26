export type ChallengeDifficulty = "easy" | "medium" | "hard" | "beginner" | "intermediate" | "advanced";

export interface ChallengeComponentRule {
  type: string;
  min: number;
  reason?: string;
}

export interface ChallengeConnectionRule {
  from: string;
  to: string;
  reason?: string;
}

export interface ChallengeEvaluationConfig {
  required_components?: ChallengeComponentRule[];
  recommended_components?: ChallengeComponentRule[];
  required_connections?: Array<[string, string] | ChallengeConnectionRule>;
  recommended_connections?: Array<[string, string] | ChallengeConnectionRule>;
  forbidden_connections?: Array<[string, string] | ChallengeConnectionRule>;
}

export interface ChallengeVersionInfo {
  id: string;
  version_number: number;
  created_at?: string;
  snapshot_config?: ChallengeEvaluationConfig;
}

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: ChallengeDifficulty | string;
  category?: string | null;
  estimated_minutes: number | null;
  requirements?: string[];
  hints?: string[];
  is_published?: boolean;
  is_archived?: boolean;
  current_version_number?: number;
  current_version?: ChallengeVersionInfo | null;
  created_at?: string;
  updated_at?: string;
}