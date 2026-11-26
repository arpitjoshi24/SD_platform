const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { architectureSnapshotSchema } = require("../validators/project.validator");
const { evaluate } = require("../controllers/validation.controller");

// mounted at /projects -> POST /projects/:id/evaluate
const router = express.Router();

router.post(
  "/:id/evaluate",
  authMiddleware,
  validate(architectureSnapshotSchema.partial()),
  evaluate
);

module.exports = router;