const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  createProjectSchema,
  updateProjectSchema,
} = require("../validators/project.validator");
const {
  createProject,
  getProjects,
  getProject,
  updateProjectController,
} = require("../controllers/project.controller");

const router = express.Router();

router.get("/", authMiddleware, getProjects);
router.get("/:id", authMiddleware, getProject);
router.post("/", authMiddleware, validate(createProjectSchema), createProject);
router.put("/:id", authMiddleware, validate(updateProjectSchema), updateProjectController);

module.exports = router;
