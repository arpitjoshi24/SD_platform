const crypto = require("crypto");

const SENSITIVE_KEYS = new Set([
  "password",
  "password_hash",
  "token",
  "access_token",
  "accessToken",
  "authorization",
  "cookie",
  "secret",
  "api_key",
  "apiKey",
]);

const redactValue = (val) => {
  if (val === null || val === undefined) return val;
  if (typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(redactValue);

  const out = {};
  for (const [k, v] of Object.entries(val)) {
    out[k] = SENSITIVE_KEYS.has(k) ? "[REDACTED]" : redactValue(v);
  }
  return out;
};

const requestContextAndLogger = (req, res, next) => {
  const incomingId = req.headers["x-request-id"];
  const requestId =
    typeof incomingId === "string" && incomingId.trim().length > 0 && incomingId.trim().length <= 128
      ? incomingId.trim()
      : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const startNs = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startNs) / 1e6;
    const entry = {
      requestId,
      method: req.method,
      route: req.originalUrl || req.url,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      userId: req.user?.id || null,
      userRole: req.user?.role || null,
      query: Object.keys(req.query || {}).length > 0 ? redactValue(req.query) : undefined,
    };

    if (res.statusCode >= 500) {
      console.error("HTTP_REQUEST", entry);
    } else if (res.statusCode >= 400) {
      console.warn("HTTP_REQUEST", entry);
    } else {
      console.info("HTTP_REQUEST", entry);
    }
  });

  return next();
};

module.exports = requestContextAndLogger;