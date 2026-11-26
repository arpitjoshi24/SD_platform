const express = require("express");
const {
  projectAttemptsRouter,
  attemptItemRouter,
} = require("./attempt.routes");

const router = express.Router();

router.use("/health", require("./health.routes"));
router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/challenges", require("./challenge.routes"));
router.use("/projects", require("./projects.routes"));
router.use("/projects", require("./validation.routes")); // POST /projects/:id/evaluate
router.use("/projects", projectAttemptsRouter); // POST/GET /projects/:projectId/attempts
router.use("/attempts", attemptItemRouter); // GET/DELETE /attempts/:attemptId
router.use("/rules", require("./rule.routes"));
router.use("/admin", require("./admin.routes"));

// Simulation and AI Mentor are deferred to the next phase; keep unmounted until implemented.

module.exports = router;
