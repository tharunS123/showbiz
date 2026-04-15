import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock chain builder ────────────────────────────────────────────────

function createMockChain(resolvedValue: { data: any; error: any }) {
  const fns: Record<string, ReturnType<typeof vi.fn>> = {};

  const chain: any = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "then") {
          return (resolve: any) => resolve(resolvedValue);
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

// ── Module-level mock ─────────────────────────────────────────────────
let mockChain: ReturnType<typeof createMockChain>;

vi.mock("../client", () => ({
  get supabase() {
    return mockChain;
  },
}));

import { logInteraction, getUserSignals } from "../interactions";

// ── Fixtures ──────────────────────────────────────────────────────────
const USER_ID = "user-xyz-789";
const SINCE = new Date("2025-03-01T00:00:00Z");

const sampleEvent = {
  id: "evt-1",
  user_id: USER_ID,
  event_type: "view_title" as const,
  external_id: "tmdb-550",
  media_type: "movie" as const,
  timestamp: "2025-03-15T12:00:00Z",
  context: null,
};

// ── Tests ─────────────────────────────────────────────────────────────

describe("logInteraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a full interaction event", async () => {
    mockChain = createMockChain({ data: null, error: null });

    await logInteraction(USER_ID, "view_title", {
      externalId: "tmdb-550",
      mediaType: "movie",
      context: { source: "search" },
    });

    expect(mockChain.__fns.from).toHaveBeenCalledWith("interaction_events");
    expect(mockChain.__fns.insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      event_type: "view_title",
      external_id: "tmdb-550",
      media_type: "movie",
      context: { source: "search" },
    });
  });

  it("defaults optional fields to null when opts is omitted", async () => {
    mockChain = createMockChain({ data: null, error: null });

    await logInteraction(USER_ID, "search");

    expect(mockChain.__fns.insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      event_type: "search",
      external_id: null,
      media_type: null,
      context: null,
    });
  });

  it("defaults individual opt fields to null when not provided", async () => {
    mockChain = createMockChain({ data: null, error: null });

    await logInteraction(USER_ID, "rec_click", { externalId: "tmdb-100" });

    expect(mockChain.__fns.insert).toHaveBeenCalledWith({
      user_id: USER_ID,
      event_type: "rec_click",
      external_id: "tmdb-100",
      media_type: null,
      context: null,
    });
  });

  it("throws on Supabase error", async () => {
    const dbError = { message: "insert failed", code: "23505" };
    mockChain = createMockChain({ data: null, error: dbError });

    await expect(logInteraction(USER_ID, "search")).rejects.toEqual(dbError);
  });
});

describe("getUserSignals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns interaction events since the given date", async () => {
    const events = [sampleEvent];
    mockChain = createMockChain({ data: events, error: null });

    const result = await getUserSignals(USER_ID, SINCE);

    expect(result).toEqual(events);
    expect(mockChain.__fns.from).toHaveBeenCalledWith("interaction_events");
    expect(mockChain.__fns.select).toHaveBeenCalledWith("*");
    expect(mockChain.__fns.eq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(mockChain.__fns.gte).toHaveBeenCalledWith(
      "timestamp",
      SINCE.toISOString()
    );
    expect(mockChain.__fns.order).toHaveBeenCalledWith("timestamp", {
      ascending: false,
    });
    expect(mockChain.__fns.limit).toHaveBeenCalledWith(500);
  });

  it("returns an empty array when data is null", async () => {
    mockChain = createMockChain({ data: null, error: null });

    const result = await getUserSignals(USER_ID, SINCE);
    expect(result).toEqual([]);
  });

  it("returns an empty array when there are no events", async () => {
    mockChain = createMockChain({ data: [], error: null });

    const result = await getUserSignals(USER_ID, SINCE);
    expect(result).toEqual([]);
  });

  it("throws on Supabase error", async () => {
    const dbError = { message: "timeout", code: "TIMEOUT" };
    mockChain = createMockChain({ data: null, error: dbError });

    await expect(getUserSignals(USER_ID, SINCE)).rejects.toEqual(dbError);
  });

  it("serialises the Date parameter to ISO string for the gte filter", async () => {
    mockChain = createMockChain({ data: [], error: null });
    const weirdDate = new Date("2024-12-31T23:59:59.999Z");

    await getUserSignals(USER_ID, weirdDate);

    expect(mockChain.__fns.gte).toHaveBeenCalledWith(
      "timestamp",
      "2024-12-31T23:59:59.999Z"
    );
  });
});
