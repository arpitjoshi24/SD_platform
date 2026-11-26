const {
  getAllChallenges,
  getChallengeById,
  getChallengeBySlug,
  resolveChallengeVersion,
} = require("../services/challenge.service");
const { successResponse } = require("../utils/response");
const { isValidUuid } = require("../utils/helpers");

// GET /challenges
const getChallenges = async (req, res, next) => {
  try {
    const challenges = await getAllChallenges();
    return successResponse(res, "Challenges fetched successfully", challenges);
  } catch (err) {
    return next(err);
  }
};

// GET /challenges/:idOrSlug
const getChallenge = async (req, res, next) => {
  try {
    const idOrSlug = String(
      req.params.id || req.params.idOrSlug || ""
    ).trim();
    const challenge = isValidUuid(idOrSlug)
      ? await getChallengeById(idOrSlug)
      : await getChallengeBySlug(idOrSlug);

    let versionInfo = null;
    try {
      const resolved = await resolveChallengeVersion(challenge.id);
      versionInfo = {
        id: resolved.version.id,
        version_number: resolved.version.version_number,
        created_at: resolved.version.created_at,
      };
    } catch {
      versionInfo = null;
    }

    return successResponse(res, "Challenge fetched successfully", {
      ...challenge,
      current_version: versionInfo,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { getChallenges, getChallenge };