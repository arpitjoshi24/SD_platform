const ACTIVITY_EVENT_TYPE = Object.freeze({
  ATTEMPT_SAVED: "attempt_saved",
});

const toAttemptSummary = (attempt) => {
  if (!attempt) return null;
  return {
    id: attempt.id,
    project_id: attempt.project_id,
    attempt_number: Number(attempt.attempt_number),
    score: attempt.score !== null && attempt.score !== undefined ? Number(attempt.score) : null,
    grade: attempt.grade ?? null,
    passed: attempt.passed ?? null,
    summary: attempt.summary ?? {},
    issues: attempt.issues ?? [],
    evaluation_engine_version: attempt.evaluation_engine_version ?? null,
    challenge_version_id: attempt.challenge_version_id ?? null,
    simulation_engine_version: attempt.simulation_engine_version ?? null,
    node_count: attempt.node_count ?? (Array.isArray(attempt.nodes_snapshot) ? attempt.nodes_snapshot.length : 0),
    edge_count: attempt.edge_count ?? (Array.isArray(attempt.edges_snapshot) ? attempt.edges_snapshot.length : 0),
    saved_at: attempt.saved_at,
  };
};

module.exports = {
  ACTIVITY_EVENT_TYPE,
  toAttemptSummary,
};