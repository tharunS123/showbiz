-- Showbiz schema for Supabase Postgres
-- Run this in the Supabase SQL Editor to create all tables

-- Enums
CREATE TYPE media_type AS ENUM ('movie', 'tv');
CREATE TYPE list_type AS ENUM ('watchlist', 'favorite', 'seen');
CREATE TYPE event_type AS ENUM (
  'view_title',
  'view_person',
  'search',
  'search_click',
  'add_watchlist',
  'remove_watchlist',
  'favorite',
  'unfavorite',
  'mark_seen',
  'unmark_seen',
  'rec_impression',
  'rec_click',
  'rec_why_open'
);

-- Users (synced from Clerk)
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id    TEXT NOT NULL UNIQUE,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  image       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User list items (watchlist, favorites, seen)
CREATE TABLE list_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  media_type  media_type NOT NULL,
  list_type   list_type NOT NULL,
  title       TEXT NOT NULL DEFAULT '',
  poster_path TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, external_id, media_type, list_type)
);

CREATE INDEX idx_list_items_user_type ON list_items(user_id, list_type);

-- User interaction events for the recommendation engine
CREATE TABLE interaction_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  event_type NOT NULL,
  external_id TEXT,
  media_type  media_type,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  context     JSONB
);

CREATE INDEX idx_interactions_user_event ON interaction_events(user_id, event_type);
CREATE INDEX idx_interactions_user_time ON interaction_events(user_id, timestamp DESC);

-- Row Level Security (enable per-user access)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_events ENABLE ROW LEVEL SECURITY;

-- The service_role key bypasses RLS, so server-side operations work.
-- If you later add client-side Supabase usage, add RLS policies here.
