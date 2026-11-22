// Must match frontend/data/architectureComponents.ts
const COMPONENT_TYPES = Object.freeze({
  API: "api",
  DATABASE: "database",
  CACHE: "cache",
  LOAD_BALANCER: "loadbalancer",
  QUEUE: "queue",
});

const COMPONENT_LABELS = Object.freeze({
  api: "API Server",
  database: "Database",
  cache: "Cache",
  loadbalancer: "Load Balancer",
  queue: "Message Queue",
});

const labelOf = (type) => COMPONENT_LABELS[type] || type;

module.exports = { COMPONENT_TYPES, COMPONENT_LABELS, labelOf };
