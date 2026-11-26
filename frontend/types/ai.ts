import type { Edge, Node } from "@xyflow/react";
import type { EvaluationResult } from "./evaluation";

export interface AIMentorMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AIMentorRequestPayload {
  projectId: string;
  prompt: string;
  snapshot?: {
    nodes: Node[];
    edges: Edge[];
  };
  evaluation?: EvaluationResult | null;
  history?: AIMentorMessage[];
}

export interface AIMentorResponse {
  reply: string;
  suggestedFocus?: string[];
  tradeOffs?: string[];
}