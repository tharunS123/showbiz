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
// `deleteUserData` calls the supabase proxy multiple times in sequence,
// and also calls `getUserByClerkId` internally which starts its own
// chain. We need a fresh chain for each `.from()` access. We achieve
// this by making `supabase` a getter that returns the *current*
// `mockChain`.  For multi-call tests we swap `mockChain` between steps
// using `mockChainQueue` (FIFO).

let mockChainQueue: ReturnType<typeof createMockChain>[] = [];
let defaultMockChain: ReturnType<typeof createMockChain>;

function currentMockChain() {
  if (mockChainQueue.length > 0) return mockChainQueue.shift()!;
  return defaultMockChain;
}

vi.mock("../client", () => ({
  get supabase() {
    return currentMockChain();
  },
}));

import { syncClerkUser, getUserByClerkId, deleteUserData } from "../user";

// ── Fixtures ──────────────────────────────────────────────────────────
const CLERK_ID = "clerk_abc123";

const sampleUser = {
  id: "uuid-1",
  clerk_id: CLERK_ID,
  email: "test@example.com",
  name: "Test User",
  image: "https://img.clerk.com/avatar.png",
  created_at: "2025-01-01T00:00:00Z",
};

// ── Tests ─────────────────────────────────────────────────────────────

describe("syncClerkUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChainQueue = [];
  });

  it("upserts a user and returns the resulting row", async () => {
    defaultMockChain = createMockChain({ data: sampleUser, error: null });

    const result = await syncClerkUser({
      clerkId: CLERK_ID,
      email: "test@example.com",
      name: "Test User",
      image: "https://img.clerk.com/avatar.png",
    });

    expect(result).toEqual(sampleUser);
    expect(defaultMockChain.__fns.from).toHaveBeenCalledWith("users");
    expect(defaultMockChain.__fns.upsert).toHaveBeenCalledWith(
      {
        clerk_id: CLERK_ID,
        email: "test@example.com",
        name: "Test User",
        image: "https://img.clerk.com/avatar.png",
      },
      { onConflict: "clerk_id" }
    );
    expect(defaultMockChain.__fns.select).toHaveBeenCalled();
    expect(defaultMockChain.__fns.single).toHaveBeenCalled();
  });

  it("defaults name and image to null when omitted", async () => {
    defaultMockChain = createMockChain({
      data: { ...sampleUser, name: null, image: null },
      error: null,
    });

    await syncClerkUser({ clerkId: CLERK_ID, email: "test@example.com" });

    expect(defaultMockChain.__fns.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: null, image: null }),
      expect.any(Object)
    );
  });

  it("throws on Supabase error", async () => {
    const dbError = { message: "unique violation", code: "23505" };
    defaultMockChain = createMockChain({ data: null, error: dbError });

    await expect(
      syncClerkUser({ clerkId: CLERK_ID, email: "x@y.com" })
    ).rejects.toEqual(dbError);
  });
});

describe("getUserByClerkId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChainQueue = [];
  });

  it("returns the user when found", async () => {
    defaultMockChain = createMockChain({ data: sampleUser, error: null });

    const result = await getUserByClerkId(CLERK_ID);

    expect(result).toEqual(sampleUser);
    expect(defaultMockChain.__fns.from).toHaveBeenCalledWith("users");
    expect(defaultMockChain.__fns.select).toHaveBeenCalledWith("*");
    expect(defaultMockChain.__fns.eq).toHaveBeenCalledWith(
      "clerk_id",
      CLERK_ID
    );
    expect(defaultMockChain.__fns.maybeSingle).toHaveBeenCalled();
  });

  it("returns null when the user does not exist", async () => {
    defaultMockChain = createMockChain({ data: null, error: null });

    const result = await getUserByClerkId("clerk_nonexistent");
    expect(result).toBeNull();
  });

  it("throws on Supabase error", async () => {
    const dbError = { message: "permission denied" };
    defaultMockChain = createMockChain({ data: null, error: dbError });

    await expect(getUserByClerkId(CLERK_ID)).rejects.toEqual(dbError);
  });
});

describe("deleteUserData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChainQueue = [];
  });

  it("does nothing when the user does not exist", async () => {
    // getUserByClerkId returns null → early return
    defaultMockChain = createMockChain({ data: null, error: null });

    await deleteUserData("clerk_nonexistent");

    // Only one `.from("users")` call for the lookup; no deletes issued
    expect(defaultMockChain.__fns.from).toHaveBeenCalledTimes(1);
    expect(defaultMockChain.__fns.from).toHaveBeenCalledWith("users");
  });

  it("deletes interaction_events, list_items, then users row in order", async () => {
    // Chain 1: getUserByClerkId lookup
    const lookupChain = createMockChain({ data: sampleUser, error: null });
    // Chains 2-4: three sequential deletes
    const deleteChain1 = createMockChain({ data: null, error: null });
    const deleteChain2 = createMockChain({ data: null, error: null });
    const deleteChain3 = createMockChain({ data: null, error: null });

    mockChainQueue = [lookupChain, deleteChain1, deleteChain2, deleteChain3];

    await deleteUserData(CLERK_ID);

    // Verify the lookup
    expect(lookupChain.__fns.from).toHaveBeenCalledWith("users");
    expect(lookupChain.__fns.eq).toHaveBeenCalledWith("clerk_id", CLERK_ID);
    expect(lookupChain.__fns.maybeSingle).toHaveBeenCalled();

    // Verify the three deletes target the correct tables/user
    expect(deleteChain1.__fns.from).toHaveBeenCalledWith("interaction_events");
    expect(deleteChain1.__fns.delete).toHaveBeenCalled();
    expect(deleteChain1.__fns.eq).toHaveBeenCalledWith(
      "user_id",
      sampleUser.id
    );

    expect(deleteChain2.__fns.from).toHaveBeenCalledWith("list_items");
    expect(deleteChain2.__fns.delete).toHaveBeenCalled();
    expect(deleteChain2.__fns.eq).toHaveBeenCalledWith(
      "user_id",
      sampleUser.id
    );

    expect(deleteChain3.__fns.from).toHaveBeenCalledWith("users");
    expect(deleteChain3.__fns.delete).toHaveBeenCalled();
    expect(deleteChain3.__fns.eq).toHaveBeenCalledWith("id", sampleUser.id);
  });
});
