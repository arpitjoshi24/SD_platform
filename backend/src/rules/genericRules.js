const { createIssue } = require("./issue");
const { SEVERITY, CATEGORY } = require("../types/ruleTypes");

const danglingEdge = (g, ctx = {}) =>
  (g.danglingEdges || []).map((edge) =>
    createIssue({
      ruleId: "DANGLING_EDGE",
      severity: ctx?.ruleConfig?.severity || SEVERITY.ERROR,
      category: CATEGORY.CONNECTION,
      title: "Dangling connection",
      message: `Connection '${edge.id}' references a missing source or target node.`,
      suggestion: "Reconnect or remove the broken edge.",
      edgeIds: edge.id ? [edge.id] : [],
      penalty: ctx?.ruleConfig?.penalty,
    })
  );

const selfLoop = (g, ctx = {}) =>
  (g.edges || [])
    .filter((e) => e.source === e.target)
    .map((edge) =>
      createIssue({
        ruleId: "SELF_LOOP",
        severity: ctx?.ruleConfig?.severity || SEVERITY.ERROR,
        category: CATEGORY.CONNECTION,
        title: "Self connection detected",
        message: `Component '${edge.source}' connects directly to itself.`,
        suggestion: "Remove the self-loop edge.",
        nodeIds: [edge.source],
        edgeIds: edge.id ? [edge.id] : [],
        penalty: ctx?.ruleConfig?.penalty,
      })
    );

const duplicateEdge = (g, ctx = {}) =>
  (g.duplicateEdges || []).map((edge) =>
    createIssue({
      ruleId: "DUPLICATE_EDGE",
      severity: ctx?.ruleConfig?.severity || SEVERITY.WARNING,
      category: CATEGORY.CONNECTION,
      title: "Duplicate connection",
      message: `Multiple connections exist from '${edge.source}' to '${edge.target}'.`,
      suggestion: "Consolidate duplicate connections if redundant.",
      nodeIds: [edge.source, edge.target],
      edgeIds: edge.id ? [edge.id] : [],
      penalty: ctx?.ruleConfig?.penalty,
    })
  );

const isolatedNode = (g, ctx = {}) => {
  if ((g.nodes || []).length <= 1) return [];
  return (g.nodes || [])
    .filter(
      (n) =>
        (g.outgoing.get(n.id)?.length || 0) === 0 &&
        (g.incoming.get(n.id)?.length || 0) === 0
    )
    .map((n) =>
      createIssue({
        ruleId: "ISOLATED_NODE",
        severity: ctx?.ruleConfig?.severity || SEVERITY.WARNING,
        category: CATEGORY.STRUCTURE,
        title: `Isolated component: ${n.label || n.id}`,
        message: `Component '${n.label || n.id}' has no incoming or outgoing connections.`,
        suggestion: "Connect this component into the request or data flow.",
        nodeIds: [n.id],
        penalty: ctx?.ruleConfig?.penalty,
      })
    );
};

const cycle = (g, ctx = {}) => {
  const found = g.findCycle();
  if (!found || found.length === 0) return [];
  return [
    createIssue({
      ruleId: "CYCLE",
      severity: ctx?.ruleConfig?.severity || SEVERITY.ERROR,
      category: CATEGORY.RELIABILITY,
      title: "Circular dependency detected",
      message: `Synchronous cycle detected: ${found.join(" → ")}.`,
      suggestion: "Break the cycle or decouple asynchronously via a message queue.",
      nodeIds: found,
      penalty: ctx?.ruleConfig?.penalty,
    }),
  ];
};

