-- ArchMentor AI Database Schema v1.0
-- PostgreSQL 14+
-- Reference schema for a fresh database.
-- Do not run this file in addition to the migrations on the same database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. USERS
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin')),
    account_status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (account_status IN ('active', 'suspended')),
    timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. CHALLENGES AND VERSIONED CONFIGURATION
-- ---------------------------------------------------------------------------
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(180) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL
        CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    category VARCHAR(100),
    estimated_minutes INTEGER CHECK (estimated_minutes IS NULL OR estimated_minutes > 0),
    requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    hints JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    current_version_number INTEGER NOT NULL DEFAULT 1
        CHECK (current_version_number > 0),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE challenge_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL
        REFERENCES challenges(id) ON DELETE RESTRICT,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    snapshot_config JSONB NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (challenge_id, version_number),
    UNIQUE (challenge_id, id)
);

-- ---------------------------------------------------------------------------
-- 3. CENTRAL RULE CATALOGUE AND RULE VERSIONS
-- ---------------------------------------------------------------------------
CREATE TABLE rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    rule_type VARCHAR(30) NOT NULL
        CHECK (rule_type IN ('generic', 'challenge_specific')),
    category VARCHAR(40) NOT NULL
        CHECK (category IN (
            'structure',
            'connection',
            'performance',
            'reliability',
            'requirement',
            'security',
            'data_integrity'
        )),
    severity VARCHAR(20) NOT NULL DEFAULT 'warning'
        CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    applicability JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_practice_available BOOLEAN NOT NULL DEFAULT FALSE,
    current_version_number INTEGER NOT NULL DEFAULT 1
        CHECK (current_version_number > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (NOT is_mandatory OR rule_type = 'generic')
);

CREATE TABLE rule_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL
        REFERENCES rules(id) ON DELETE RESTRICT,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (rule_id, version_number),
    UNIQUE (rule_id, id)
);

-- ---------------------------------------------------------------------------
-- 4. CHALLENGE RULE ASSIGNMENTS
-- Assignments belong to a specific challenge version.
-- ---------------------------------------------------------------------------
CREATE TABLE challenge_rule_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_version_id UUID NOT NULL
        REFERENCES challenge_versions(id) ON DELETE RESTRICT,
    rule_id UUID NOT NULL,
    rule_version_id UUID NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    config_override JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (challenge_version_id, rule_id),
    FOREIGN KEY (rule_id, rule_version_id)
        REFERENCES rule_versions(rule_id, id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- 5. USER PROJECTS
-- ---------------------------------------------------------------------------
CREATE TABLE user_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(180) NOT NULL,
    project_mode VARCHAR(20) NOT NULL
        CHECK (project_mode IN ('challenge', 'practice')),
    challenge_id UUID,
    challenge_version_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (challenge_id, challenge_version_id)
        REFERENCES challenge_versions(challenge_id, id)
        ON DELETE RESTRICT,

    CHECK (
        (
            project_mode = 'practice'
            AND challenge_id IS NULL
            AND challenge_version_id IS NULL
        )
        OR
        (
            project_mode = 'challenge'
            AND challenge_id IS NOT NULL
            AND challenge_version_id IS NOT NULL
        )
    )
);

