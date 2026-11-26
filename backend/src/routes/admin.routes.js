const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  adminUserIdParamSchema,
  adminChallengeIdParamSchema,
  adminRuleIdParamSchema,
  adminListQuerySchema,
  updateUserStatusSchema,
  createChallengeSchema,
  updateChallengeSchema,
  createRuleSchema,
  updateRuleSchema,
  createRuleVersionSchema,
} = require("../validators/admin.validator");
const {
  getDashboardStats,
  listAdminChallenges,
  createAdminChallenge,
  updateAdminChallenge,
  createAdminChallengeVersion,
  archiveAdminChallenge,
  restoreAdminChallenge,
  listAdminRules,
  createAdminRule,
  updateAdminRule,
  createAdminRuleVersion,
  listAdminRuleVersions,
  listAdminUsers,
  getAdminUserDetails,
  updateAdminUserStatus,
  getAdminChallengeStatistics,
  getAdminChallengeParticipants,
} = require("../controllers/admin.controller");

const router = express.Router();

// Every admin route requires a valid JWT and the 'admin' role.
router.use(authMiddleware, requireRole("admin"));

// Dashboard overview stats
router.get("/dashboard/stats", getDashboardStats);

// Challenges management & versioning
router.get(
  "/challenges",
  validate({ query: adminListQuerySchema }),
  listAdminChallenges
);
router.post(
  "/challenges",
  validate(createChallengeSchema),
  createAdminChallenge
);
router.put(
  "/challenges/:challengeId",
  validate({ params: adminChallengeIdParamSchema, body: updateChallengeSchema }),
  updateAdminChallenge
);
router.post(
  "/challenges/:challengeId/versions",
  validate({ params: adminChallengeIdParamSchema, body: updateChallengeSchema }),
  createAdminChallengeVersion
);
router.post(
  "/challenges/:challengeId/archive",
  validate({ params: adminChallengeIdParamSchema }),
  archiveAdminChallenge
);
router.post(
  "/challenges/:challengeId/restore",
  validate({ params: adminChallengeIdParamSchema }),
  restoreAdminChallenge
);

// Challenge analytics
router.get(
  "/challenges/:challengeId/statistics",
  validate({ params: adminChallengeIdParamSchema }),
  getAdminChallengeStatistics
);
router.get(
  "/challenges/:challengeId/participants",
  validate({ params: adminChallengeIdParamSchema, query: adminListQuerySchema }),
  getAdminChallengeParticipants
);

// Rules catalog & versioning
router.get("/rules", validate({ query: adminListQuerySchema }), listAdminRules);
router.post("/rules", validate(createRuleSchema), createAdminRule);
router.put(
  "/rules/:ruleId",
  validate({ params: adminRuleIdParamSchema, body: updateRuleSchema }),
  updateAdminRule
);
router.post(
  "/rules/:ruleId/versions",
  validate({ params: adminRuleIdParamSchema, body: createRuleVersionSchema }),
  createAdminRuleVersion
);
router.get(
  "/rules/:ruleId/versions",
  validate({ params: adminRuleIdParamSchema }),
  listAdminRuleVersions
);

// Users management
router.get("/users", validate({ query: adminListQuerySchema }), listAdminUsers);
router.get(
  "/users/:userId",
  validate({ params: adminUserIdParamSchema }),
  getAdminUserDetails
);
router.patch(
  "/users/:userId/status",
  validate({ params: adminUserIdParamSchema, body: updateUserStatusSchema }),
  updateAdminUserStatus
);

module.exports = router;