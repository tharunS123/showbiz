import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock chain builder ────────────────────────────────────────────────
// Each call to `createMockChain` returns a Proxy whose every method
// is a vi.fn() returning the same proxy, so `.from().select().eq()`
// chains work. The terminal `.then` resolves to whatever `resolvedValue`
// was passed in, which lets the `await` in the source module get data.

function createMockChain(resolvedValue: { data: unknown; error: unknown }) {
  const fns: Record<string, ReturnType<typeof vi.fn>> = {};

  const chain = new Proxy<Record<string, ReturnType<typeof vi.fn>>>(
    {},
    {
      get(_target, prop: string) {
if (prop === "then") {
           return (resolve: (value: unknown) => void) => resolve(resolvedValue);
        }
        if (prop === "__fns") return fns;
        if (!fns[prop]) {
          fns[prop] = vi.fn().mockReturnValue(chain);
        }
        return fns[prop];
      },
    }
  );

  return chain;
}

// ── Module-level mock for the Supabase client proxy ───────────────────
let mockChain: ReturnType<typeof createMockChain>;

vi.mock("../client", () => ({
  get supabase() {
    return mockChain;
  },
}));

// Import *after* vi.mock so the mock is in place
import {
  getUserList,
  addListItem,
  removeListItem,
  getUserListStatus,
  getAllUserListExternalIds,
} from "../list";

// ── Fixtures ──────────────────────────────────────────────────────────
const USER_ID = "user-abc-123";
const EXTERNAL_ID = "tmdb-550";

const sampleListItem = {
  id: "row-1",
  user_id: USER_ID,
  external_id: EXTERNAL_ID,
  media_type: "movie" as const,
  list_type: "watchlist" as const,
  title: "Fight Club",
  poster_path: "/poster.jpg",
  created_at: "2025-01-01T00:00:00Z",
};

// ── Tests ─────────────────────────────────────────────────────────────

describe("getUserList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns list items for a given user and list type", async () => {
    const items = [sampleListItem];
    mockChain = createMockChain({ data: items, error: null });

    const result = await getUserList(USER_ID, "watchlist");

    expect(result).toEqual(items);
    expect(mockChain.__fns.from).toHaveBeenCalledWith("list_items");
    expect(mockChain.__fns.select).toHaveBeenCalledWith("*");
    expect(mockChain.__fns.eq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(mockChain.__fns.eq).toHaveBeenCalledWith("list_type", "watchlist");
    expect(mockChain.__fns.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it("returns an empty array when data is null", async () => {
    mockChain = createMockChain({ data: null, error: null });

    const result = await getUserList(USER_ID, "favorite");
    expect(result).toEqual([]);
  });

  it("throws when Supabase returns an error", async () => {
    const dbError = { message: "connection refused", code: "ECONNREFUSED" };
    mockChain = createMockChain({ data: null, error: dbError });

    await expect(getUserList(USER_ID, "seen")).rejects.toEqual(dbError);
  });
});

describe("addListItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts a list item with full metadata", async () => {
    mockChain = createMockChain({ data: null, error: null });

    await addListItem(USER_ID, EXTERNAL_ID, "movie", "watchlist", {
      title: "Fight Club",
      posterPath: "/poster.jpg",
    });

    expect(mockChain.__fns.from).toHaveBeenCalledWith("list_items");
    expect(mockChain.__fns.upsert).toHaveBeenCalledWith(
      {
        user_id: USER_ID,
        external_id: EXTERNAL_ID,
        media_type: "movie",
        list_type: "watchlist",
        title: "Fight Club",
        poster_path: "/poster.jpg",
      },
      { onConflict: "user_id,external_id,media_type,list_type" }
    );
  });

  it("defaults title to empty string and poster_path to null when meta is omitted", async () => {
    mockChain = createMockChain({ data: null, error: null });

    await addListItem(USER_ID, EXTERNAL_ID, "tv", "favorite");

    expect(mockChain.__fns.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ title: "", poster_path: null }),
      expect.any(Object)
    );
  });

  it("throws on Supabase error", async () => {
    const dbError = { message: "unique violation" };
    mockChain = createMockChain({ data: null, error: dbError });

    await expect(
      addListItem(USER_ID, EXTERNAL_ID, "movie", "watchlist")
    ).rejects.toEqual(dbError);
  });
});

