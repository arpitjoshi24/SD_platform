export type IssueSeverity = "info" | "warning" | "error" | "critical";

export type IssueCategory =
  | "structure"
  | "connection"
  | "requirement"
  | "reliability"
  | "performance"
  | "security"
  | "data_integrity";

export interface EvaluationIssue {
  id: string;
  ruleId: string;
  rule_key?: string;
  severity: IssueSeverity | string;
  category: IssueCategory | string;
  title: string;
  message: string;
  suggestion?: string | null;
  nodeIds: string[];
  edgeIds: string[];
  penalty: number;
}

export interface EvaluationSummary {
  critical?: number;
  errors: number;
  warnings: number;
  info: number;
}

export interface EvaluationStats {
  nodeCount: number;
  edgeCount: number;
  componentCounts: Record<string, number>;
}

export interface AppliedRuleMetadata {
  rule_id: string | null;
  rule_key: string;
  rule_version_id: string | null;
  rule_version_number: number | null;
  rule_type: "generic" | "challenge_specific" | string;
  is_mandatory: boolean;
  issuesFound: number;
}

export interface EvaluationResult {
  score: number;
  grade: string;
  passed: boolean;
  summary: EvaluationSummary;
  stats: EvaluationStats;
  issues: EvaluationIssue[];
  appliedRules?: AppliedRuleMetadata[];
  engineVersion?: string;
  evaluatedAt: string;
}

export interface EvaluateSnapshotPayload {
  snapshot: {
    nodes: unknown[];
    edges: unknown[];
  };
}