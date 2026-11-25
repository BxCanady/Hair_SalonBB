import { describe, expect, it, vi } from "vitest";
import { getCachedHairstyleImageCandidates } from "./imageCandidateCache";
import type { HairstyleImageCandidate } from "./imageCandidates";

const candidate: HairstyleImageCandidate = {
  imageUrl: "https://images.example.com/knotless.jpg",
  thumbnailUrl: null,
  sourceUrl: "https://example.com/knotless",
  sourceName: "Example Salon",
  title: "Knotless Braids hairstyle",
  width: 1200,
  height: 1600,
  relevanceScore: 100,
  usageRights: "commercial-reuse",
};

describe("hairstyle image candidate cache", () => {
  it("reuses fresh candidates without requesting SerpApi", async () => {
    const discover = vi.fn(async () => []);
    const result = await getCachedHairstyleImageCandidates({
      title: "Knotless Braids",
      candidates: [candidate],
      cachedAt: "2026-01-02T00:00:00.000Z",
      ttlMs: 60_000,
      now: Date.parse("2026-01-02T00:00:30.000Z"),
      discover,
    });

    expect(result.candidates).toEqual([candidate]);
    expect(result.refreshed).toBe(false);
    expect(discover).not.toHaveBeenCalled();
  });

  it("refreshes expired cache entries", async () => {
    const replacement = { ...candidate, imageUrl: "https://images.example.com/new.jpg" };
    const result = await getCachedHairstyleImageCandidates({
      title: "Knotless Braids",
      candidates: [candidate],
      cachedAt: "2026-01-01T00:00:00.000Z",
      ttlMs: 1_000,
      now: Date.parse("2026-01-02T00:00:00.000Z"),
      discover: async () => [replacement],
    });

    expect(result.candidates).toEqual([replacement]);
    expect(result.refreshed).toBe(true);
  });

  it("reuses the same in-flight discovery for normalized titles", async () => {
    let resolve!: (value: HairstyleImageCandidate[]) => void;
    const discover = vi.fn(() => new Promise<HairstyleImageCandidate[]>((done) => {
      resolve = done;
    }));
    const first = getCachedHairstyleImageCandidates({
      title: "Knotless Braids",
      candidates: [],
      ttlMs: 1_000,
      discover,
    });
    const second = getCachedHairstyleImageCandidates({
      title: "  KNOTLESS   BRAIDS ",
      candidates: [],
      ttlMs: 1_000,
      discover,
    });

    expect(discover).toHaveBeenCalledTimes(1);
    resolve([candidate]);
    await expect(first).resolves.toMatchObject({ candidates: [candidate], refreshed: true });
    await expect(second).resolves.toMatchObject({ candidates: [candidate], refreshed: true });
  });

  it("keeps stale candidates when a refresh fails", async () => {
    const result = await getCachedHairstyleImageCandidates({
      title: "Knotless Braids",
      candidates: [candidate],
      cachedAt: "2026-01-01T00:00:00.000Z",
      ttlMs: 1,
      now: Date.parse("2026-01-02T00:00:00.000Z"),
      discover: async () => {
        throw new Error("rate limited");
      },
    });

    expect(result.candidates).toEqual([candidate]);
    expect(result.refreshed).toBe(false);
    expect(result.error?.message).toBe("rate limited");
  });
});
