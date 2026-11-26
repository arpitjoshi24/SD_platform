const {
  getProfile,
  updateProfile,
  getStatistics,
  getActivityHeatmap,
} = require("../services/user.service");
const { successResponse } = require("../utils/response");

// GET /users/me
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.id);
    return successResponse(res, "Profile fetched successfully", profile);
  } catch (err) {
    return next(err);
  }
};

// PATCH /users/me
const updateMyProfile = async (req, res, next) => {
  try {
    const updated = await updateProfile({
      user_id: req.user.id,
      full_name: req.body.full_name,
      timezone: req.body.timezone,
    });
    return successResponse(res, "Profile updated successfully", updated);
  } catch (err) {
    return next(err);
  }
};

// GET /users/me/statistics
const getMyStatistics = async (req, res, next) => {
  try {
    const stats = await getStatistics(req.user.id);
    return successResponse(res, "User statistics fetched successfully", stats);
  } catch (err) {
    return next(err);
  }
};

// GET /users/me/activity
const getMyActivity = async (req, res, next) => {
  try {
    const query = req.validatedQuery || req.query || {};
    const activity = await getActivityHeatmap({
      user_id: req.user.id,
      start_date: query.start_date || null,
      end_date: query.end_date || null,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    });
    return successResponse(res, "Activity heatmap fetched successfully", activity);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getMyStatistics,
  getMyActivity,
};