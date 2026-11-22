const {
  getAllChallenges,
  getChallengeById,
} = require("../services/challenge.service");
const { successResponse } = require("../utils/response");

// GET /challenges
const getChallenges = async (req, res) => {
  const challenges = await getAllChallenges();

  return successResponse(res, "Challenges fetched successfully", challenges);
};

// GET /challenges/:id
const getChallenge = async (req, res) => {
  const challenge = await getChallengeById(req.params.id);

  return successResponse(res, "Challenge fetched successfully", challenge);
};

module.exports = { getChallenges, getChallenge };
