const { z } = require("zod");
const {
  createChallengeSchema,
  updateChallengeSchema,
  publishChallengeSchema,
  challengeRuleAssignmentInputSchema,
} = require("./challenge.validator");
const {
  createRuleSchema,
  updateRuleSchema,
  createRuleVersionSchema,
} = require("./rule.validator");

const uuidSchema = z.string().uuid("Invalid UUID");

const adminUserIdParamSchema = z.object({
  userId: uuidSchema,
});

const adminChallengeIdParamSchema = z.object({
  challengeId: uuidSchema,
});

const adminRuleIdParamSchema = z.object({
  ruleId: uuidSchema,
});

const adminUsersQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  role: z.enum(["user", "admin"]).optional(),
  account_status: z.enum(["active", "suspended"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const adminChallengesQuerySchema = z.object({
  includeArchived: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? true : v === "true")),
  search: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const updateUserAccountStatusSchema = z.object({
  account_status: z.enum(["active", "suspended"]),
  reason: z.string().trim().max(500).optional(),
});

const assignChallengeRulesSchema = z.object({
  assignments: z.array(challengeRuleAssignmentInputSchema).min(1),
});

module.exports = {
  adminUserIdParamSchema,
  adminChallengeIdParamSchema,
  adminRuleIdParamSchema,
  adminUsersQuerySchema,
  adminChallengesQuerySchema,
  updateUserAccountStatusSchema,
  assignChallengeRulesSchema,
  createChallengeSchema,
  updateChallengeSchema,
  publishChallengeSchema,
  createRuleSchema,
  updateRuleSchema,
  createRuleVersionSchema,
};