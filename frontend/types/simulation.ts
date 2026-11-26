import type { Edge, Node } from "@xyflow/react";

export interface SimulationTrafficConfig {
  requestsPerSecond: number;
  readWriteRatio?: number;
  payloadSizeKb?: number;
}

export interface SimulationFailureConfig {
  enabled?: boolean;
  targetNodeIds?: string[];
  failureRate?: number;
}

export interface SimulationConfig {
  traffic: SimulationTrafficConfig;
  durationSeconds: number;
  failure?: SimulationFailureConfig;
}

export interface SimulationResult {
  throughputRps: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  capacityUtilization: number;
  queueDepthPeak?: number;
  droppedRequests?: number;
  bottleneckNodeIds?: string[];
  summary?: string;
  simulatedAt?: string;
}

export interface RunSimulationPayload {
  projectId?: string;
  snapshot: {
    nodes: Node[];
    edges: Edge[];
  };
  config: SimulationConfig;
}