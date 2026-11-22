export type IssueSeverity = "error" | "warning" | "info";

export interface EvaluationIssue {
  id: string;
  ruleId: string;
  severity: IssueSeverity;
  category: string;
  title: string;
  message: string;
  suggestion: string | null;
  nodeIds: string[];
  edgeIds: string[];
  penalty: number;
}

export interface EvaluationResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  passed: boolean;
  summary: { errors: number; warnings: number; info: number };
  stats: {
    nodeCount: number;
    edgeCount: number;
    componentCounts: Record<string, number>;
  };
  issues: EvaluationIssue[];
  evaluatedAt: string;
}
