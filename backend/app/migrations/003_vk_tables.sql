-- Libbord: VK integration tables
-- Run this in Supabase SQL Editor

-- =====================
-- VK UPLOADS TABLE
-- =====================

CREATE TABLE vk_uploads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  library_id    UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  channel_id    UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  uploaded_at   TIMESTAMPTZ NOT NULL,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  total_rows    INTEGER,
  status        TEXT NOT NULL DEFAULT 'processing',
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vk_uploads_library ON vk_uploads(library_id);
CREATE INDEX idx_vk_uploads_channel ON vk_uploads(channel_id);
CREATE INDEX idx_vk_uploads_status ON vk_uploads(status);

-- =====================
-- VK METRICS TABLE
-- =====================

CREATE TABLE vk_metrics (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  library_id        UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  channel_id        UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  upload_id         UUID REFERENCES vk_uploads(id) ON DELETE CASCADE,
  date              DATE NOT NULL,

  -- Reach and views
  visitors          INTEGER NOT NULL DEFAULT 0,
  views             INTEGER NOT NULL DEFAULT 0,

  -- Content
  posts             INTEGER NOT NULL DEFAULT 0,
  stories           INTEGER NOT NULL DEFAULT 0,
  clips             INTEGER NOT NULL DEFAULT 0,
  videos            INTEGER NOT NULL DEFAULT 0,

  -- Subscribers dynamics
  subscribed        INTEGER NOT NULL DEFAULT 0,
  unsubscribed      INTEGER NOT NULL DEFAULT 0,
  total_subscribers INTEGER NOT NULL DEFAULT 0,

  -- Site clicks
  site_clicks       INTEGER NOT NULL DEFAULT 0,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(library_id, channel_id, date)
);

CREATE INDEX idx_vk_metrics_library ON vk_metrics(library_id);
CREATE INDEX idx_vk_metrics_channel ON vk_metrics(channel_id);
CREATE INDEX idx_vk_metrics_upload ON vk_metrics(upload_id);
CREATE INDEX idx_vk_metrics_date ON vk_metrics(date);
