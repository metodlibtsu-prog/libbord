-- Migration 004: Add exclude_robots column to traffic_metrics
-- Run this in Supabase SQL Editor

-- Add the column. Default TRUE — existing rows are treated as "without robots"
-- so the dashboard continues to work immediately after migration.
-- After first re-sync, TRUE rows will contain properly filtered data,
-- and FALSE rows will be added with unfiltered ("with robots") data.
ALTER TABLE traffic_metrics
  ADD COLUMN IF NOT EXISTS exclude_robots BOOLEAN NOT NULL DEFAULT TRUE;

-- Drop the old unique constraint
ALTER TABLE traffic_metrics
  DROP CONSTRAINT IF EXISTS uq_traffic_metric;

-- Add new unique constraint that includes exclude_robots
ALTER TABLE traffic_metrics
  ADD CONSTRAINT uq_traffic_metric
  UNIQUE (library_id, channel_id, counter_id, date, exclude_robots);
