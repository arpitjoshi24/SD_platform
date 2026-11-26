const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  createChallengeSchema,
  updateChallengeSchema,
  createChallengeVersionSchema,
  createRuleSchema,
  updateRuleSchema,
  createRuleVersionSchema,
  updateUserStatusSchema,
  adminListQuerySchema,
} = require("../validators/admin.validator");
const {
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
  validate(updateChallengeSchema),
  updateAdminChallenge
);
router.post(
  "/challenges/:challengeId/versions",
  validate(createChallengeVersionSchema),
  createAdminChallengeVersion
);
router.post("/challenges/:challengeId/archive", archiveAdminChallenge);
router.post("/challenges/:challengeId/restore", restoreAdminChallenge);

// Challenge analytics
router.get(
  "/challenges/:challengeId/statistics",
  getAdminChallengeStatistics
);
router.get(
  "/challenges/:challengeId/participants",
  validate({ query: adminListQuerySchema }),
  getAdminChallengeParticipants
);

// Rules catalog & versioning
router.get("/rules", validate({ query: adminListQuerySchema }), listAdminRules);
router.post("/rules", validate(createRuleSchema), createAdminRule);
router.put("/rules/:ruleId", validate(updateRuleSchema), updateAdminRule);
router.post(
  "/rules/:ruleId/versions",
  validate(createRuleVersionSchema),
  createAdminRuleVersion
);
router.get("/rules/:ruleId/versions", listAdminRuleVersions);

// Users management
router.get("/users", validate({ query: adminListQuerySchema }), listAdminUsers);
router.get("/users/:userId", getAdminUserDetails);
router.patch(
  "/users/:userId/status",
  validate(updateUserStatusSchema),
  updateAdminUserStatus
);

module.exports = router;