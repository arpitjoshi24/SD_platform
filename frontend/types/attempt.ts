import type { Edge, Node } from "@xyflow/react";
import type { EvaluationIssue, EvaluationResult } from "./evaluation";

export interface AttemptRuleSnapshot {
  id?: string;
  attempt_id?: string;
  rule_id: string | null;
  rule_key: string;
  rule_version_id: string | null;
  rule_version_number: number | null;
  rule_type?: "generic" | "challenge_specific";
  is_mandatory: boolean;
  is_enabled: boolean;
  config_snapshot?: Record<string, unknown>;
  eval_params?: Record<string, unknown>;
}

export interface ProjectAttempt {
  id: string;
  project_id: string;
  attempt_number: number;
  nodes_snapshot: Node[];
  edges_snapshot: Edge[];
  evaluation_result?: EvaluationResult | null;
  score: number | null;
  grade: string | null;
  passed: boolean | null;
  summary:
    | {
        critical?: number;
        errors: number;
        warnings: number;
        info: number;
      }
    | Record<string, number>;
  issues: EvaluationIssue[];
  evaluation_engine_version: string | null;
  challenge_version_id: string | null;
  simulation_config?: Record<string, unknown> | null;
  simulation_result?: Record<string, unknown> | null;
  simulation_engine_version?: string | null;
  node_count?: number;
  edge_count?: number;
  idempotency_key?: string | null;
  saved_at: string;
  rule_snapshots?: AttemptRuleSnapshot[];
}

export interface SaveAttemptPayload {
  idempotency_key: string;
  snapshot: {
    nodes: Node[];
    edges: Edge[];
  };
  simulation_config?: Record<string, unknown> | null;
  simulation_result?: Record<string, unknown> | null;
  simulation_engine_version?: string | null;
}

export interface AttemptListResponse {
  items?: ProjectAttempt[];
  attempts?: ProjectAttempt[];
  total?: number;
  limit?: number;
  offset?: number;
}