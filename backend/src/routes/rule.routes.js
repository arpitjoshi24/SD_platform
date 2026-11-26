const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { updatePracticeRuleSelectionsSchema } = require("../validators/rule.validator");
const {
  getRulesCatalog,
  getPracticeRules,
  getRule,
  getRuleVersionHistory,
  getProjectPracticeSelections,
  updateProjectPracticeSelections,
} = require("../controllers/rule.controller");

const router = express.Router();

router.get("/", authMiddleware, getRulesCatalog);
router.get("/practice", authMiddleware, getPracticeRules);
router.get("/projects/:projectId/selections", authMiddleware, getProjectPracticeSelections);
router.put(
  "/projects/:projectId/selections",
  authMiddleware,
  validate(updatePracticeRuleSelectionsSchema),
  updateProjectPracticeSelections
);
router.get("/:ruleId", authMiddleware, getRule);
router.get("/:ruleId/versions", authMiddleware, getRuleVersionHistory);

module.exports = router;