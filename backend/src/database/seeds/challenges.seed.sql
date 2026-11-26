-- ArchMentor AI initial guided challenges.
-- Run after schema/migrations and rules.seed.sql.

INSERT INTO challenges
(
    title,
    slug,
    description,
    difficulty,
    category,
    estimated_minutes,
    requirements,
    hints,
    is_published,
    is_archived,
    current_version_number
)
VALUES
(
    'Design URL Shortener',
    'design-url-shortener',
    'Design a scalable URL shortening service similar to Bitly.',
    'Medium',
    'Distributed Systems',
    45,
    '[
        "Support 10 million URLs",
        "Low latency",
        "High availability",
        "Read-heavy workload"
    ]'::jsonb,
    '[
        "Think about caching",
        "Think about database indexing",
        "Think about load balancing"
    ]'::jsonb,
    TRUE,
    FALSE,
    1
),
(
    'Design a Notification Service',
    'design-notification-service',
    'Design a service that sends email and push notifications to millions of users without blocking the application.',
    'Medium',
    'Messaging',
    40,
    '[
        "Deliver millions of notifications per day",
        "Never block the caller",
        "Retry failed deliveries",
        "Store delivery status"
    ]'::jsonb,
    '[
        "Decouple producers from senders",
        "Think about asynchronous processing",
        "Where do you store delivery history?"
    ]'::jsonb,
    TRUE,
    FALSE,
    1
),
(
    'Design a Rate Limiter',
    'design-rate-limiter',
    'Design a distributed rate limiter that protects an API from abuse while adding minimal latency.',
    'Hard',
    'Infrastructure',
    50,
    '[
        "Limit requests per user per minute",
        "Add under 5 ms of latency",
        "Work across many API servers",
        "Survive server restarts"
    ]'::jsonb,
    '[
        "Counters must be shared between servers",
        "Which storage is fast enough for every request?"
    ]'::jsonb,
    TRUE,
    FALSE,
    1
)
ON CONFLICT (slug) DO NOTHING;

WITH configs(slug, evaluation_config) AS (
    VALUES
    (
        'design-url-shortener',
        '{
            "required_components": [
                {
                    "type": "api",
                    "min": 1
                },
                {
                    "type": "database",
                    "min": 1,
                    "reason": "Short-code to URL mappings must be stored durably."
                }
            ],
            "recommended_components": [
                {
                    "type": "cache",
                    "min": 1,
                    "reason": "Redirects are read-heavy. Caching hot short codes keeps latency low."
                },
                {
                    "type": "loadbalancer",
                    "min": 1,
                    "reason": "High availability needs traffic spread across several API servers."
                },
                {
                    "type": "api",
                    "min": 2,
                    "reason": "A single API server is a single point of failure."
                }
            ],
            "required_connections": [
                ["api", "database"]
            ],
            "recommended_connections": [
                ["loadbalancer", "api"],
                ["api", "cache"]
            ],
            "forbidden_connections": [
                {
                    "from": "loadbalancer",
                    "to": "database",
                    "reason": "Clients and load balancers should never talk to the database directly."
                }
            ],
            "traffic": {
                "read_rps": 10000,
                "write_rps": 100
            }
        }'::jsonb
    ),
    (
        'design-notification-service',
        '{
            "required_components": [
                {
                    "type": "api",
                    "min": 1
                },
                {
                    "type": "queue",
                    "min": 1,
                    "reason": "Sending must be asynchronous. A queue decouples the request from delivery."
                },
                {
                    "type": "database",
                    "min": 1,
                    "reason": "Delivery status and history must be persisted."
                }
            ],
            "recommended_components": [
                {
                    "type": "api",
                    "min": 2,
                    "reason": "Separate API servers for producers and workers lets them scale independently."
                },
                {
                    "type": "loadbalancer",
                    "min": 1,
                    "reason": "Spread incoming notification requests across API servers."
                }
            ],
            "required_connections": [
                ["api", "queue"],
                ["queue", "api"],
                ["api", "database"]
            ],
            "recommended_connections": [
                ["loadbalancer", "api"]
            ],
            "forbidden_connections": [
                {
                    "from": "loadbalancer",
                    "to": "queue",
                    "reason": "Requests should reach the queue through an API server."
                }
            ],
            "traffic": {
                "read_rps": 200,
                "write_rps": 5000
            }
        }'::jsonb
    ),
    (
        'design-rate-limiter',
        '{
            "required_components": [
                {
                    "type": "api",
                    "min": 2,
                    "reason": "A distributed limiter only matters with more than one API server."
                },
                {
                    "type": "cache",
                    "min": 1,
                    "reason": "Shared in-memory counters are the standard way to count requests quickly."
                },
                {
                    "type": "loadbalancer",
                    "min": 1
                }
            ],
            "recommended_components": [
                {
                    "type": "database",
                    "min": 1,
                    "reason": "A database can hold per-user limit configuration."
                }
            ],
            "required_connections": [
                ["loadbalancer", "api"],
                ["api", "cache"]
            ],
            "recommended_connections": [
                ["api", "database"]
            ],
            "forbidden_connections": [],
            "traffic": {
                "read_rps": 50000,
                "write_rps": 50000
            }
        }'::jsonb
    )
)
INSERT INTO challenge_versions
(
    challenge_id,
    version_number,
    snapshot_config
)
SELECT
    c.id,
    1,
    jsonb_build_object(
        'title', c.title,
        'slug', c.slug,
        'description', c.description,
        'difficulty', c.difficulty,
        'category', c.category,
        'estimated_minutes', c.estimated_minutes,
        'requirements', c.requirements,
        'hints', c.hints,
        'evaluation_config', configs.evaluation_config
    )
FROM challenges c
JOIN configs ON configs.slug = c.slug
ON CONFLICT (challenge_id, version_number) DO NOTHING;

INSERT INTO challenge_rule_assignments
(
    challenge_version_id,
    rule_id,
    rule_version_id,
    is_enabled,
    config_override
)
SELECT
    cv.id,
    r.id,
    rv.id,
    TRUE,
    '{}'::jsonb
FROM challenge_versions cv
JOIN challenges c
    ON c.id = cv.challenge_id
JOIN rules r
    ON r.is_active = TRUE
JOIN rule_versions rv
    ON rv.rule_id = r.id
   AND rv.version_number = r.current_version_number
WHERE cv.version_number = 1
AND r.rule_key IN (
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
ON CONFLICT (challenge_version_id, rule_id) DO NOTHING;

UPDATE challenge_versions cv
SET snapshot_config = jsonb_set(
    cv.snapshot_config,
    '{assigned_rules}',
    COALESCE(
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'rule_id', cra.rule_id,
                    'rule_key', r.rule_key,
                    'rule_type', r.rule_type,
                    'rule_version_id', cra.rule_version_id,
                    'rule_version_number', rv.version_number,
                    'is_enabled', cra.is_enabled,
                    'config_override', cra.config_override
                )
                ORDER BY r.rule_type, r.rule_key
            )
            FROM challenge_rule_assignments cra
            JOIN rules r
                ON r.id = cra.rule_id
            JOIN rule_versions rv
                ON rv.id = cra.rule_version_id
            WHERE cra.challenge_version_id = cv.id
        ),
        '[]'::jsonb
    ),
    TRUE
)
WHERE cv.version_number = 1
AND cv.challenge_id IN (
    SELECT id
    FROM challenges
    WHERE slug IN (
        'design-url-shortener',
        'design-notification-service',
        'design-rate-limiter'
    )
);