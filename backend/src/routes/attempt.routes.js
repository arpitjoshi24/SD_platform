const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  projectIdParamSchema,
  attemptIdParamSchema,
  listAttemptsQuerySchema,
  saveAttemptBodySchema,
} = require("../validators/attempt.validator");
const {
  saveAttemptController,
  listAttemptsController,
  getAttemptController,
  deleteAttemptController,
} = require("../controllers/attempt.controller");

const projectAttemptsRouter = express.Router();
projectAttemptsRouter.post(
  "/:projectId/attempts",
  authMiddleware,
  validate({
    params: projectIdParamSchema,
    body: saveAttemptBodySchema,
  }),
  saveAttemptController
);
projectAttemptsRouter.get(
  "/:projectId/attempts",
  authMiddleware,
  validate({
    params: projectIdParamSchema,
    query: listAttemptsQuerySchema,
  }),
  listAttemptsController
);

const attemptItemRouter = express.Router();
attemptItemRouter.get(
  "/:attemptId",
  authMiddleware,
  validate({ params: attemptIdParamSchema }),
  getAttemptController
);
attemptItemRouter.delete(
  "/:attemptId",
  authMiddleware,
  validate({ params: attemptIdParamSchema }),
  deleteAttemptController
);

module.exports = {
  projectAttemptsRouter,
  attemptItemRouter,
};