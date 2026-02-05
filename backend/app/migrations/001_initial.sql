-- Libbord: Initial schema migration
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- ENUM TYPES
-- =====================

CREATE TYPE channel_type AS ENUM (
  'website',
  'e_library',
  'catalog',
  'telegram',
  'vk',
  'mobile_app',
  'other'
);

CREATE TYPE sentiment_type AS ENUM (
  'positive',
  'neutral',
  'negative'
);

CREATE TYPE sync_status_type AS ENUM (
  'idle',
  'syncing',
  'success',
  'error'
);

-- =====================
-- TABLES
-- =====================

CREATE TABLE libraries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE metric_counters (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  library_id         UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  yandex_counter_id  TEXT NOT NULL,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at       TIMESTAMPTZ,
  sync_status        sync_status_type NOT NULL DEFAULT 'idle',
  sync_error_message TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE channels (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  library_id  UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  type        channel_type NOT NULL,
  custom_name TEXT,
  is_manual   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE traffic_metrics (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  library_id  UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  channel_id  UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  counter_id  UUID REFERENCES metric_counters(id) ON DELETE SET NULL,
  date        DATE NOT NULL,
  views       INTEGER NOT NULL DEFAULT 0,
  visits      INTEGER NOT NULL DEFAULT 0,
  users       INTEGER NOT NULL DEFAULT 0,
  avg_time    REAL NOT NULL DEFAULT 0,
  depth       REAL NOT NULL DEFAULT 0,
  bounce_rate REAL NOT NULL DEFAULT 0,
  return_rate REAL NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(library_id, channel_id, counter_id, date)
);

CREATE TABLE engagement_metrics (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  library_id  UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  channel_id  UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  likes       INTEGER NOT NULL DEFAULT 0,
  reposts     INTEGER NOT NULL DEFAULT 0,
  comments    INTEGER NOT NULL DEFAULT 0,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(library_id, channel_id, date)
);

CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  library_id  UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL,
  date        DATE NOT NULL,
  rating      SMALLINT CHECK (rating BETWEEN 1 AND 5),
  text        TEXT,
  sentiment   sentiment_type NOT NULL DEFAULT 'neutral',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE yandex_tokens (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  library_id    UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE UNIQUE,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX idx_traffic_metrics_library_date ON traffic_metrics(library_id, date);
CREATE INDEX idx_traffic_metrics_channel_date ON traffic_metrics(channel_id, date);
CREATE INDEX idx_engagement_metrics_library_date ON engagement_metrics(library_id, date);
CREATE INDEX idx_reviews_library_date ON reviews(library_id, date);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE yandex_tokens ENABLE ROW LEVEL SECURITY;

-- Public read access (dashboard is public)
CREATE POLICY "Public read" ON libraries FOR SELECT USING (true);
CREATE POLICY "Public read" ON metric_counters FOR SELECT USING (true);
CREATE POLICY "Public read" ON channels FOR SELECT USING (true);
CREATE POLICY "Public read" ON traffic_metrics FOR SELECT USING (true);
CREATE POLICY "Public read" ON engagement_metrics FOR SELECT USING (true);
CREATE POLICY "Public read" ON reviews FOR SELECT USING (true);

-- Admin write access (authenticated users)
CREATE POLICY "Admin write" ON libraries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin write" ON metric_counters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin write" ON channels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin write" ON traffic_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin write" ON engagement_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin write" ON reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Yandex tokens: admin-only
CREATE POLICY "Admin only" ON yandex_tokens FOR ALL TO authenticated USING (true) WITH CHECK (true);
