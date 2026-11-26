const AppError = require("../utils/AppError");
const { successResponse } = require("../utils/response");
const { toSafeUser } = require("../types/userTypes");
const {
  createChallengeWithVersion,
  updateChallengeAndCreateVersion,
  findAllChallengesForAdmin,
  archiveChallenge,
  restoreChallenge,
  findChallengeStatistics,
  findChallengeParticipants,
} = require("../services/challenge.service");
const {
  createRuleRecord,
  updateRuleRecord,
  createNewRuleVersion,
  listRules,
  getRuleVersions,
} = require("../services/rule.service");
const {
  findAllUsersForAdmin,
  getUserProfileById,
  updateUserAccountStatusById,
} = require("../repositories/user.repository");

// --- Challenges ---

const listAdminChallenges = async (req, res, next) => {
  try {
    const query = req.validatedQuery || req.query || {};
    const challenges = await findAllChallengesForAdmin({
      include_archived:
        query.include_archived === true || query.include_archived === "true",
      is_published:
        query.is_published !== undefined
          ? query.is_published === true || query.is_published === "true"
          : null,
      difficulty: query.difficulty || null,
      search: query.search || null,
    });
    return successResponse(
      res,
      "Admin challenges fetched successfully",
      challenges
    );
  } catch (err) {
    return next(err);
  }
};

const createAdminChallenge = async (req, res, next) => {
  try {
    const created = await createChallengeWithVersion(req.body, req.user.id);
    return successResponse(
      res,
      "Challenge created with initial version successfully",
      created,
      201
    );
  } catch (err) {
    return next(err);
  }
};

const updateAdminChallenge = async (req, res, next) => {
  try {
    const challengeId = req.params.challengeId || req.params.id;
    const updated = await updateChallengeAndCreateVersion(
      challengeId,
      req.body,
      req.user.id
    );
    return successResponse(
      res,
      "Challenge updated and new version created successfully",
      updated
    );
  } catch (err) {
    return next(err);
  }
};

const createAdminChallengeVersion = async (req, res, next) => {
  try {
    const challengeId = req.params.challengeId || req.params.id;
    const created = await updateChallengeAndCreateVersion(
      challengeId,
      req.body,
      req.user.id
    );
    return successResponse(
      res,
      "New challenge version created successfully",
      created,
      201
    );
  } catch (err) {
    return next(err);
  }
};

const archiveAdminChallenge = async (req, res, next) => {
  try {
    const challengeId = req.params.challengeId || req.params.id;
    const archived = await archiveChallenge(challengeId);
    if (!archived) {
      throw new AppError("Challenge not found", 404);
    }
    return successResponse(res, "Challenge archived successfully", archived);
  } catch (err) {
    return next(err);
  }
};

const restoreAdminChallenge = async (req, res, next) => {
  try {
    const challengeId = req.params.challengeId || req.params.id;
    const restored = await restoreChallenge(challengeId);
    if (!restored) {
      throw new AppError("Challenge not found", 404);
    }
    return successResponse(res, "Challenge restored successfully", restored);
  } catch (err) {
    return next(err);
  }
};

// --- Rules ---

const listAdminRules = async (req, res, next) => {
  try {
    const query = req.validatedQuery || req.query || {};
    const rules = await listRules({
      rule_type: query.rule_type || null,
      category: query.category || null,
      is_active:
        query.is_active !== undefined
          ? query.is_active === true || query.is_active === "true"
          : null,
      is_practice_available:
        query.is_practice_available !== undefined
          ? query.is_practice_available === true ||
            query.is_practice_available === "true"
          : null,
      search: query.search || null,
    });
    return successResponse(res, "Admin rules fetched successfully", rules);
  } catch (err) {
    return next(err);
  }
};

const createAdminRule = async (req, res, next) => {
  try {
    const created = await createRuleRecord(req.body, req.user.id);
    return successResponse(
      res,
      "Rule created with initial version successfully",
      created,
      201
    );
  } catch (err) {
    return next(err);
  }
};

const updateAdminRule = async (req, res, next) => {
  try {
    const ruleId = req.params.ruleId || req.params.id;
    const updated = await updateRuleRecord(ruleId, req.body, req.user.id);
    return successResponse(res, "Rule updated successfully", updated);
  } catch (err) {
    return next(err);
  }
};

const createAdminRuleVersion = async (req, res, next) => {
  try {
    const ruleId = req.params.ruleId || req.params.id;
    const created = await createNewRuleVersion(ruleId, req.body, req.user.id);
    return successResponse(
      res,
      "New rule version created successfully",
      created,
      201
    );
  } catch (err) {
    return next(err);
  }
};

const listAdminRuleVersions = async (req, res, next) => {
  try {
    const ruleId = req.params.ruleId || req.params.id;
    const versions = await getRuleVersions(ruleId);
    return successResponse(res, "Rule versions fetched successfully", versions);
  } catch (err) {
    return next(err);
  }
};

// --- Users ---

const listAdminUsers = async (req, res, next) => {
  try {
    const query = req.validatedQuery || req.query || {};
    const users = await findAllUsersForAdmin({
      role: query.role || null,
      account_status: query.account_status || null,
      search: query.search || null,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    });
    const safeUsers = Array.isArray(users)
      ? users.map(toSafeUser)
      : {
          ...users,
          items: Array.isArray(users?.items) ? users.items.map(toSafeUser) : [],
        };
    return successResponse(res, "Users fetched successfully", safeUsers);
  } catch (err) {
    return next(err);
  }
};

const getAdminUserDetails = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.params.id;
    const user = await getUserProfileById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return successResponse(res, "User details fetched successfully", toSafeUser(user));
  } catch (err) {
    return next(err);
  }
};

const updateAdminUserStatus = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.params.id;
    const { account_status } = req.body;

    if (userId === req.user.id && account_status !== "active") {
      throw new AppError("Admins cannot suspend or deactivate their own account", 400);
    }

    const updated = await updateUserAccountStatusById({
      user_id: userId,
      account_status,
    });
    if (!updated) {
      throw new AppError("User not found", 404);
    }
    return successResponse(
      res,
      "User account status updated successfully",
      toSafeUser(updated)
    );
  } catch (err) {
    return next(err);
  }
};

// --- Analytics ---

const getAdminChallengeStatistics = async (req, res, next) => {
  try {
    const challengeId = req.params.challengeId || req.params.id;
    const stats = await findChallengeStatistics(challengeId);
    if (!stats) {
      throw new AppError("Challenge not found", 404);
    }
    return successResponse(
      res,
      "Challenge statistics fetched successfully",
      stats
    );
  } catch (err) {
    return next(err);
  }
};

const getAdminChallengeParticipants = async (req, res, next) => {
  try {
    const challengeId = req.params.challengeId || req.params.id;
    const query = req.validatedQuery || req.query || {};
    const participants = await findChallengeParticipants(challengeId, {
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    });
    if (!participants) {
      throw new AppError("Challenge not found", 404);
    }
    return successResponse(
      res,
      "Challenge participants fetched successfully",
      participants
    );
  } catch (err) {
    return next(err);
  }
};

module.exports = {
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
};