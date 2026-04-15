-- Custom user-created lists
CREATE TABLE custom_lists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  is_public   BOOLEAN NOT NULL DEFAULT false,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_custom_lists_user ON custom_lists(user_id);
CREATE INDEX idx_custom_lists_slug ON custom_lists(slug);

CREATE TABLE custom_list_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id        UUID NOT NULL REFERENCES custom_lists(id) ON DELETE CASCADE,
  external_id    TEXT NOT NULL,
  media_type     media_type NOT NULL,
  title          TEXT NOT NULL DEFAULT '',
  poster_path    TEXT,
  note           TEXT,
  ordering       INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (list_id, external_id, media_type)
);

CREATE INDEX idx_custom_list_items_list ON custom_list_items(list_id, ordering);

ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_list_items ENABLE ROW LEVEL SECURITY;

-- User preferences
CREATE TABLE user_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  excluded_genres INTEGER[] DEFAULT '{}',
  max_content_rating TEXT,
  hide_spoilers   BOOLEAN NOT NULL DEFAULT true,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Ratings and notes
ALTER TABLE list_items ADD COLUMN IF NOT EXISTS rating SMALLINT CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE list_items ADD COLUMN IF NOT EXISTS note TEXT;
