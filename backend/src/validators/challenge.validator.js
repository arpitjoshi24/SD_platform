const { z } = require("zod");

const componentType = z.enum([
  "api",
  "database",
  "cache",
  "loadbalancer",
  "queue",
]);

// A connection can be written as ["api", "database"]
// or as { from, to, reason }.
const connectionRule = z.union([
  z.tuple([componentType, componentType]),
  z.object({
    from: componentType,
    to: componentType,
    reason: z.string().optional(),
  }),
]);

const componentRule = z.object({
  type: componentType,
  min: z.number().int().min(1).default(1),
  reason: z.string().optional(),
});

/**
 * Shape of challenges.evaluation_config (JSONB).
 * Every key is optional so a challenge without config still gets the generic rules.
 */
const evaluationConfigSchema = z
  .object({
    required_components: z.array(componentRule).default([]),
    recommended_components: z.array(componentRule).default([]),
    required_connections: z.array(connectionRule).default([]),
    recommended_connections: z.array(connectionRule).default([]),
    forbidden_connections: z.array(connectionRule).default([]),
    // used later by the simulation engine
    traffic: z
      .object({
        read_rps: z.number().nonnegative().optional(),
        write_rps: z.number().nonnegative().optional(),
      })
      .optional(),
  })
  .passthrough();

module.exports = {
  evaluationConfigSchema,
};
