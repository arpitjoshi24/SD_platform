const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { evaluate } = require("../controllers/validation.controller");

// mounted at /projects  ->  POST /projects/:id/evaluate
const router = express.Router();

router.post("/:id/evaluate", authMiddleware, evaluate);

module.exports = router;
