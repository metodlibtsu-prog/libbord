-- Migration 005: Drop the original auto-named unique constraint on traffic_metrics
-- The initial schema created UNIQUE(library_id, channel_id, counter_id, date) without
-- a name, so PostgreSQL auto-named it. Migration 004 tried to drop "uq_traffic_metric"
-- (which didn't exist yet), leaving the old 4-column constraint intact alongside the
-- new 5-column "uq_traffic_metric" constraint. This caused INSERT conflicts for
-- exclude_robots=FALSE rows because the old constraint doesn't include that column.

-- Drop the auto-generated 4-column constraint (name assigned by PostgreSQL)
ALTER TABLE traffic_metrics
  DROP CONSTRAINT IF EXISTS traffic_metrics_library_id_channel_id_counter_id_date_key;

-- Verify only uq_traffic_metric remains:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'traffic_metrics'::regclass AND contype = 'u';