-- ---------------------------------------------------------------------------
-- 6. PRACTICE PROJECT RULE SELECTIONS
-- Only generic, non-mandatory rules may be user-selectable.
-- The backend must validate rule_type, mandatory status and project mode.
-- ---------------------------------------------------------------------------
CREATE TABLE project_rule_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL
        REFERENCES user_projects(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL,
    rule_version_id UUID NOT NULL,
    is_selected BOOLEAN NOT NULL DEFAULT TRUE,
    config_override JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, rule_id),
    FOREIGN KEY (rule_id, rule_version_id)
        REFERENCES rule_versions(rule_id, id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- 7. ATTEMPT COUNTER AND IMMUTABLE ATTEMPTS
-- ---------------------------------------------------------------------------
CREATE TABLE project_attempt_counters (
    project_id UUID PRIMARY KEY
        REFERENCES user_projects(id) ON DELETE CASCADE,
    next_attempt_number BIGINT NOT NULL DEFAULT 1
        CHECK (next_attempt_number > 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL
        REFERENCES user_projects(id) ON DELETE RESTRICT,
    attempt_number BIGINT NOT NULL CHECK (attempt_number > 0),

    nodes_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,

    evaluation_result JSONB NOT NULL,
    score NUMERIC(6,2)
        CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    grade VARCHAR(10),
    passed BOOLEAN,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    issues JSONB NOT NULL DEFAULT '[]'::jsonb,

    evaluation_engine_version VARCHAR(80) NOT NULL,
    challenge_version_id UUID
        REFERENCES challenge_versions(id) ON DELETE RESTRICT,

    simulation_config JSONB,
    simulation_result JSONB,
    simulation_engine_version VARCHAR(80),

    idempotency_key UUID NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (project_id, attempt_number),
    UNIQUE (project_id, idempotency_key)
);

CREATE TABLE attempt_rule_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL
        REFERENCES project_attempts(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL
        REFERENCES rules(id) ON DELETE RESTRICT,
    rule_key VARCHAR(100) NOT NULL,
    rule_version_id UUID NOT NULL,
    rule_version_number INTEGER NOT NULL,
    rule_type VARCHAR(30) NOT NULL
        CHECK (rule_type IN ('generic', 'challenge_specific')),
    is_enabled BOOLEAN NOT NULL,
    config_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    eval_params JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (attempt_id, rule_id),

    FOREIGN KEY (rule_id, rule_version_id)
        REFERENCES rule_versions(rule_id, id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- 8. ACTIVITY EVENTS
-- attempt_id and project_id intentionally have no foreign keys.
-- Historical activity must survive attempt/project deletion.
-- ---------------------------------------------------------------------------
CREATE TABLE activity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID,
    attempt_id UUID,
    event_type VARCHAR(40) NOT NULL
        CHECK (event_type IN ('attempt_saved')),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activity_date DATE NOT NULL,
    timezone_at_event VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 9. ADMIN AUDIT LOGS
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID
        REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(120) NOT NULL,
    target_type VARCHAR(80) NOT NULL,
    target_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------
CREATE INDEX idx_users_role_status
    ON users(role, account_status);

CREATE INDEX idx_challenges_visibility
    ON challenges(is_published, is_archived);

CREATE INDEX idx_challenge_versions_challenge
    ON challenge_versions(challenge_id, version_number DESC);

CREATE INDEX idx_rules_type_active
    ON rules(rule_type, is_active);

CREATE INDEX idx_rules_practice_available
    ON rules(is_practice_available)
    WHERE is_active = TRUE;

CREATE INDEX idx_rule_versions_rule
    ON rule_versions(rule_id, version_number DESC);

CREATE INDEX idx_challenge_rule_assignments_version
    ON challenge_rule_assignments(challenge_version_id);

CREATE INDEX idx_projects_user_updated
    ON user_projects(user_id, updated_at DESC);

CREATE INDEX idx_projects_challenge
    ON user_projects(challenge_id)
    WHERE challenge_id IS NOT NULL;

CREATE INDEX idx_project_rule_selections_project
    ON project_rule_selections(project_id);

CREATE INDEX idx_attempts_project_number
    ON project_attempts(project_id, attempt_number DESC);

CREATE INDEX idx_attempts_saved_at
    ON project_attempts(saved_at DESC);

CREATE INDEX idx_attempt_snapshots_attempt
    ON attempt_rule_snapshots(attempt_id);

CREATE INDEX idx_activity_user_date
    ON activity_events(user_id, activity_date);

CREATE INDEX idx_activity_user_occurred
    ON activity_events(user_id, occurred_at DESC);

CREATE INDEX idx_audit_actor_created
    ON audit_logs(actor_user_id, created_at DESC);

CREATE INDEX idx_audit_target
    ON audit_logs(target_type, target_id);

-- End of ArchMentor AI Database Schema v1.0