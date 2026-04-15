-- Track season counts for new-release detection
CREATE TABLE IF NOT EXISTS release_checks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id    TEXT NOT NULL UNIQUE,
  season_count   INT NOT NULL DEFAULT 0,
  last_checked   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_release_checks_external ON release_checks(external_id);
ALTER TABLE release_checks ENABLE ROW LEVEL SECURITY;

-- User notification preferences
CREATE TABLE IF NOT EXISTS user_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  external_id TEXT,
  title       TEXT,
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_notifications_user ON user_notifications(user_id, read, created_at DESC);
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
