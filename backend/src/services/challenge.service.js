const AppError = require("../utils/AppError");
const {
  findAllChallenges,
  findChallengeById,
} = require("../repositories/challenge.repository");

const getAllChallenges = async () => findAllChallenges();

const getChallengeById = async (id) => {
  const challenge = await findChallengeById(id);

  if (!challenge) {
    throw new AppError("Challenge not found", 404);
  }

  return challenge;
};

module.exports = {
  getAllChallenges,
  getChallengeById,
};
