-- ArchMentor AI rule catalogue seed data.
-- Actual executable functions remain in backend/src/rules/.
-- Never store executable JavaScript in this table.

INSERT INTO rules
(
    rule_key,
    name,
    description,
    rule_type,
    category,
    severity,
    applicability,
    is_mandatory,
    is_active,
    is_practice_available,
    current_version_number
)
VALUES
(
    'DANGLING_EDGE',
    'Dangling connection',
    'Rejects connections whose source or target component is missing.',
    'generic',
    'data_integrity',
    'error',
    '{"scope":"all"}'::jsonb,
    TRUE, TRUE, FALSE, 1
),
(
    'SELF_LOOP',
    'Self connection',
    'Detects a component connected to itself.',
    'generic',
    'data_integrity',
    'error',
    '{"scope":"all"}'::jsonb,
    TRUE, TRUE, FALSE, 1
),
(
    'DUPLICATE_EDGE',
    'Duplicate connection',
    'Detects repeated directed connections between the same components.',
    'generic',
    'connection',
    'warning',
    '{"scope":"all"}'::jsonb,
    FALSE, TRUE, TRUE, 1
),
(
    'ISOLATED_NODE',
    'Isolated component',
    'Detects components with no incoming or outgoing connections.',
    'generic',
    'structure',
    'warning',
    '{"scope":"all"}'::jsonb,
    FALSE, TRUE, TRUE, 1
),
(
    'CYCLE',
    'Circular dependency',
    'Detects directed cycles in the architecture graph.',
    'generic',
    'structure',
    'warning',
    '{"scope":"all"}'::jsonb,
    FALSE, TRUE, TRUE, 1
),
(
    'PASSIVE_COMPONENT_CALLING_OUT',
    'Passive component initiates request',
    'Detects databases or caches that initiate outbound requests.',
    'generic',
    'connection',
    'error',
    '{"scope":"all"}'::jsonb,
    FALSE, TRUE, TRUE, 1
),
(
    'LB_NO_BACKENDS',
    'Load balancer without backends',
    'Detects load balancers receiving traffic without a backend.',
    'generic',
    'connection',
    'error',
    '{"scope":"all"}'::jsonb,
    FALSE, TRUE, TRUE, 1
),
(
    'LB_WRONG_TARGET',
    'Load balancer wrong target',
    'Detects load balancers routing directly to an inappropriate component layer.',
    'generic',
    'connection',
    'warning',
    '{"scope":"all"}'::jsonb,
    FALSE, TRUE, TRUE, 1
),
(
    'LB_SINGLE_BACKEND',
    'Load balancer single backend',
    'Warns when a load balancer has only one API backend.',
    'generic',
    'reliability',
    'warning',
    '{"scope":"all"}'::jsonb,
    FALSE, TRUE, TRUE, 1
),
(
    'CACHE_UNUSED',
    'Unused cache',
    'Detects caches that are not used by an API component.',
    'generic',
    'performance',
    'warning',
    '{"scope":"all"}'::jsonb,
    FALSE, TRUE, TRUE, 1
),
(
    'QUEUE_NO_PRODUCER',
    'Queue without producer',
    'Detects queues with no incoming producer connection.',
    'generic',
    'structure',
    'warning',
    '{"scope":"all"}'::jsonb,
    FALSE, TRUE, TRUE, 1
),
(
    'QUEUE_NO_CONSUMER',
    'Queue without consumer',
    'Detects queues with no outgoing consumer connection.',
    'generic',
    'structure',
    'warning',
    '{"scope":"all"}'::jsonb,
    FALSE, TRUE, TRUE, 1
),
(
    'DB_NOT_BEHIND_API',
    'Database not behind API',
    'Warns when a database is not accessed through an API component.',
    'generic',
    'structure',
    'warning',
    '{"scope":"all"}'::jsonb,
    FALSE, TRUE, TRUE, 1
),
(
    'SINGLE_DATABASE',
    'Single database instance',
    'Highlights a database single point of failure.',
    'generic',
    'reliability',
    'info',
    '{"scope":"all"}'::jsonb,
    FALSE, TRUE, TRUE, 1
),
(
    'REQUIRED_COMPONENT_MISSING',
    'Required component missing',
    'Checks minimum required component counts from challenge configuration.',
    'challenge_specific',
    'requirement',
    'error',
    '{"scope":"guided_challenges"}'::jsonb,
    FALSE, TRUE, FALSE, 1
),
(
    'RECOMMENDED_COMPONENT_MISSING',
    'Recommended component missing',
    'Checks recommended component counts from challenge configuration.',
    'challenge_specific',
    'performance',
    'warning',
    '{"scope":"guided_challenges"}'::jsonb,
    FALSE, TRUE, FALSE, 1
),
(
    'REQUIRED_CONNECTION_MISSING',
    'Required connection missing',
    'Checks required directed component-type connections from challenge configuration.',
    'challenge_specific',
    'requirement',
    'error',
    '{"scope":"guided_challenges"}'::jsonb,
    FALSE, TRUE, FALSE, 1
),
(
    'RECOMMENDED_CONNECTION_MISSING',
    'Recommended connection missing',
    'Checks recommended directed component-type connections from challenge configuration.',
    'challenge_specific',
    'performance',
    'warning',
    '{"scope":"guided_challenges"}'::jsonb,
    FALSE, TRUE, FALSE, 1
),
(
    'FORBIDDEN_CONNECTION',
    'Forbidden connection present',
    'Detects directed component-type connections forbidden by challenge configuration.',
    'challenge_specific',
    'connection',
    'error',
    '{"scope":"guided_challenges"}'::jsonb,
    FALSE, TRUE, FALSE, 1
)
ON CONFLICT (rule_key) DO NOTHING;

INSERT INTO rule_versions
(
    rule_id,
    version_number,
    config,
    metadata_snapshot
)
SELECT
    id,
    1,
    '{}'::jsonb,
    jsonb_build_object(
        'rule_key', rule_key,
        'name', name,
        'description', description,
        'rule_type', rule_type,
        'category', category,
        'severity', severity
    )
FROM rules
WHERE rule_key IN (
    'DANGLING_EDGE',
    'SELF_LOOP',
    'DUPLICATE_EDGE',
    'ISOLATED_NODE',
    'CYCLE',
    'PASSIVE_COMPONENT_CALLING_OUT',
    'LB_NO_BACKENDS',
    'LB_WRONG_TARGET',
    'LB_SINGLE_BACKEND',
    'CACHE_UNUSED',
    'QUEUE_NO_PRODUCER',
    'QUEUE_NO_CONSUMER',
    'DB_NOT_BEHIND_API',
    'SINGLE_DATABASE',
    'REQUIRED_COMPONENT_MISSING',
    'RECOMMENDED_COMPONENT_MISSING',
    'REQUIRED_CONNECTION_MISSING',
    'RECOMMENDED_CONNECTION_MISSING',
    'FORBIDDEN_CONNECTION'
)
ON CONFLICT (rule_id, version_number) DO NOTHING;