describe("removeListItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("issues a delete with the correct four-column filter", async () => {
    mockChain = createMockChain({ data: null, error: null });

    await removeListItem(USER_ID, EXTERNAL_ID, "movie", "watchlist");

    expect(mockChain.__fns.from).toHaveBeenCalledWith("list_items");
    expect(mockChain.__fns.delete).toHaveBeenCalled();
    expect(mockChain.__fns.eq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(mockChain.__fns.eq).toHaveBeenCalledWith("external_id", EXTERNAL_ID);
    expect(mockChain.__fns.eq).toHaveBeenCalledWith("media_type", "movie");
    expect(mockChain.__fns.eq).toHaveBeenCalledWith("list_type", "watchlist");
  });

  it("throws on Supabase error", async () => {
    const dbError = { message: "row not found" };
    mockChain = createMockChain({ data: null, error: dbError });

    await expect(
      removeListItem(USER_ID, EXTERNAL_ID, "movie", "seen")
    ).rejects.toEqual(dbError);
  });
});

describe("getUserListStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true flags for each list type the item belongs to", async () => {
    mockChain = createMockChain({
      data: [{ list_type: "watchlist" }, { list_type: "seen" }],
      error: null,
    });

    const status = await getUserListStatus(USER_ID, EXTERNAL_ID, "movie");

    expect(status).toEqual({
      watchlist: true,
      favorite: false,
      seen: true,
    });
  });

  it("returns all false when item has no list entries", async () => {
    mockChain = createMockChain({ data: [], error: null });

    const status = await getUserListStatus(USER_ID, EXTERNAL_ID, "tv");
    expect(status).toEqual({ watchlist: false, favorite: false, seen: false });
  });

  it("returns all false when data is null", async () => {
    mockChain = createMockChain({ data: null, error: null });

    const status = await getUserListStatus(USER_ID, EXTERNAL_ID, "movie");
    expect(status).toEqual({ watchlist: false, favorite: false, seen: false });
  });

  it("queries the correct table and columns", async () => {
    mockChain = createMockChain({ data: [], error: null });

    await getUserListStatus(USER_ID, EXTERNAL_ID, "movie");

    expect(mockChain.__fns.from).toHaveBeenCalledWith("list_items");
    expect(mockChain.__fns.select).toHaveBeenCalledWith("list_type");
    expect(mockChain.__fns.eq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(mockChain.__fns.eq).toHaveBeenCalledWith("external_id", EXTERNAL_ID);
    expect(mockChain.__fns.eq).toHaveBeenCalledWith("media_type", "movie");
  });

  it("throws on Supabase error", async () => {
    const dbError = { message: "permission denied" };
    mockChain = createMockChain({ data: null, error: dbError });

    await expect(
      getUserListStatus(USER_ID, EXTERNAL_ID, "movie")
    ).rejects.toEqual(dbError);
  });
});

describe("getAllUserListExternalIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a Set of external IDs", async () => {
    mockChain = createMockChain({
      data: [
        { external_id: "tmdb-550" },
        { external_id: "tmdb-680" },
        { external_id: "tmdb-120" },
      ],
      error: null,
    });

    const ids = await getAllUserListExternalIds(USER_ID, "seen");

    expect(ids).toBeInstanceOf(Set);
    expect(ids.size).toBe(3);
    expect(ids.has("tmdb-550")).toBe(true);
    expect(ids.has("tmdb-680")).toBe(true);
    expect(ids.has("tmdb-120")).toBe(true);
  });

  it("returns an empty Set when data is null", async () => {
    mockChain = createMockChain({ data: null, error: null });

    const ids = await getAllUserListExternalIds(USER_ID, "watchlist");
    expect(ids).toBeInstanceOf(Set);
    expect(ids.size).toBe(0);
  });

  it("returns an empty Set when there are no rows", async () => {
    mockChain = createMockChain({ data: [], error: null });

    const ids = await getAllUserListExternalIds(USER_ID, "favorite");
    expect(ids.size).toBe(0);
  });

  it("queries the correct table and columns", async () => {
    mockChain = createMockChain({ data: [], error: null });

    await getAllUserListExternalIds(USER_ID, "watchlist");

    expect(mockChain.__fns.from).toHaveBeenCalledWith("list_items");
    expect(mockChain.__fns.select).toHaveBeenCalledWith("external_id");
    expect(mockChain.__fns.eq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(mockChain.__fns.eq).toHaveBeenCalledWith("list_type", "watchlist");
  });

  it("throws on Supabase error", async () => {
    const dbError = { message: "timeout" };
    mockChain = createMockChain({ data: null, error: dbError });

    await expect(
      getAllUserListExternalIds(USER_ID, "watchlist")
    ).rejects.toEqual(dbError);
  });
});
