const { z } = require("zod");

const uuidSchema = z.string().uuid("Invalid UUID");

const componentType = z.enum([
  "api",
  "database",
  "cache",
  "loadbalancer",
  "queue",
  "worker",
]);

const connectionRule = z.union([
  z.tuple([componentType, componentType]),
  z.object({
    from: componentType,
    to: componentType,
    reason: z.string().trim().max(500).optional(),
  }),
]);

const componentRule = z.object({
  type: componentType,
  min: z.number().int().min(1).max(100).default(1),
  reason: z.string().trim().max(500).optional(),
});

const evaluationConfigSchema = z
  .object({
    required_components: z.array(componentRule).default([]),
    recommended_components: z.array(componentRule).default([]),
    required_connections: z.array(connectionRule).default([]),
    recommended_connections: z.array(connectionRule).default([]),
    forbidden_connections: z.array(connectionRule).default([]),
    traffic: z
      .object({
        read_rps: z.number().nonnegative().max(10_000_000).optional(),
        write_rps: z.number().nonnegative().max(10_000_000).optional(),
      })
      .optional(),
  })
  .passthrough();

const challengeRuleAssignmentInputSchema = z.object({
  rule_id: uuidSchema,
  rule_version_id: uuidSchema.optional(),
  is_enabled: z.boolean().default(true),
  config_override: z.record(z.string(), z.any()).default({}),
});

const createChallengeSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase hyphen-separated"
    )
    .optional(),
  description: z.string().trim().min(10).max(5000),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  category: z.string().trim().min(1).max(100).nullable().optional(),
  estimated_minutes: z.number().int().positive().max(1440).nullable().optional(),
  requirements: z.array(z.string().trim().min(1).max(500)).default([]),
  hints: z.array(z.string().trim().min(1).max(500)).default([]),
  is_published: z.boolean().default(false),
  evaluation_config: evaluationConfigSchema.optional(),
  rule_assignments: z.array(challengeRuleAssignmentInputSchema).default([]),
});

const updateChallengeSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase hyphen-separated"
    )
    .optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  category: z.string().trim().min(1).max(100).nullable().optional(),
  estimated_minutes: z.number().int().positive().max(1440).nullable().optional(),
  requirements: z.array(z.string().trim().min(1).max(500)).optional(),
  hints: z.array(z.string().trim().min(1).max(500)).optional(),
  is_published: z.boolean().optional(),
  evaluation_config: evaluationConfigSchema.optional(),
  rule_assignments: z.array(challengeRuleAssignmentInputSchema).optional(),
});

const publishChallengeSchema = z.object({
  is_published: z.boolean(),
});

module.exports = {
  evaluationConfigSchema,
  challengeRuleAssignmentInputSchema,
  createChallengeSchema,
  updateChallengeSchema,
  publishChallengeSchema,
};