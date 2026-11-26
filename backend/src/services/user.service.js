const AppError = require("../utils/AppError");
const { DEFAULT_TIMEZONE } = require("../utils/constants");
const { isValidTimeZone, formatDateInTimeZone } = require("../utils/helpers");
const { toSafeUser } = require("../types/userTypes");
const {
  getUserProfileById,
  updateUserProfileById,
  getUserStatisticsById,
  getActivityHeatmapByUserId,
  getActivityEventsByUserId,
} = require("../repositories/user.repository");

const getProfile = async (user_id) => {
  const user = await getUserProfileById(user_id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return toSafeUser(user);
};

const updateProfile = async ({ user_id, full_name, timezone }) => {
  if (timezone !== undefined && !isValidTimeZone(timezone)) {
    throw new AppError("Invalid IANA timezone identifier", 400);
  }

  const updated = await updateUserProfileById({
    user_id,
    full_name: full_name !== undefined ? String(full_name).trim() : undefined,
    timezone: timezone !== undefined ? String(timezone).trim() : undefined,
  });

  if (!updated) {
    throw new AppError("User not found", 404);
  }
  return toSafeUser(updated);
};

const getStatistics = async (user_id) => {
  await getProfile(user_id);
  return getUserStatisticsById(user_id);
};

const getActivityHeatmap = async ({
  user_id,
  start_date = null,
  end_date = null,
  limit = 50,
  offset = 0,
}) => {
  const profile = await getProfile(user_id);
  const tz = profile.timezone || DEFAULT_TIMEZONE;

  const effectiveEnd =
    end_date || formatDateInTimeZone(new Date(), tz);
  const defaultStartObj = new Date(Date.now() - 364 * 24 * 60 * 60 * 1000);
  const effectiveStart =
    start_date || formatDateInTimeZone(defaultStartObj, tz);

  if (effectiveStart > effectiveEnd) {
    throw new AppError("start_date cannot be after end_date", 400);
  }

  const rows = await getActivityHeatmapByUserId({
    user_id,
    start_date: effectiveStart,
    end_date: effectiveEnd,
  });

  const countByDate = new Map(rows.map((r) => [r.date, Number(r.count) || 0]));
  const calendar = [];

  const cursor = new Date(`${effectiveStart}T12:00:00Z`);
  const endObj = new Date(`${effectiveEnd}T12:00:00Z`);

  while (cursor <= endObj) {
    const dateStr = cursor.toISOString().slice(0, 10);
    calendar.push({
      date: dateStr,
      count: countByDate.get(dateStr) || 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const events = await getActivityEventsByUserId({
    user_id,
    limit,
    offset,
  });

  return {
    timezone: tz,
    start_date: effectiveStart,
    end_date: effectiveEnd,
    total_saved_attempts: calendar.reduce((sum, item) => sum + item.count, 0),
    heatmap: calendar,
    recent_events: events,
  };
};

module.exports = {
  getProfile,
  updateProfile,
  getStatistics,
  getActivityHeatmap,
};