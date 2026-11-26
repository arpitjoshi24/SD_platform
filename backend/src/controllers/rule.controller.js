const {
  listRules,
  getRuleById,
  getRuleVersions,
  getPracticeAvailableRules,
  getProjectRuleSelectionsForUser,
  setPracticeRuleSelections,
} = require("../services/rule.service");
const { successResponse } = require("../utils/response");

// GET /rules
const getRulesCatalog = async (req, res, next) => {
  try {
    const filters = {
      rule_type: req.query?.rule_type ? String(req.query.rule_type).trim() : null,
      category: req.query?.category ? String(req.query.category).trim() : null,
      is_active:
        req.query?.is_active !== undefined
          ? req.query.is_active === "true"
          : true,
      is_practice_available:
        req.query?.is_practice_available !== undefined
          ? req.query.is_practice_available === "true"
          : null,
      search: req.query?.search ? String(req.query.search).trim() : null,
    };

    const rules = await listRules(filters);
    return successResponse(res, "Rules fetched successfully", rules);
  } catch (err) {
    return next(err);
  }
};

// GET /rules/practice
const getPracticeRules = async (req, res, next) => {
  try {
    const rules = await getPracticeAvailableRules();
    return successResponse(res, "Practice rules fetched successfully", rules);
  } catch (err) {
    return next(err);
  }
};

// GET /rules/:ruleId
const getRule = async (req, res, next) => {
  try {
    const rule = await getRuleById(req.params.ruleId);
    return successResponse(res, "Rule fetched successfully", rule);
  } catch (err) {
    return next(err);
  }
};

// GET /rules/:ruleId/versions
const getRuleVersionHistory = async (req, res, next) => {
  try {
    const versions = await getRuleVersions(req.params.ruleId);
    return successResponse(res, "Rule versions fetched successfully", versions);
  } catch (err) {
    return next(err);
  }
};

// GET /rules/projects/:projectId/selections
const getProjectPracticeSelections = async (req, res, next) => {
  try {
    const selections = await getProjectRuleSelectionsForUser(
      req.params.projectId,
      req.user.id
    );
    return successResponse(
      res,
      "Practice rule selections fetched successfully",
      selections
    );
  } catch (err) {
    return next(err);
  }
};

// PUT /rules/projects/:projectId/selections
const updateProjectPracticeSelections = async (req, res, next) => {
  try {
    const updated = await setPracticeRuleSelections(
      req.params.projectId,
      req.user.id,
      req.body.selections || []
    );
    return successResponse(
      res,
      "Practice rule selections updated successfully",
      updated
    );
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getRulesCatalog,
  getPracticeRules,
  getRule,
  getRuleVersionHistory,
  getProjectPracticeSelections,
  updateProjectPracticeSelections,
};