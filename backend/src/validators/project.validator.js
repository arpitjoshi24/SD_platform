const { z } = require("zod");

const MAX_NODES = 200;
const MAX_EDGES = 400;

// Light structural validation of React Flow nodes/edges.
// passthrough() keeps extra React Flow fields (style, markerEnd, ...).
const nodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    data: z.record(z.string(), z.any()).optional(),
  })
  .passthrough();

const edgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
  })
  .passthrough();

const createProjectSchema = z.object({
  challenge_id: z.uuid("Invalid challenge ID"),

  title: z
    .string()
    .min(3, "Project title must be at least 3 characters")
    .max(255, "Project title is too long"),
});

const updateProjectSchema = z.object({
  title: z
    .string()
    .min(3, "Project title must be at least 3 characters")
    .max(255, "Project title is too long")
    .optional(),

  nodes: z
    .array(nodeSchema)
    .max(MAX_NODES, `A design can have at most ${MAX_NODES} components`)
    .optional(),

  edges: z
    .array(edgeSchema)
    .max(MAX_EDGES, `A design can have at most ${MAX_EDGES} connections`)
    .optional(),

  status: z.enum(["draft", "submitted", "completed"]).optional(),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
};
