import "server-only";
import { isAllowedTrendImage } from "./trendRanking";

export const TREND_QUERIES = [
  "trending black hairstyles",
  "knotless braids",
  "boho braids",
  "fulani braids",
  "stitch braids",
  "butterfly locs",
  "soft locs",
  "passion twists",
  "silk press",
  "micro twists",
] as const;

export type GoogleImageResult = {
  title: string;
  imageUrl: string;
  sourceUrl: string;
  position: number;
  query: string;
};

type SerpApiImage = {
  position?: number;
  title?: string;
  original?: string;
  thumbnail?: string;
  link?: string;
  source?: string;
};

type SerpApiImageResponse = {
  images_results?: SerpApiImage[];
  error?: string;
};

export async function discoverGoogleImages(): Promise<GoogleImageResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) throw new Error("SERPAPI_API_KEY is not configured");

  const discovered: GoogleImageResult[] = [];
  for (const query of TREND_QUERIES) {
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_images");
    url.searchParams.set("q", query);
    url.searchParams.set("location", "United States");
    url.searchParams.set("hl", "en");
    url.searchParams.set("safe", "active");
    url.searchParams.set("num", "20");
    url.searchParams.set("api_key", apiKey);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`SerpAPI image search failed for "${query}" with status ${response.status}`);
    }

    const data = (await response.json()) as SerpApiImageResponse;
    if (data.error) throw new Error(`SerpAPI image search failed for "${query}": ${data.error}`);

    for (const image of data.images_results ?? []) {
      const imageUrl = image.original || image.thumbnail;
      const sourceUrl = image.link;
      if (!imageUrl || !sourceUrl || !image.title?.trim()) continue;
      if (!isAllowedTrendImage({ imageUrl, sourceUrl })) continue;
      discovered.push({
        title: image.title.trim(),
        imageUrl,
        sourceUrl,
        position: Math.max(1, Math.min(100, image.position ?? discovered.length + 1)),
        query,
      });
    }
  }

  return discovered;
}
