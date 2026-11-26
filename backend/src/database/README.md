# ArchMentor AI — Database Package v1.0

This package contains the PostgreSQL database baseline for ArchMentor AI.

## Package contents

- `schema.sql` — complete reference schema for a fresh database.
- `migrations/001_initial_schema.sql` — initial schema migration.
- `seeds/rules.seed.sql` — initial generic and challenge-specific rule catalogue.
- `seeds/challenges.seed.sql` — initial guided challenges, version snapshots and rule assignments.

## Folder structure

backend/src/database/
├── schema.sql
├── README.md
├── migrations/
│   └── 001_initial_schema.sql
└── seeds/
    ├── rules.seed.sql
    └── challenges.seed.sql

## Fresh database setup order

Run these files in this order:

1. migrations/001_initial_schema.sql
2. seeds/rules.seed.sql
3. seeds/challenges.seed.sql

Do not run schema.sql in addition to migration 001.
Both files create the same database structure.

## Important implementation contracts

1. Guided projects must store both challenge_id and the exact
   challenge_version_id.

2. Practice projects must store neither challenge reference.

3. Challenge rule assignments belong to a challenge version.
   Editing a challenge configuration should create a new version.

4. Rule versions preserve historical rule configurations.
   Executable rule functions stay in the backend registry.

5. project_rule_selections is for practice projects and generic,
   non-mandatory rules only.

6. Mandatory generic rules must always be applied, even if a client
   attempts to deselect them.

7. An explicit Save creates one immutable project_attempts row,
   its attempt_rule_snapshots, and one activity_events row
   in a single database transaction.

8. Allocate attempt numbers using project_attempt_counters
   inside the transaction. Do not use MAX(attempt_number) + 1.

9. activity_events.attempt_id and project_id intentionally have
   no foreign keys. Historical activity must survive attempt
   or project deletion.

10. The MVP stores a simulation result with the attempt when
    simulation is run before Save.

11. Deleting an attempt is permanent, but its activity event remains.

12. Challenge deletion should be archive-first.

## MVP boundaries

- No server-side draft table.
- Browser localStorage stores unsaved canvas state.
- No persistent AI mentor chat tables initially.
- No separate report table initially.
- No separate simulation_runs table initially.
- updated_at values must be maintained by application update
  statements or a shared database trigger.
- Backend services must enforce business rules and authorization.

## Version

ArchMentor AI Database Schema v1.0
PostgreSQL 14 or later.