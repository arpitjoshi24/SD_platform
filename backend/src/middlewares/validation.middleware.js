/**
 * Request body validation.
 * Usage: router.post("/", validate(schema), controller)
 * On success req.body is replaced with the parsed (cleaned) data.
 * On failure the zod error is passed to the global error handler (-> 400).
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});

  if (!result.success) {
    return next(result.error);
  }

  req.body = result.data;
  next();
};

module.exports = validate;
