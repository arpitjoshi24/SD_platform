import type { Edge, Node } from "@xyflow/react";

export type ProjectStatus = "draft" | "submitted" | "completed";

export interface Project {
  id: string;
  user_id?: string;
  challenge_id: string;
  title: string;
  nodes: Node[];
  edges: Edge[];
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface UpdateProjectPayload {
  title?: string;
  nodes?: Node[];
  edges?: Edge[];
  status?: ProjectStatus;
}
