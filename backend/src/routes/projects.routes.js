const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const { attachOwnedProject } = require("../middlewares/project.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  createProjectSchema,
  updateProjectSchema,
} = require("../validators/project.validator");
const { listAttemptsQuerySchema } = require("../validators/attempt.validator");
const {
  createProject,
  getProjects,
  getProject,
  getProjectSummaryController,
  getProjectHistoryController,
  updateProjectController,
  deleteProjectController,
} = require("../controllers/project.controller");

const router = express.Router();

router.get("/", authMiddleware, getProjects);
router.post("/", authMiddleware, validate(createProjectSchema), createProject);
router.get("/:id", authMiddleware, attachOwnedProject(), getProject);
router.get(
  "/:id/summary",
  authMiddleware,
  attachOwnedProject(),
  getProjectSummaryController
);
router.get(
  "/:id/history",
  authMiddleware,
  attachOwnedProject(),
  validate({ query: listAttemptsQuerySchema }),
  getProjectHistoryController
);
router.put(
  "/:id",
  authMiddleware,
  attachOwnedProject(),
  validate(updateProjectSchema),
  updateProjectController
);
router.delete(
  "/:id",
  authMiddleware,
  attachOwnedProject(),
  deleteProjectController
);

module.exports = router;