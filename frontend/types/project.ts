export type ProjectMode = "challenge" | "practice";

export type ProjectStatus = "in_progress" | "completed" | "archived";

export interface Project {
  id: string;
  user_id?: string;
  title: string;
  project_mode: ProjectMode;
  challenge_id: string | null;
  challenge_version_id: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectAttemptSummary {
  id: string;
  attempt_number: number;
  score: number | null;
  grade: string | null;
  passed: boolean | null;
  saved_at: string;
  node_count?: number;
  edge_count?: number;
}

export interface ProjectWithSummary extends Project {
  challenge_title?: string | null;
  challenge_slug?: string | null;
  challenge_version_number?: number | null;
  total_attempts?: number;
  latest_attempt?: ProjectAttemptSummary | null;
}

export interface CreateGuidedProjectInput {
  project_mode: "challenge";
  challenge_id: string;
  title?: string;
}

export interface CreatePracticeProjectInput {
  project_mode: "practice";
  title?: string;
  selected_rules?: Array<{
    rule_id: string;
    is_selected?: boolean;
    config_override?: Record<string, unknown>;
  }>;
}

export type CreateProjectInput = CreateGuidedProjectInput | CreatePracticeProjectInput;

export interface UpdateProjectMetadataInput {
  title?: string;
  status?: ProjectStatus;
}