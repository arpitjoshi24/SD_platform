const express = require("express");

const {
  getChallenges,
  getChallenge,
} = require("../controllers/challenge.controller");

const router = express.Router();

router.get("/", getChallenges);
router.get("/:id", getChallenge);

module.exports = router;