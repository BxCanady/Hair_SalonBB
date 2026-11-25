import "server-only";
import { isAllowedTrendImage } from "./trendRanking";
import {
  buildHairstyleSearchQuery,
  rankHairstyleImageCandidates,
  type HairstyleImageCandidate,
  type SerpApiImageResult,
} from "./imageCandidates";

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
  thumbnailUrl?: string | null;
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
  original_width?: number;
  original_height?: number;
  thumbnail_width?: number;
  thumbnail_height?: number;
};

type SerpApiImageResponse = {
  images_results?: SerpApiImage[];
  error?: string;
};

type SerpApiRequestOptions = {
  apiKey?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export class SerpApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "SerpApiRequestError";
  }
}

function requestConfiguration(options: SerpApiRequestOptions = {}) {
  const apiKey = options.apiKey ?? process.env.SERPAPI_API_KEY;
  if (!apiKey) throw new Error("SERPAPI_API_KEY is not configured");
  const configuredTimeout = Number(process.env.SERPAPI_REQUEST_TIMEOUT_MS ?? 8_000);
  return {
    apiKey,
    timeoutMs: options.timeoutMs ?? (Number.isFinite(configuredTimeout) ? configuredTimeout : 8_000),
    fetchImpl: options.fetchImpl ?? fetch,
  };
}

export async function fetchGoogleImageResults(
  query: string,
  { num = 20, commercialReuse = false }: { num?: number; commercialReuse?: boolean } = {},
  options: SerpApiRequestOptions = {},
): Promise<SerpApiImageResult[]> {
  const { apiKey, timeoutMs, fetchImpl } = requestConfiguration(options);
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_images");
  url.searchParams.set("q", query);
  url.searchParams.set("location", "United States");
  url.searchParams.set("hl", "en");
  url.searchParams.set("safe", "active");
  url.searchParams.set("num", String(Math.max(1, Math.min(num, 20))));
  if (commercialReuse) {
    url.searchParams.set("licenses", "fmc");
    url.searchParams.set("image_type", "photo");
    url.searchParams.set("imgsz", "l");
  }
  url.searchParams.set("api_key", apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      const retryAfter = Number(response.headers.get("retry-after"));
      throw new SerpApiRequestError(
        `SerpApi image search failed with status ${response.status}`,
        response.status,
        Number.isFinite(retryAfter) ? Math.max(0, retryAfter) : null,
      );
    }

    const data = (await response.json()) as SerpApiImageResponse;
    if (data.error) throw new Error("SerpApi returned an image search error");
    return (data.images_results ?? []).map((image) => ({
      position: image.position,
      title: image.title,
      original: image.original,
      thumbnail: image.thumbnail,
      link: image.link,
      source: image.source,
      originalWidth: image.original_width,
      originalHeight: image.original_height,
      thumbnailWidth: image.thumbnail_width,
      thumbnailHeight: image.thumbnail_height,
    }));
  } catch (error) {
    if (error instanceof SerpApiRequestError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new SerpApiRequestError(`SerpApi image search timed out after ${timeoutMs}ms`, 504);
    }
    throw new SerpApiRequestError(
      "SerpApi image search request failed",
      502,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function discoverGoogleImages(): Promise<GoogleImageResult[]> {
  const discovered: GoogleImageResult[] = [];
  for (const query of TREND_QUERIES) {
    const images = await fetchGoogleImageResults(query);
    for (const image of images) {
      const imageUrl = image.original || image.thumbnail;
      const sourceUrl = image.link;
      if (!imageUrl || !sourceUrl || !image.title?.trim()) continue;
      if (!isAllowedTrendImage({ imageUrl, sourceUrl })) continue;
      discovered.push({
        title: image.title.trim(),
        imageUrl,
        thumbnailUrl: image.thumbnail && image.thumbnail !== imageUrl ? image.thumbnail : null,
        sourceUrl,
        position: Math.max(1, Math.min(100, image.position ?? discovered.length + 1)),
        query,
      });
    }
  }

  return discovered;
}

export async function discoverHairstyleImageCandidates(
  title: string,
  options: SerpApiRequestOptions = {},
): Promise<HairstyleImageCandidate[]> {
  const results = await fetchGoogleImageResults(
    buildHairstyleSearchQuery(title),
    { num: 5, commercialReuse: true },
    options,
  );
  return rankHairstyleImageCandidates(title, results);
}
