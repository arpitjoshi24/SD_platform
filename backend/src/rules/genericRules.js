/**
 * Generic rules: apply to EVERY design, whatever the challenge is.
 * Each rule: (graph) => Issue[]
 */
const { createIssue } = require("./issue");
const { SEVERITY, CATEGORY } = require("../types/ruleTypes");
const { labelOf } = require("../types/componentTypes");

const name = (node) => `${node.label} (${node.id.split("-")[0]})`;

// --- Data integrity -------------------------------------------------

const danglingEdges = (g) =>
  g.danglingEdges.map((edge) =>
    createIssue({
      ruleId: "DANGLING_EDGE",
      severity: SEVERITY.ERROR,
      category: CATEGORY.CONNECTION,
      title: "Broken connection",
      message: "A connection points to a component that no longer exists.",
      suggestion: "Delete the broken connection and reconnect the components.",
      edgeIds: [edge.id],
    })
  );

const selfLoops = (g) =>
  g.edges
    .filter((e) => e.source === e.target)
    .map((edge) =>
      createIssue({
        ruleId: "SELF_LOOP",
        severity: SEVERITY.ERROR,
        category: CATEGORY.CONNECTION,
        title: "Component connected to itself",
        message: `${name(g.nodeById.get(edge.source))} has a connection to itself.`,
        suggestion: "Remove the loop. Scale a service by adding more instances instead.",
        nodeIds: [edge.source],
        edgeIds: [edge.id],
      })
    );

const duplicateEdges = (g) => {
  const seen = new Map();
  const issues = [];

  for (const edge of g.edges) {
    const key = `${edge.source}->${edge.target}`;

    if (seen.has(key)) {
      issues.push(
        createIssue({
          ruleId: "DUPLICATE_EDGE",
          severity: SEVERITY.WARNING,
          category: CATEGORY.CONNECTION,
          title: "Duplicate connection",
          message: `${name(g.nodeById.get(edge.source))} is connected to ${name(
            g.nodeById.get(edge.target)
          )} more than once.`,
          suggestion: "Keep a single connection between the same two components.",
          nodeIds: [edge.source, edge.target],
          edgeIds: [seen.get(key), edge.id],
          penalty: 2,
        })
      );
    } else {
      seen.set(key, edge.id);
    }
  }

  return issues;
};

// --- Structure ------------------------------------------------------

const isolatedNodes = (g) =>
  g.nodes
    .filter(
      (n) => g.incoming.get(n.id).length === 0 && g.outgoing.get(n.id).length === 0
    )
    .map((node) =>
      createIssue({
        ruleId: "ISOLATED_NODE",
        severity: SEVERITY.WARNING,
        category: CATEGORY.STRUCTURE,
        title: "Unconnected component",
        message: `${name(node)} is not connected to anything.`,
        suggestion: "Connect it to the rest of the architecture or remove it.",
        nodeIds: [node.id],
      })
    );

const cycles = (g) => {
  const cycle = g.findCycle();

  if (!cycle) return [];

  const path = cycle.map((id) => g.nodeById.get(id).label).join(" → ");

  return [
    createIssue({
      ruleId: "CYCLE",
      severity: SEVERITY.WARNING,
      category: CATEGORY.STRUCTURE,
      title: "Circular dependency",
      message: `Requests can loop forever: ${path} → ${g.nodeById.get(cycle[0]).label}.`,
      suggestion:
        "Break the loop. If the work is meant to be handed off, put a queue in between.",
      nodeIds: cycle,
      penalty: 8,
    }),
  ];
};

// --- Direction ------------------------------------------------------

const passiveComponentsCallingOut = (g) => {
  const issues = [];

  for (const edge of g.edges) {
    const type = g.typeOf(edge.source);

    if (type !== "database" && type !== "cache") continue;
    if (edge.source === edge.target) continue;

    const source = g.nodeById.get(edge.source);
    const target = g.nodeById.get(edge.target);

    issues.push(
      createIssue({
        ruleId: "PASSIVE_COMPONENT_CALLING_OUT",
        severity: type === "database" ? SEVERITY.ERROR : SEVERITY.WARNING,
        category: CATEGORY.CONNECTION,
        title: `${labelOf(type)} should not start requests`,
        message: `${name(source)} → ${name(target)}: a ${labelOf(
          type
        ).toLowerCase()} only responds to requests, it does not send them.`,
        suggestion: "Reverse the arrow so the requesting service points at it.",
        nodeIds: [source.id, target.id],
        edgeIds: [edge.id],
        penalty: type === "database" ? 10 : 5,
      })
    );
  }

  return issues;
};

// --- Per-component sanity ------------------------------------------

