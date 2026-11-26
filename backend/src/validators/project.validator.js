const { z } = require("zod");

const MAX_NODES = 200;
const MAX_EDGES = 400;

const uuidSchema = z.string().uuid("Invalid UUID");

const nodeSchema = z
  .object({
    id: z.string().min(1).max(120),
    type: z.string().min(1).max(80).optional(),
    position: z.object({
      x: z.number().finite(),
      y: z.number().finite(),
    }),
    data: z.record(z.string(), z.any()).optional(),
  })
  .passthrough();

const edgeSchema = z
  .object({
    id: z.string().min(1).max(120),
    source: z.string().min(1).max(120),
    target: z.string().min(1).max(120),
  })
  .passthrough();

const architectureSnapshotSchema = z.object({
  nodes: z
    .array(nodeSchema)
    .max(MAX_NODES, `A design can have at most ${MAX_NODES} components`)
    .default([]),
  edges: z
    .array(edgeSchema)
    .max(MAX_EDGES, `A design can have at most ${MAX_EDGES} connections`)
    .default([]),
});

const practiceRuleSelectionInputSchema = z.object({
  rule_id: uuidSchema,
  is_selected: z.boolean().default(true),
  config_override: z.record(z.string(), z.any()).default({}),
});

const createProjectSchema = z
  .object({
    project_mode: z.enum(["challenge", "practice"]).default("challenge"),
    challenge_id: uuidSchema.nullable().optional(),
    title: z
      .string()
      .trim()
      .min(2, "Project title must be at least 2 characters")
      .max(180, "Project title is too long")
      .optional(),
    selected_rules: z.array(practiceRuleSelectionInputSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.project_mode === "challenge" && !data.challenge_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["challenge_id"],
        message: "challenge_id is required when project_mode is 'challenge'",
      });
    }
    if (data.project_mode === "practice" && data.challenge_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["challenge_id"],
        message: "Practice projects cannot be associated with a challenge_id",
      });
    }
    if (
      data.project_mode === "challenge" &&
      Array.isArray(data.selected_rules) &&
      data.selected_rules.length > 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["selected_rules"],
        message: "Guided challenge projects do not allow user rule selection",
      });
    }
  });

const updateProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Project title must be at least 2 characters")
    .max(180, "Project title is too long")
    .optional(),
  status: z.enum(["in_progress", "completed", "archived"]).optional(),
});

module.exports = {
  MAX_NODES,
  MAX_EDGES,
  nodeSchema,
  edgeSchema,
  architectureSnapshotSchema,
  practiceRuleSelectionInputSchema,
  createProjectSchema,
  updateProjectSchema,
};