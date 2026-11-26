const COMPONENT_TYPES = Object.freeze({
  API: "api",
  DATABASE: "database",
  CACHE: "cache",
  LOAD_BALANCER: "loadbalancer",
  QUEUE: "queue",
  WORKER: "worker",
  CLIENT: "client",
});

const COMPONENT_LABELS = Object.freeze({
  api: "API Server",
  database: "Database",
  cache: "Cache",
  loadbalancer: "Load Balancer",
  queue: "Message Queue",
  worker: "Background Worker",
  client: "Client",
});

const DEFAULT_COMPONENT_CAPACITIES = Object.freeze({
  api: { max_rps: 500, base_latency_ms: 25, queue_capacity: 200 },
  database: { max_rps: 400, base_latency_ms: 35, queue_capacity: 300 },
  cache: { max_rps: 5000, base_latency_ms: 3, queue_capacity: 1000 },
  loadbalancer: { max_rps: 10000, base_latency_ms: 5, queue_capacity: 2000 },
  queue: { max_rps: 3000, base_latency_ms: 8, queue_capacity: 5000 },
  worker: { max_rps: 600, base_latency_ms: 40, queue_capacity: 500 },
  client: { max_rps: 100000, base_latency_ms: 0, queue_capacity: 100000 },
});

const labelOf = (type) => COMPONENT_LABELS[type] || type;

const isKnownComponentType = (type) =>
  Object.prototype.hasOwnProperty.call(COMPONENT_TYPES, String(type || "").toUpperCase()) ||
  Object.prototype.hasOwnProperty.call(COMPONENT_LABELS, String(type || "").toLowerCase());

module.exports = {
  COMPONENT_TYPES,
  COMPONENT_LABELS,
  DEFAULT_COMPONENT_CAPACITIES,
  labelOf,
  isKnownComponentType,
};