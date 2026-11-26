const { z } = require("zod");

const registerSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(3, "Full name must be at least 3 characters")
      .max(120, "Full name must be at most 120 characters"),

    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .max(255, "Email address is too long")
      .transform((v) => v.toLowerCase()),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be at most 100 characters"),

    timezone: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .transform((v) => v.toLowerCase()),

    password: z
      .string()
      .min(1, "Password is required")
      .max(100, "Password is too long"),
  })
  .strict();

module.exports = {
  registerSchema,
  loginSchema,
};