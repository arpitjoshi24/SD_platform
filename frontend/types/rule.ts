import type { IssueCategory, IssueSeverity } from "./evaluation";

export type RuleType = "generic" | "challenge_specific";

export interface RuleDefinition {
  id: string;
  rule_key: string;
  name: string;
  description: string;
  rule_type: RuleType;
  category: IssueCategory | string;
  severity: IssueSeverity | string;
  applicability?: Record<string, unknown>;
  is_mandatory: boolean;
  is_active: boolean;
  is_practice_available: boolean;
  current_version_id?: string | null;
  current_version_number: number;
  current_config?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectRuleSelection {
  id?: string;
  project_id: string;
  rule_id: string;
  rule_key: string;
  name?: string;
  description?: string;
  rule_type?: RuleType;
  category?: string;
  severity?: string;
  is_mandatory?: boolean;
  is_practice_available?: boolean;
  rule_version_id: string;
  rule_version_number?: number;
  is_selected: boolean;
  config_override: Record<string, unknown>;
}

export interface UpdatePracticeRuleSelectionsPayload {
  selections: Array<{
    rule_id: string;
    is_selected: boolean;
    config_override?: Record<string, unknown>;
  }>;
}