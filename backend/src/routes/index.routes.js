const express = require("express");

const router = express.Router();

router.use("/health", require("./health.routes"));
router.use("/auth", require("./auth.routes"));
router.use("/challenges", require("./challenge.routes"));
router.use("/projects", require("./projects.routes"));
router.use("/projects", require("./validation.routes")); // POST /projects/:id/evaluate

module.exports = router;
