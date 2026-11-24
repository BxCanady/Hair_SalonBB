import { describe, expect, it } from "vitest";
import { calculateTrendScore, isAllowedTrendImage, normalizeStyleName, rankImageResults } from "./trendRanking";

describe("SerpAPI trend ranking", () => {
  it("normalizes known hairstyle names", () => {
    expect(normalizeStyleName({ query: "knotless braids", title: "30 Knotless Ideas" })).toBe("Knotless Braids");
    expect(normalizeStyleName({ query: "unrelated", title: "Silk Press Inspiration" })).toBe("Silk Press");
    expect(normalizeStyleName({ query: "generic", title: "Hair ideas" })).toBeNull();
  });

  it("weights result position and occurrence frequency", () => {
    expect(calculateTrendScore(1, 3)).toBe(129);
    expect(calculateTrendScore(20, 1)).toBe(90);
    expect(calculateTrendScore(150, 0)).toBe(0);
  });

  it("deduplicates by hairstyle and keeps the best-ranked image", () => {
    const rows = rankImageResults([
      { title: "Knotless braids look", query: "knotless braids", imageUrl: "a", sourceUrl: "source-a", position: 8 },
      { title: "More knotless braids", query: "knotless braids", imageUrl: "b", sourceUrl: "source-b", position: 2 },
      { title: "Boho braid styles", query: "boho braids", imageUrl: "c", sourceUrl: "source-c", position: 5 },
    ], "2026-01-01T00:00:00.000Z");

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: "Knotless Braids", image_url: "b", google_position: 2, trend_score: 118 });
    expect(rows[1]).toMatchObject({ name: "Boho Braids", google_position: 5, trend_score: 105 });
  });

  it("rejects Pinterest-hosted image and source results", () => {
    expect(isAllowedTrendImage({
      imageUrl: "https://i.pinimg.com/example.jpg",
      sourceUrl: "https://www.pinterest.com/pin/123/",
    })).toBe(false);
    expect(isAllowedTrendImage({
      imageUrl: "https://images.example.com/style.jpg",
      sourceUrl: "https://example.com/style",
    })).toBe(true);
  });
});
