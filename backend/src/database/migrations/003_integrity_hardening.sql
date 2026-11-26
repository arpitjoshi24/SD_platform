-- ArchMentor AI Integrity Hardening Migration v1.0
-- Apply after 001_initial_schema.sql and seed files on existing databases.

-- DB-05: Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id BIGSERIAL PRIMARY KEY,
    migration_name VARCHAR(180) NOT NULL UNIQUE,
    checksum VARCHAR(128),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO schema_migrations (migration_name, success)
VALUES ('001_initial_schema.sql', TRUE), ('003_integrity_hardening.sql', TRUE)
ON CONFLICT (migration_name) DO NOTHING;

-- DB-01: Prevent silent updates to saved project_attempts
CREATE OR REPLACE FUNCTION prevent_attempt_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'project_attempts records are immutable and cannot be updated';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_project_attempts_no_update ON project_attempts;
CREATE TRIGGER trg_project_attempts_no_update
BEFORE UPDATE ON project_attempts
FOR EACH ROW
EXECUTE FUNCTION prevent_attempt_mutation();

-- DB-02: Protect version history (challenge_versions, rule_versions, attempt_rule_snapshots)
CREATE OR REPLACE FUNCTION prevent_version_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION '% records are immutable and cannot be modified', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_challenge_versions_no_update ON challenge_versions;
CREATE TRIGGER trg_challenge_versions_no_update
BEFORE UPDATE ON challenge_versions
FOR EACH ROW
EXECUTE FUNCTION prevent_version_mutation();

DROP TRIGGER IF EXISTS trg_rule_versions_no_update ON rule_versions;
CREATE TRIGGER trg_rule_versions_no_update
BEFORE UPDATE ON rule_versions
FOR EACH ROW
EXECUTE FUNCTION prevent_version_mutation();

DROP TRIGGER IF EXISTS trg_attempt_rule_snapshots_no_mutation ON attempt_rule_snapshots;
CREATE TRIGGER trg_attempt_rule_snapshots_no_mutation
BEFORE UPDATE ON attempt_rule_snapshots
FOR EACH ROW
EXECUTE FUNCTION prevent_version_mutation();

-- DB-03: Prevent duplicate attempt_saved activity events for the same attempt
CREATE UNIQUE INDEX IF NOT EXISTS uq_activity_events_user_attempt_type
    ON activity_events (user_id, attempt_id, event_type)
    WHERE attempt_id IS NOT NULL;

-- DB-04: Enforce project mode vs challenge_version_id consistency on project_attempts
CREATE OR REPLACE FUNCTION enforce_attempt_project_version_consistency()
RETURNS TRIGGER AS $$
DECLARE
    proj_mode VARCHAR(20);
    proj_challenge_version_id UUID;
BEGIN
    SELECT project_mode, challenge_version_id
      INTO proj_mode, proj_challenge_version_id
      FROM user_projects
     WHERE id = NEW.project_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced project % does not exist', NEW.project_id;
    END IF;

    IF proj_mode = 'challenge' THEN
        IF NEW.challenge_version_id IS DISTINCT FROM proj_challenge_version_id THEN
            RAISE EXCEPTION
                'Attempt challenge_version_id (%) does not match project assigned challenge_version_id (%)',
                NEW.challenge_version_id, proj_challenge_version_id;
        END IF;
    ELSIF proj_mode = 'practice' THEN
        IF NEW.challenge_version_id IS NOT NULL THEN
            RAISE EXCEPTION 'Practice project attempts cannot reference a challenge_version_id';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attempt_project_version_check ON project_attempts;
CREATE TRIGGER trg_attempt_project_version_check
BEFORE INSERT ON project_attempts
FOR EACH ROW
EXECUTE FUNCTION enforce_attempt_project_version_consistency();

-- Enforce practice-mode rule selection rules at DB level as defense-in-depth
CREATE OR REPLACE FUNCTION enforce_practice_rule_selection()
RETURNS TRIGGER AS $$
DECLARE
    proj_mode VARCHAR(20);
    r_type VARCHAR(30);
    r_mandatory BOOLEAN;
    r_active BOOLEAN;
    r_practice BOOLEAN;
BEGIN
    SELECT project_mode INTO proj_mode
      FROM user_projects
     WHERE id = NEW.project_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced project % does not exist', NEW.project_id;
    END IF;

    IF proj_mode <> 'practice' THEN
        RAISE EXCEPTION 'Rule selections are only permitted for practice projects';
    END IF;

    SELECT rule_type, is_mandatory, is_active, is_practice_available
      INTO r_type, r_mandatory, r_active, r_practice
      FROM rules
     WHERE id = NEW.rule_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced rule % does not exist', NEW.rule_id;
    END IF;

    IF r_type <> 'generic' OR r_mandatory IS TRUE OR r_active IS NOT TRUE OR r_practice IS NOT TRUE THEN
        RAISE EXCEPTION 'Rule % is not eligible for practice mode selection', NEW.rule_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_practice_rule_selection_check ON project_rule_selections;
CREATE TRIGGER trg_practice_rule_selection_check
BEFORE INSERT OR UPDATE ON project_rule_selections
FOR EACH ROW
EXECUTE FUNCTION enforce_practice_rule_selection();

-- DB-06: Additional composite index for project filtering by mode and status
CREATE INDEX IF NOT EXISTS idx_projects_user_mode_status
    ON user_projects (user_id, project_mode, status, updated_at DESC);