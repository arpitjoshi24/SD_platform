const { z } = require("zod");

const uuidSchema = z.string().uuid("Invalid UUID");

const ruleTypeSchema = z.enum(["generic", "challenge_specific"]);
const ruleCategorySchema = z.enum([
  "structure",
  "connection",
  "performance",
  "reliability",
  "requirement",
  "security",
  "data_integrity",
]);
const ruleSeveritySchema = z.enum(["info", "warning", "error", "critical"]);

const createRuleSchema = z
  .object({
    rule_key: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(/^[A-Z0-9_]+$/, "rule_key must use uppercase letters, numbers, and underscores"),
    name: z.string().trim().min(2).max(180),
    description: z.string().trim().min(5).max(3000),
    rule_type: ruleTypeSchema,
    category: ruleCategorySchema,
    severity: ruleSeveritySchema.default("warning"),
    applicability: z.record(z.string(), z.any()).default({}),
    is_mandatory: z.boolean().default(false),
    is_active: z.boolean().default(true),
    is_practice_available: z.boolean().default(false),
    config: z.record(z.string(), z.any()).default({}),
  })
  .superRefine((data, ctx) => {
    if (data.is_mandatory && data.rule_type !== "generic") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["is_mandatory"],
        message: "Only generic rules can be marked mandatory",
      });
    }
    if (data.is_practice_available && data.rule_type !== "generic") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["is_practice_available"],
        message: "Only generic rules can be available for practice projects",
      });
    }
  });

const updateRuleSchema = z.object({
  name: z.string().trim().min(2).max(180).optional(),
  description: z.string().trim().min(5).max(3000).optional(),
  category: ruleCategorySchema.optional(),
  severity: ruleSeveritySchema.optional(),
  applicability: z.record(z.string(), z.any()).optional(),
  is_active: z.boolean().optional(),
  is_practice_available: z.boolean().optional(),
  config: z.record(z.string(), z.any()).optional(),
});

const createRuleVersionSchema = z.object({
  config: z.record(z.string(), z.any()).default({}),
  metadata_snapshot: z.record(z.string(), z.any()).optional(),
});

const updatePracticeRuleSelectionsSchema = z.object({
  selections: z.array(
    z.object({
      rule_id: uuidSchema,
      is_selected: z.boolean().default(true),
      config_override: z.record(z.string(), z.any()).default({}),
    })
  ),
});

module.exports = {
  createRuleSchema,
  updateRuleSchema,
  createRuleVersionSchema,
  updatePracticeRuleSelectionsSchema,
};