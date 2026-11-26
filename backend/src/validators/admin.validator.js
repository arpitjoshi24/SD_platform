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

const adminListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  role: z.enum(["user", "admin"]).optional(),
  account_status: z.enum(["active", "suspended"]).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  rule_type: z.enum(["generic", "challenge_specific"]).optional(),
  category: z.string().trim().max(80).optional(),
  include_archived: z.enum(["true", "false"]).optional(),
  is_published: z.enum(["true", "false"]).optional(),
  is_active: z.enum(["true", "false"]).optional(),
  is_practice_available: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const updateUserStatusSchema = z.object({
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
  adminListQuerySchema,
  updateUserStatusSchema,
  assignChallengeRulesSchema,
  createChallengeSchema,
  updateChallengeSchema,
  publishChallengeSchema,
  createRuleSchema,
  updateRuleSchema,
  createRuleVersionSchema,
};