const passiveComponentCallingOut = (g, ctx = {}) => {
  const passiveTypes = new Set(["database", "cache"]);
  return (g.nodes || [])
    .filter(
      (n) =>
        passiveTypes.has(n.type) && (g.outgoing.get(n.id)?.length || 0) > 0
    )
    .map((n) =>
      createIssue({
        ruleId: "PASSIVE_COMPONENT_CALLING_OUT",
        severity: ctx?.ruleConfig?.severity || SEVERITY.ERROR,
        category: CATEGORY.CONNECTION,
        title: `Passive component initiating request: ${n.label || n.id}`,
        message: `${n.label || n.id} (${n.type}) should not initiate outgoing connections.`,
        suggestion: "Remove outgoing edges from this storage/cache component.",
        nodeIds: [n.id],
        edgeIds: (g.outgoing.get(n.id) || []).map((e) => e.id),
        penalty: ctx?.ruleConfig?.penalty,
      })
    );
};

const lbNoBackends = (g, ctx = {}) =>
  g
    .nodesOfType("loadbalancer")
    .filter((lb) => (g.outgoing.get(lb.id)?.length || 0) === 0)
    .map((lb) =>
      createIssue({
        ruleId: "LB_NO_BACKENDS",
        severity: ctx?.ruleConfig?.severity || SEVERITY.ERROR,
        category: CATEGORY.CONNECTION,
        title: "Load balancer has no targets",
        message: `Load balancer '${lb.label || lb.id}' does not forward traffic to any backend.`,
        suggestion: "Connect the load balancer to at least one API server.",
        nodeIds: [lb.id],
        penalty: ctx?.ruleConfig?.penalty,
      })
    );

const lbWrongTarget = (g, ctx = {}) =>
  g.nodesOfType("loadbalancer").flatMap((lb) =>
    (g.outgoing.get(lb.id) || [])
      .filter((e) => g.typeOf(e.target) === "database")
      .map((edge) =>
        createIssue({
          ruleId: "LB_WRONG_TARGET",
          severity: ctx?.ruleConfig?.severity || SEVERITY.ERROR,
          category: CATEGORY.CONNECTION,
          title: "Load balancer pointing directly to database",
          message: `Load balancer '${lb.label || lb.id}' routes traffic directly to a database.`,
          suggestion: "Route load balancer traffic to application/API servers instead.",
          nodeIds: [lb.id, edge.target],
          edgeIds: [edge.id],
          penalty: ctx?.ruleConfig?.penalty,
        })
      )
  );

const lbSingleBackend = (g, ctx = {}) =>
  g
    .nodesOfType("loadbalancer")
    .filter((lb) => (g.outgoing.get(lb.id)?.length || 0) === 1)
    .map((lb) =>
      createIssue({
        ruleId: "LB_SINGLE_BACKEND",
        severity: ctx?.ruleConfig?.severity || SEVERITY.WARNING,
        category: CATEGORY.RELIABILITY,
        title: "Single backend behind load balancer",
        message: `Load balancer '${lb.label || lb.id}' points to only one backend instance.`,
        suggestion: "Add redundant backend instances to avoid a single point of failure.",
        nodeIds: [lb.id],
        penalty: ctx?.ruleConfig?.penalty ?? 5,
      })
    );

const cacheUnused = (g, ctx = {}) =>
  g
    .nodesOfType("cache")
    .filter(
      (c) =>
        (g.incoming.get(c.id)?.length || 0) === 0 &&
        (g.outgoing.get(c.id)?.length || 0) === 0
    )
    .map((c) =>
      createIssue({
        ruleId: "CACHE_UNUSED",
        severity: ctx?.ruleConfig?.severity || SEVERITY.WARNING,
        category: CATEGORY.PERFORMANCE,
        title: `Unused cache: ${c.label || c.id}`,
        message: `Cache '${c.label || c.id}' is not connected to any components.`,
        suggestion: "Connect the cache between API servers and backing data stores.",
        nodeIds: [c.id],
        penalty: ctx?.ruleConfig?.penalty ?? 5,
      })
    );

const queueNoProducer = (g, ctx = {}) =>
  g
    .nodesOfType("queue")
    .filter((q) => (g.incoming.get(q.id)?.length || 0) === 0)
    .map((q) =>
      createIssue({
        ruleId: "QUEUE_NO_PRODUCER",
        severity: ctx?.ruleConfig?.severity || SEVERITY.WARNING,
        category: CATEGORY.CONNECTION,
        title: `Queue has no producer: ${q.label || q.id}`,
        message: `Queue '${q.label || q.id}' has no incoming producer connections.`,
        suggestion: "Connect an API server or producer to push messages into the queue.",
        nodeIds: [q.id],
        penalty: ctx?.ruleConfig?.penalty ?? 5,
      })
    );

