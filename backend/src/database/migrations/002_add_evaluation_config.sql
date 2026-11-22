-- Run once on an existing database (safe to re-run).
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS evaluation_config JSONB NOT NULL DEFAULT '{}';
