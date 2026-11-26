const AppError = require("../utils/AppError");

/**
 * Validates req.body, req.params, and/or req.query using Zod schemas.
 * Backward-compatible:
 *   - validate(zodSchema) validates req.body
 *   - validate({ body, params, query }) validates any combination
 */
const validate = (schemasOrBodySchema) => (req, res, next) => {
  const isTargetMap =
    schemasOrBodySchema &&
    typeof schemasOrBodySchema === "object" &&
    typeof schemasOrBodySchema.safeParse !== "function" &&
    ("body" in schemasOrBodySchema ||
      "params" in schemasOrBodySchema ||
      "query" in schemasOrBodySchema);

  const targets = isTargetMap
    ? schemasOrBodySchema
    : { body: schemasOrBodySchema };

  const collectedIssues = [];

  for (const source of ["params", "query", "body"]) {
    const schema = targets[source];
    if (!schema) continue;

    const input = source === "body" ? (req.body ?? {}) : (req[source] ?? {});
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      for (const issue of parsed.error.issues || []) {
        collectedIssues.push({
          location: source,
          field: issue.path.length > 0 ? `${source}.${issue.path.join(".")}` : source,
          message: issue.message,
        });
      }
    } else if (source === "body") {
      req.body = parsed.data;
    } else {
      req[`validated${source[0].toUpperCase()}${source.slice(1)}`] = parsed.data;
    }
  }

  if (collectedIssues.length > 0) {
    const err = new AppError(
      collectedIssues[0].message || "Validation failed",
      400,
      collectedIssues
    );
    return next(err);
  }

  return next();
};

module.exports = validate;