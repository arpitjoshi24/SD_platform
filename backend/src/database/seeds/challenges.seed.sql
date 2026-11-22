-- Idempotent seed. Safe to run many times.
-- For a challenge that already exists (same slug) ONLY evaluation_config is updated,
-- your title/description/etc. are left untouched.

-- 1) URL Shortener ---------------------------------------------------
INSERT INTO challenges
  (title, slug, description, difficulty, category, estimated_time, requirements, hints, evaluation_config)
VALUES (
  'Design URL Shortener',
  'design-url-shortener',
  'Design a scalable URL shortening service similar to Bitly.',
  'Medium', 'Distributed Systems', 45,
  '["Support 10 million URLs", "Low latency", "High availability", "Read-heavy workload"]',
  '["Think about caching", "Think about database indexing", "Think about load balancing"]',
  '{
    "required_components": [
      { "type": "api", "min": 1 },
      { "type": "database", "min": 1,
        "reason": "Short-code to URL mappings must be stored durably." }
    ],
    "recommended_components": [
      { "type": "cache", "min": 1,
        "reason": "Redirects are read-heavy. Caching hot short codes keeps latency low." },
      { "type": "loadbalancer", "min": 1,
        "reason": "High availability needs traffic spread across several API servers." },
      { "type": "api", "min": 2,
        "reason": "A single API server is a single point of failure." }
    ],
    "required_connections": [
      ["api", "database"]
    ],
    "recommended_connections": [
      ["loadbalancer", "api"],
      ["api", "cache"]
    ],
    "forbidden_connections": [
      { "from": "loadbalancer", "to": "database",
        "reason": "Clients and load balancers should never talk to the database directly." }
    ],
    "traffic": { "read_rps": 10000, "write_rps": 100 }
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET evaluation_config = EXCLUDED.evaluation_config;

-- 2) Notification service -------------------------------------------
INSERT INTO challenges
  (title, slug, description, difficulty, category, estimated_time, requirements, hints, evaluation_config)
VALUES (
  'Design a Notification Service',
  'design-notification-service',
  'Design a service that sends email and push notifications to millions of users without blocking the application.',
  'Medium', 'Messaging', 40,
  '["Deliver millions of notifications per day", "Never block the caller", "Retry failed deliveries", "Store delivery status"]',
  '["Decouple producers from senders", "Think about asynchronous processing", "Where do you store delivery history?"]',
  '{
    "required_components": [
      { "type": "api", "min": 1 },
      { "type": "queue", "min": 1,
        "reason": "Sending must be asynchronous. A queue decouples the request from delivery." },
      { "type": "database", "min": 1,
        "reason": "Delivery status and history must be persisted." }
    ],
    "recommended_components": [
      { "type": "api", "min": 2,
        "reason": "Separate API servers for producers and workers lets them scale independently." },
      { "type": "loadbalancer", "min": 1,
        "reason": "Spread incoming notification requests across API servers." }
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
      { "from": "loadbalancer", "to": "queue",
        "reason": "Requests should reach the queue through an API server." }
    ],
    "traffic": { "read_rps": 200, "write_rps": 5000 }
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET evaluation_config = EXCLUDED.evaluation_config;

-- 3) Rate limiter ---------------------------------------------------
INSERT INTO challenges
  (title, slug, description, difficulty, category, estimated_time, requirements, hints, evaluation_config)
VALUES (
  'Design a Rate Limiter',
  'design-rate-limiter',
  'Design a distributed rate limiter that protects an API from abuse while adding minimal latency.',
  'Hard', 'Infrastructure', 50,
  '["Limit requests per user per minute", "Add under 5 ms of latency", "Work across many API servers", "Survive server restarts"]',
  '["Counters must be shared between servers", "Which storage is fast enough for every request?"]',
  '{
    "required_components": [
      { "type": "api", "min": 2,
        "reason": "A distributed limiter only matters with more than one API server." },
      { "type": "cache", "min": 1,
        "reason": "Shared in-memory counters are the standard way to count requests quickly." },
      { "type": "loadbalancer", "min": 1 }
    ],
    "recommended_components": [
      { "type": "database", "min": 1,
        "reason": "A database can hold per-user limit configuration." }
    ],
    "required_connections": [
      ["loadbalancer", "api"],
      ["api", "cache"]
    ],
    "recommended_connections": [
      ["api", "database"]
    ],
    "forbidden_connections": [],
    "traffic": { "read_rps": 50000, "write_rps": 50000 }
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET evaluation_config = EXCLUDED.evaluation_config;
