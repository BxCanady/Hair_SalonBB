import { describe, expect, it } from "vitest";
import {
  buildFallbackImageSources,
  parseHairstyleImageCandidates,
  rankHairstyleImageCandidates,
} from "./imageCandidates";

const image = "https://images.example.com/stitch.jpg";
const thumbnail = "https://images.example.com/stitch-thumb.jpg";
const source = "https://example.com/stitch-braids";

describe("hairstyle image candidates", () => {
  it("keeps a working primary image first", () => {
    expect(buildFallbackImageSources({
      primaryUrl: image,
      originalThumbnailUrl: thumbnail,
      alternativeUrls: ["https://images.example.com/alternative.jpg"],
      title: "Stitch Braids",
    })).toEqual([
      image,
      thumbnail,
      "https://images.example.com/alternative.jpg",
    ]);
  });

  it("deduplicates primary, thumbnail and alternative URLs", () => {
    expect(buildFallbackImageSources({
      primaryUrl: image,
      originalThumbnailUrl: image,
      alternativeUrls: [thumbnail, image, thumbnail],
      title: "Stitch Braids",
    })).toEqual([image, thumbnail]);
  });

  it("falls through multiple failures to a title-specific local image", () => {
    expect(buildFallbackImageSources({
      primaryUrl: "javascript:alert(1)",
      originalThumbnailUrl: "https://127.0.0.1/private.jpg",
      alternativeUrls: ["invalid", "http://example.com/not-secure.jpg"],
      title: "Micro Locs",
    })).toEqual(["/images/styles/micro-locs.jpg"]);
  });

  it("returns a neutral candidate list when every source is unavailable", () => {
    expect(buildFallbackImageSources({
      primaryUrl: null,
      alternativeUrls: [],
      title: "Unknown Style",
    })).toEqual([]);
  });

  it("changes local fallback sources when the hairstyle title changes", () => {
    expect(buildFallbackImageSources({ title: "Micro Locs" })).toEqual(["/images/styles/micro-locs.jpg"]);
    expect(buildFallbackImageSources({ title: "Short Hair Gripper" })).toEqual(["/images/styles/short-hair.jpg"]);
  });

  it("ranks relevant, high-quality candidates and rejects unrelated or promotional graphics", () => {
    const ranked = rankHairstyleImageCandidates("Stitch Braids", [
      {
        title: "Stitch Braids hairstyle",
        original: "https://images.example.com/primary.jpg",
        link: "https://example.com/article",
        originalWidth: 1200,
        originalHeight: 1600,
        position: 1,
      },
      {
        title: "Stitch Braids sale banner",
        original: "https://images.example.com/banner.jpg",
        link: "https://example.com/banner",
        originalWidth: 2000,
        originalHeight: 2000,
        position: 2,
      },
      {
        title: "Butterfly Locs inspiration",
        original: "https://images.example.com/locs.jpg",
        link: "https://example.com/locs",
        originalWidth: 2000,
        originalHeight: 2000,
        position: 3,
      },
      {
        title: "Beautiful Stitch Braids",
        original: "https://images.example.com/small.jpg",
        link: "https://example.com/other",
        originalWidth: 400,
        originalHeight: 500,
        position: 4,
      },
      {
        title: "Stitch Braids hairstyle",
        original: "https://images.example.com/primary.jpg",
        link: "https://example.com/duplicate",
        originalWidth: 1200,
        originalHeight: 1600,
        position: 5,
      },
    ]);

    expect(ranked.map((candidate) => candidate.imageUrl)).toEqual([
      "https://images.example.com/primary.jpg",
      "https://images.example.com/small.jpg",
    ]);
    expect(ranked.every((candidate) => candidate.usageRights === "commercial-reuse")).toBe(true);
  });

  it("removes invalid and duplicate cached candidates", () => {
    const candidate = {
      imageUrl: image,
      thumbnailUrl: thumbnail,
      sourceUrl: source,
      sourceName: "Example Salon",
      title: "Stitch Braids",
      width: 800,
      height: 1200,
      relevanceScore: 100,
      usageRights: "commercial-reuse",
    };
    expect(parseHairstyleImageCandidates([
      candidate,
      candidate,
      { ...candidate, imageUrl: "javascript:alert(1)" },
    ])).toEqual([candidate]);
  });
});
