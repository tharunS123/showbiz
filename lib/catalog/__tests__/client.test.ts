import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { tmdbFetch } from "../client";
import { CatalogError } from "@/lib/errors";

const TEST_URL = "https://api.themoviedb.org/3/movie/123";
const TEST_KEY = "test-api-key-abc";

function mockFetchResponse(body: unknown, init: ResponseInit = {}) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
      ...init,
    })
  );
}

describe("tmdbFetch", () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.TMDB_API_KEY;
    process.env.TMDB_API_KEY = TEST_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.TMDB_API_KEY;
    } else {
      process.env.TMDB_API_KEY = originalKey;
    }
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on a successful response", async () => {
    const payload = { id: 123, title: "Inception" };
    globalThis.fetch = mockFetchResponse(payload);

    const result = await tmdbFetch<{ id: number; title: string }>(TEST_URL);

    expect(result).toEqual(payload);
  });

  it("sends Authorization header with the bearer token", async () => {
    globalThis.fetch = mockFetchResponse({ ok: true });

    await tmdbFetch(TEST_URL);

    expect(globalThis.fetch).toHaveBeenCalledOnce();
    const [, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(opts.headers).toEqual({
      Authorization: `Bearer ${TEST_KEY}`,
    });
  });

  it("appends params as query-string parameters", async () => {
    globalThis.fetch = mockFetchResponse({ ok: true });

    await tmdbFetch(TEST_URL, { language: "en-US", page: "2" });

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    const parsed = new URL(calledUrl);
    expect(parsed.searchParams.get("language")).toBe("en-US");
    expect(parsed.searchParams.get("page")).toBe("2");
  });

  it("throws CatalogError with status 500 when TMDB_API_KEY is missing", async () => {
    delete process.env.TMDB_API_KEY;

    await expect(tmdbFetch(TEST_URL)).rejects.toThrow(CatalogError);
    await expect(tmdbFetch(TEST_URL)).rejects.toMatchObject({
      name: "CatalogError",
      status: 500,
    });
  });

  it("throws CatalogError with response status on non-ok response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("Not Found", { status: 404, statusText: "Not Found" })
    );

    await expect(tmdbFetch(TEST_URL)).rejects.toThrow(CatalogError);
    await expect(tmdbFetch(TEST_URL)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("passes revalidate value into fetch options", async () => {
    globalThis.fetch = mockFetchResponse({ ok: true });

    await tmdbFetch(TEST_URL, undefined, 120);

    const [, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(opts.next).toEqual({ revalidate: 120 });
  });

  it("defaults revalidate to 3600 when not provided", async () => {
    globalThis.fetch = mockFetchResponse({ ok: true });

    await tmdbFetch(TEST_URL);

    const [, opts] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(opts.next).toEqual({ revalidate: 3600 });
  });
});