const loadBalancerRules = (g) => {
  const issues = [];

  for (const lb of g.nodesOfType("loadbalancer")) {
    const out = g.outgoing.get(lb.id);
    const inc = g.incoming.get(lb.id);

    if (out.length === 0 && inc.length > 0) {
      issues.push(
        createIssue({
          ruleId: "LB_NO_BACKENDS",
          severity: SEVERITY.ERROR,
          category: CATEGORY.CONNECTION,
          title: "Load balancer has nowhere to send traffic",
          message: `${name(lb)} receives requests but has no backend servers.`,
          suggestion: "Connect it to your API servers.",
          nodeIds: [lb.id],
          penalty: 10,
        })
      );
      continue;
    }

    if (out.length === 0) continue; // isolated -> reported by ISOLATED_NODE

    const wrong = out.filter((e) => g.typeOf(e.target) !== "api" && g.typeOf(e.target) !== "loadbalancer");

    for (const edge of wrong) {
      const target = g.nodeById.get(edge.target);

      issues.push(
        createIssue({
          ruleId: "LB_WRONG_TARGET",
          severity: SEVERITY.WARNING,
          category: CATEGORY.CONNECTION,
          title: "Load balancer pointing at the wrong layer",
          message: `${name(lb)} sends traffic straight to ${name(target)}. Load balancers distribute requests across application servers.`,
          suggestion: "Route through an API server instead.",
          nodeIds: [lb.id, target.id],
          edgeIds: [edge.id],
        })
      );
    }

    const apiTargets = out.filter((e) => g.typeOf(e.target) === "api");

    if (apiTargets.length === 1 && wrong.length === 0) {
      issues.push(
        createIssue({
          ruleId: "LB_SINGLE_BACKEND",
          severity: SEVERITY.WARNING,
          category: CATEGORY.RELIABILITY,
          title: "Load balancer with a single backend",
          message: `${name(lb)} only balances across one API server, so it adds no redundancy.`,
          suggestion: "Add at least one more API server behind the load balancer.",
          nodeIds: [lb.id],
          penalty: 4,
        })
      );
    }
  }

  return issues;
};

const cacheRules = (g) =>
  g
    .nodesOfType("cache")
    .filter((c) => {
      const hasEdges =
        g.incoming.get(c.id).length > 0 || g.outgoing.get(c.id).length > 0;
      const usedByApi = g.incoming
        .get(c.id)
        .some((e) => g.typeOf(e.source) === "api");

      return hasEdges && !usedByApi;
    })
    .map((cache) =>
      createIssue({
        ruleId: "CACHE_UNUSED",
        severity: SEVERITY.WARNING,
        category: CATEGORY.PERFORMANCE,
        title: "Cache is not used by any service",
        message: `No API server reads from ${name(cache)}, so it will never be hit.`,
        suggestion: "Connect an API server to the cache (API → Cache).",
        nodeIds: [cache.id],
      })
    );

const queueRules = (g) => {
  const issues = [];

  for (const queue of g.nodesOfType("queue")) {
    const inc = g.incoming.get(queue.id);
    const out = g.outgoing.get(queue.id);

    if (inc.length === 0 && out.length === 0) continue; // isolated

    if (inc.length === 0) {
      issues.push(
        createIssue({
          ruleId: "QUEUE_NO_PRODUCER",
          severity: SEVERITY.WARNING,
          category: CATEGORY.STRUCTURE,
          title: "Queue has no producer",
          message: `Nothing publishes messages to ${name(queue)}.`,
          suggestion: "Connect the service that creates the work to the queue.",
          nodeIds: [queue.id],
        })
      );
    }

    if (out.length === 0) {
      issues.push(
        createIssue({
          ruleId: "QUEUE_NO_CONSUMER",
          severity: SEVERITY.WARNING,
          category: CATEGORY.STRUCTURE,
          title: "Queue has no consumer",
          message: `Messages in ${name(queue)} will pile up because no worker processes them.`,
          suggestion: "Connect the queue to the service (worker) that processes the messages.",
          nodeIds: [queue.id],
        })
      );
    }
  }

  return issues;
};

const databaseRules = (g) => {
  const issues = [];
  const databases = g.nodesOfType("database");

  for (const db of databases) {
    const inc = g.incoming.get(db.id);

    if (inc.length === 0) continue;

    if (!inc.some((e) => g.typeOf(e.source) === "api")) {
      issues.push(
        createIssue({
          ruleId: "DB_NOT_BEHIND_API",
          severity: SEVERITY.WARNING,
          category: CATEGORY.STRUCTURE,
          title: "Database is not accessed through an API server",
          message: `${name(db)} is reached without an API server in front of it.`,
          suggestion: "Let an API server own the database access (API → Database).",
          nodeIds: [db.id],
        })
      );
    }
  }

  if (databases.length === 1) {
    issues.push(
      createIssue({
        ruleId: "SINGLE_DATABASE",
        severity: SEVERITY.INFO,
        category: CATEGORY.RELIABILITY,
        title: "Single database instance",
        message:
          "One database is a single point of failure. In production you would add a replica or a standby.",
        suggestion: "Not required here, but worth mentioning in an interview.",
        nodeIds: [databases[0].id],
      })
    );
  }

  return issues;
};

module.exports = [
  danglingEdges,
  selfLoops,
  duplicateEdges,
  isolatedNodes,
  cycles,
  passiveComponentsCallingOut,
  loadBalancerRules,
  cacheRules,
  queueRules,
  databaseRules,
];
