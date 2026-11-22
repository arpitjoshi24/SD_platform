const test = require("node:test");
const assert = require("node:assert/strict");

const { evaluateArchitecture } = require("../src/services/validation.service");

// ---- helpers -------------------------------------------------------
const node = (id, type) => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: { label: type, componentType: type },
});
const edge = (source, target) => ({ id: `${source}->${target}`, source, target });
const rules = (result) => result.issues.map((i) => i.ruleId);

const URL_SHORTENER = {
  required_components: [{ type: "api" }, { type: "database" }],
  recommended_components: [
    { type: "cache" },
    { type: "loadbalancer" },
    { type: "api", min: 2 },
  ],
  required_connections: [["api", "database"]],
  recommended_connections: [["loadbalancer", "api"], ["api", "cache"]],
  forbidden_connections: [{ from: "loadbalancer", to: "database" }],
};

// ---- tests ---------------------------------------------------------
test("empty canvas scores 0 and does not pass", () => {
  const r = evaluateArchitecture({ nodes: [], edges: [], config: URL_SHORTENER });

  assert.equal(r.score, 0);
  assert.equal(r.passed, false);
  assert.deepEqual(rules(r), ["EMPTY_DESIGN"]);
});

test("a complete, well designed URL shortener scores 100 (only an info note)", () => {
  const r = evaluateArchitecture({
    nodes: [
      node("lb", "loadbalancer"),
      node("a1", "api"),
      node("a2", "api"),
      node("c", "cache"),
      node("db", "database"),
    ],
    edges: [
      edge("lb", "a1"),
      edge("lb", "a2"),
      edge("a1", "c"),
      edge("a2", "c"),
      edge("a1", "db"),
      edge("a2", "db"),
    ],
    config: URL_SHORTENER,
  });

  assert.equal(r.passed, true);
  assert.equal(r.score, 100);
  assert.equal(r.grade, "A");
  assert.deepEqual(rules(r), ["SINGLE_DATABASE"]);
});

test("missing required database is an error", () => {
  const r = evaluateArchitecture({
    nodes: [node("a", "api")],
    edges: [],
    config: URL_SHORTENER,
  });

  assert.ok(rules(r).includes("REQUIRED_COMPONENT_MISSING"));
  assert.equal(r.passed, false);
});

test("reversed api/database arrow is flagged as reversed, not 'missing'", () => {
  const r = evaluateArchitecture({
    nodes: [node("a", "api"), node("db", "database")],
    edges: [edge("db", "a")],
    config: URL_SHORTENER,
  });

  const ids = rules(r);
  assert.ok(ids.includes("PASSIVE_COMPONENT_CALLING_OUT"));
  assert.ok(ids.includes("REQUIRED_CONNECTION_MISSING"));

  const missing = r.issues.find((i) => i.ruleId === "REQUIRED_CONNECTION_MISSING");
  assert.match(missing.title, /reversed/i);
});

test("missing component is reported once, not again as a missing connection", () => {
  const r = evaluateArchitecture({
    nodes: [node("a", "api")],
    edges: [],
    config: URL_SHORTENER,
  });

  assert.equal(
    rules(r).filter((id) => id === "REQUIRED_CONNECTION_MISSING").length,
    0
  );
});

test("forbidden load balancer -> database", () => {
  const r = evaluateArchitecture({
    nodes: [node("lb", "loadbalancer"), node("db", "database"), node("a", "api")],
    edges: [edge("lb", "db"), edge("a", "db")],
    config: URL_SHORTENER,
  });

  assert.ok(rules(r).includes("FORBIDDEN_CONNECTION"));
});

test("isolated node, self loop and duplicate edge", () => {
  const r = evaluateArchitecture({
    nodes: [node("a", "api"), node("db", "database"), node("c", "cache")],
    edges: [edge("a", "db"), { id: "dup", source: "a", target: "db" }, edge("a", "a")],
    config: {},
  });

  const ids = rules(r);
  assert.ok(ids.includes("ISOLATED_NODE"));
  assert.ok(ids.includes("SELF_LOOP"));
  assert.ok(ids.includes("DUPLICATE_EDGE"));
});

test("synchronous cycle is a warning", () => {
  const r = evaluateArchitecture({
    nodes: [node("a1", "api"), node("a2", "api")],
    edges: [edge("a1", "a2"), edge("a2", "a1")],
    config: {},
  });

  assert.ok(rules(r).includes("CYCLE"));
});

test("api -> queue -> api (worker) is NOT a cycle", () => {
  const r = evaluateArchitecture({
    nodes: [node("a", "api"), node("q", "queue"), node("db", "database")],
    edges: [edge("a", "q"), edge("q", "a"), edge("a", "db")],
    config: {},
  });

  assert.ok(!rules(r).includes("CYCLE"));
  assert.ok(!rules(r).includes("QUEUE_NO_CONSUMER"));
  assert.ok(!rules(r).includes("QUEUE_NO_PRODUCER"));
});

test("load balancer with one backend, cache nobody uses, queue without consumer", () => {
  const r = evaluateArchitecture({
    nodes: [
      node("lb", "loadbalancer"),
      node("a", "api"),
      node("c", "cache"),
      node("db", "database"),
      node("q", "queue"),
    ],
    edges: [edge("lb", "a"), edge("c", "db"), edge("a", "q"), edge("a", "db")],
    config: {},
  });

  const ids = rules(r);
  assert.ok(ids.includes("LB_SINGLE_BACKEND"));
  assert.ok(ids.includes("CACHE_UNUSED"));
  assert.ok(ids.includes("QUEUE_NO_CONSUMER"));
});

test("dangling edge (node deleted) does not crash the engine", () => {
  const r = evaluateArchitecture({
    nodes: [node("a", "api")],
    edges: [edge("a", "ghost")],
    config: {},
  });

  assert.ok(rules(r).includes("DANGLING_EDGE"));
});

test("malformed evaluation_config falls back to generic rules", () => {
  const originalError = console.error;
  console.error = () => {};

  const r = evaluateArchitecture({
    nodes: [node("a", "api")],
    edges: [],
    config: { required_components: "nonsense" },
  });

  console.error = originalError;

  assert.ok(Array.isArray(r.issues));
  assert.ok(!rules(r).includes("REQUIRED_COMPONENT_MISSING"));
});

test("score never goes below 0 and issues are sorted errors first", () => {
  const r = evaluateArchitecture({
    nodes: [node("a", "api"), node("c", "cache")],
    edges: [],
    config: URL_SHORTENER,
  });

  assert.ok(r.score >= 0 && r.score <= 100);
  assert.equal(r.issues[0].severity, "error");
});

test("recommendation wording: grammar and 'at least N'", () => {
  const r = evaluateArchitecture({
    nodes: [node("a", "api"), node("db", "database")],
    edges: [edge("a", "db")],
    config: URL_SHORTENER,
  });

  const titles = r.issues.map((i) => i.title);
  assert.ok(titles.includes("Consider adding a Cache"));
  assert.ok(titles.includes("Consider using at least 2 API Servers"));
  assert.ok(!titles.some((t) => /a API/.test(t)));
});
