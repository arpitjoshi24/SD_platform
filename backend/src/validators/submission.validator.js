const { z } = require("zod");
const { architectureSnapshotSchema } = require("./project.validator");

const submissionRequestSchema = z.object({
  idempotency_key: z.string().uuid("idempotency_key must be a valid UUID"),
  nodes: architectureSnapshotSchema.shape.nodes.optional(),
  edges: architectureSnapshotSchema.shape.edges.optional(),
  snapshot: architectureSnapshotSchema.optional(),
  simulation_config: z.record(z.string(), z.any()).nullable().optional(),
  simulation_result: z.record(z.string(), z.any()).nullable().optional(),
  simulation_engine_version: z.string().trim().max(80).nullable().optional(),
});

module.exports = {
  submissionRequestSchema,
};