const queueNoConsumer = (g, ctx = {}) =>
  g
    .nodesOfType("queue")
    .filter((q) => (g.outgoing.get(q.id)?.length || 0) === 0)
    .map((q) =>
      createIssue({
        ruleId: "QUEUE_NO_CONSUMER",
        severity: ctx?.ruleConfig?.severity || SEVERITY.WARNING,
        category: CATEGORY.CONNECTION,
        title: `Queue has no consumer: ${q.label || q.id}`,
        message: `Queue '${q.label || q.id}' has no outgoing consumer connections.`,
        suggestion: "Connect a consumer or worker to process messages from the queue.",
        nodeIds: [q.id],
        penalty: ctx?.ruleConfig?.penalty ?? 5,
      })
    );

const dbNotBehindApi = (g, ctx = {}) =>
  g.nodesOfType("database").flatMap((db) => {
    const incomingEdges = g.incoming.get(db.id) || [];
    const badEdges = incomingEdges.filter(
      (e) => g.typeOf(e.source) !== "api" && g.typeOf(e.source) !== "worker"
    );
    return badEdges.map((edge) =>
      createIssue({
        ruleId: "DB_NOT_BEHIND_API",
        severity: ctx?.ruleConfig?.severity || SEVERITY.ERROR,
        category: CATEGORY.CONNECTION,
        title: "Database accessed directly outside API/worker layer",
        message: `Database '${db.label || db.id}' receives traffic from '${edge.source}'.`,
        suggestion: "Route database access through an API server or worker.",
        nodeIds: [edge.source, db.id],
        edgeIds: edge.id ? [edge.id] : [],
        penalty: ctx?.ruleConfig?.penalty,
      })
    );
  });

const singleDatabase = (g, ctx = {}) => {
  const dbs = g.nodesOfType("database");
  if (dbs.length !== 1) return [];
  return [
    createIssue({
      ruleId: "SINGLE_DATABASE",
      severity: ctx?.ruleConfig?.severity || SEVERITY.WARNING,
      category: CATEGORY.RELIABILITY,
      title: "Single database instance",
      message: "Only one database instance is present; replication/failover is not modeled.",
      suggestion: "Consider read replicas or redundancy for higher availability.",
      nodeIds: [dbs[0].id],
      penalty: ctx?.ruleConfig?.penalty ?? 5,
    }),
  ];
};

const genericRuleHandlers = Object.freeze({
  DANGLING_EDGE: danglingEdge,
  SELF_LOOP: selfLoop,
  DUPLICATE_EDGE: duplicateEdge,
  ISOLATED_NODE: isolatedNode,
  CYCLE: cycle,
  PASSIVE_COMPONENT_CALLING_OUT: passiveComponentCallingOut,
  LB_NO_BACKENDS: lbNoBackends,
  LB_WRONG_TARGET: lbWrongTarget,
  LB_SINGLE_BACKEND: lbSingleBackend,
  CACHE_UNUSED: cacheUnused,
  QUEUE_NO_PRODUCER: queueNoProducer,
  QUEUE_NO_CONSUMER: queueNoConsumer,
  DB_NOT_BEHIND_API: dbNotBehindApi,
  SINGLE_DATABASE: singleDatabase,
});

const genericRulesList = Object.values(genericRuleHandlers);

module.exports = Object.assign(genericRulesList, {
  genericRuleHandlers,
  danglingEdge,
  selfLoop,
  duplicateEdge,
  isolatedNode,
  cycle,
  passiveComponentCallingOut,
  lbNoBackends,
  lbWrongTarget,
  lbSingleBackend,
  cacheUnused,
  queueNoProducer,
  queueNoConsumer,
  dbNotBehindApi,
  singleDatabase,
});