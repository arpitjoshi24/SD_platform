export type ActivityEventType =
  | "attempt_saved"
  | "project_created"
  | "challenge_completed";

export interface ActivityHeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
  level?: 0 | 1 | 2 | 3 | 4;
}

export interface ActivityEventItem {
  id: string;
  user_id?: string;
  project_id?: string | null;
  attempt_id?: string | null;
  challenge_id?: string | null;
  event_type: ActivityEventType | string;
  occurred_on: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface UserStatistics {
  total_projects: number;
  guided_projects: number;
  practice_projects: number;
  total_attempts: number;
  completed_challenges: number;
  average_score?: number | null;
  best_score?: number | null;
  passed_attempts?: number;
}

export interface UserActivityResponse {
  days: ActivityHeatmapDay[];
  recent_events?: ActivityEventItem[];
  range?: {
    start_date: string;
    end_date: string;
  };
}