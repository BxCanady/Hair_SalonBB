import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "./db";
import { enrichHairstylesWithImageAlternatives } from "./hairstyleImageCache";

describe("lookbook image cache", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not query Supabase for uncached custom titles", async () => {
    const fetchImpl = vi.fn();
    vi.stubGlobal("fetch", fetchImpl);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");

    const result = await enrichHairstylesWithImageAlternatives(db.hairstyles);

    expect(result).toEqual(db.hairstyles);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("enriches matching canonical hairstyles with cached alternatives", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubGlobal("fetch", vi.fn(async () => Response.json([{
      name: "Stitch Braids",
      thumbnail_url: "https://images.example.com/stitch-thumb.jpg",
      image_candidates: [{
        imageUrl: "https://images.example.com/stitch.jpg",
        thumbnailUrl: null,
        sourceUrl: "https://example.com/stitch",
        sourceName: "Example",
        title: "Stitch Braids hairstyle",
        width: 1200,
        height: 1600,
        relevanceScore: 100,
        usageRights: "commercial-reuse",
      }],
    }])));
    const hairstyle = {
      ...db.hairstyles[0],
      title: "Stitch Braids",
      imageUrl: "https://images.example.com/broken.jpg",
    };

    const [result] = await enrichHairstylesWithImageAlternatives([hairstyle]);

    expect(result.imageAlternativeUrls).toEqual([
      "https://images.example.com/stitch-thumb.jpg",
      "https://images.example.com/stitch.jpg",
    ]);
  });
});
