const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { updatePracticeRuleSelectionsSchema } = require("../validators/rule.validator");
const {
  getRulesCatalog,
  getPracticeRules,
  getRule,
  getRuleVersionHistory,
  updateProjectPracticeSelections,
} = require("../controllers/rule.controller");

const router = express.Router();

router.get("/", authMiddleware, getRulesCatalog);
router.get("/practice", authMiddleware, getPracticeRules);
router.get("/:ruleId", authMiddleware, getRule);
router.get("/:ruleId/versions", authMiddleware, getRuleVersionHistory);
router.put(
  "/projects/:projectId/selections",
  authMiddleware,
  validate(updatePracticeRuleSelectionsSchema),
  updateProjectPracticeSelections
);

module.exports = router;