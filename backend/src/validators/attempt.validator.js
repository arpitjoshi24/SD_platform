const { z } = require("zod");
const { architectureSnapshotSchema } = require("./project.validator");

const projectIdParamSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
});

const attemptIdParamSchema = z.object({
  attemptId: z.string().uuid("Invalid attempt ID"),
});

const listAttemptsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const saveAttemptBodySchema = z
  .object({
    idempotency_key: z.string().uuid("idempotency_key must be a valid UUID"),
    nodes: architectureSnapshotSchema.shape.nodes.optional(),
    edges: architectureSnapshotSchema.shape.edges.optional(),
    snapshot: architectureSnapshotSchema.optional(),
    simulation_config: z.record(z.string(), z.any()).nullable().optional(),
    simulation_result: z.record(z.string(), z.any()).nullable().optional(),
    simulation_engine_version: z.string().trim().max(80).nullable().optional(),
  })
  .refine(
    (data) =>
      Boolean(data.snapshot) ||
      Array.isArray(data.nodes) ||
      Array.isArray(data.edges),
    {
      message: "Architecture snapshot (snapshot or nodes/edges) is required",
      path: ["snapshot"],
    }
  );

module.exports = {
  projectIdParamSchema,
  attemptIdParamSchema,
  listAttemptsQuerySchema,
  saveAttemptBodySchema,
};