const express = require("express");

const router = express.Router();

const {
  getChallenges,
  getChallenge,
} = require("../controllers/challenge.controller");


router.get("/", getChallenges);

router.get("/:id", getChallenge);


module.exports = router;