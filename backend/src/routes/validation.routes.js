const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");

const {
  evaluatePayloadSchema,
} = require("../validators/project.validator");

const {
  evaluate,
} = require("../controllers/validation.controller");

// Mounted at /projects
// POST /projects/:id/evaluate

const router = express.Router();

router.post(
  "/:id/evaluate",
  authMiddleware,
  validate(evaluatePayloadSchema),
  evaluate
);

module.exports = router;