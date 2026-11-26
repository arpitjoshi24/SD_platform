const { z } = require("zod");

const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

const updateProfileSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(120, "Full name is too long")
      .optional(),
    timezone: z.string().trim().min(1).max(100).optional(),
  })
  .refine(
    (data) => data.full_name !== undefined || data.timezone !== undefined,
    {
      message: "At least one profile field (full_name or timezone) is required",
    }
  );

const activityHeatmapQuerySchema = z.object({
  start_date: z
    .string()
    .regex(DATE_YYYY_MM_DD, "start_date must be YYYY-MM-DD")
    .optional(),
  end_date: z
    .string()
    .regex(DATE_YYYY_MM_DD, "end_date must be YYYY-MM-DD")
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

module.exports = {
  updateProfileSchema,
  activityHeatmapQuerySchema,
};