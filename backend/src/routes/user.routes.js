const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  updateProfileSchema,
  activityHeatmapQuerySchema,
} = require("../validators/user.validator");
const {
  getMyProfile,
  updateMyProfile,
  getMyStatistics,
  getMyActivity,
} = require("../controllers/user.controller");

const router = express.Router();

router.get("/me", authMiddleware, getMyProfile);
router.patch(
  "/me",
  authMiddleware,
  validate(updateProfileSchema),
  updateMyProfile
);
router.get("/me/statistics", authMiddleware, getMyStatistics);
router.get(
  "/me/activity",
  authMiddleware,
  validate({ query: activityHeatmapQuerySchema }),
  getMyActivity
);

module.exports = router;