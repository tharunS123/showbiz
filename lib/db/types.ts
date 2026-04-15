export type MediaType = "movie" | "tv";
export type ListType = "watchlist" | "favorite" | "seen";
export type EventType =
  | "view_title"
  | "view_person"
  | "search"
  | "search_click"
  | "add_watchlist"
  | "remove_watchlist"
  | "favorite"
  | "unfavorite"
  | "mark_seen"
  | "unmark_seen"
  | "rate_title"
  | "note_title"
  | "rec_impression"
  | "rec_click"
  | "rec_why_open";

export interface User {
  id: string;
  clerk_id: string;
  email: string;
  name: string | null;
  image: string | null;
  created_at: string;
}

export interface ListItem {
  id: string;
  user_id: string;
  external_id: string;
  media_type: MediaType;
  list_type: ListType;
  title: string;
  poster_path: string | null;
  rating: number | null;
  note: string | null;
  created_at: string;
}

export interface InteractionEvent {
  id: string;
  user_id: string;
  event_type: EventType;
  external_id: string | null;
  media_type: MediaType | null;
  timestamp: string;
  context: Record<string, unknown> | null;
}
