import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getCachedHairstyleImageCandidates } from "./imageCandidateCache";
import {
  flattenImageCandidateUrls,
  parseHairstyleImageCandidates,
  type HairstyleImageCandidate,
} from "./imageCandidates";
import {
  discoverGoogleImages,
  discoverHairstyleImageCandidates,
  SerpApiRequestError,
  TREND_QUERIES,
} from "./serpApiImages";
import { normalizeSupabaseUrl } from "./supabaseUrl";
import { rankImageResults } from "./trendRanking";

export type TrendingStyle = {
  id: string;
  name: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  imageCandidates: HairstyleImageCandidate[];
  sourceUrl: string | null;
  googlePosition: number | null;
  trendScore: number;
  updatedAt: string;
};

function getPublicClient() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getAdminClient() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getTrendingStyles(): Promise<TrendingStyle[]> {
  const client = getPublicClient();
  if (!client) return [];

  const { data, error } = await client
    .from("trending_styles")
    .select("id,name,image_url,thumbnail_url,image_candidates,source_url,google_position,trend_score,updated_at")
    .order("trend_score", { ascending: false })
    .limit(12);
  if (error) {
    console.error("Could not load trending styles.", error.message);
    return [];
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    imageUrl: item.image_url,
    thumbnailUrl: item.thumbnail_url,
    imageCandidates: parseHairstyleImageCandidates(item.image_candidates),
    sourceUrl: item.source_url,
    googlePosition: item.google_position,
    trendScore: item.trend_score,
    updatedAt: item.updated_at,
  }));
}

export async function updateTrendingStyles(): Promise<{
  searched: number;
  discovered: number;
  upserted: number;
  candidateRefreshes: number;
  candidateCacheHits: number;
  candidateWarnings: number;
}> {
  const results = await discoverGoogleImages();
  if (results.length === 0) throw new Error("SerpAPI returned no usable Google Images results");

  const rows = rankImageResults(results);
  if (rows.length === 0) throw new Error("SerpAPI results did not match any supported hairstyle");

  const adminClient = getAdminClient();
  const { data: cachedRows, error: cacheError } = await adminClient
    .from("trending_styles")
    .select("name,image_candidates,image_candidates_updated_at")
    .in("name", rows.map((row) => row.name));
  if (cacheError) throw new Error(`Could not load cached hairstyle images: ${cacheError.message}`);

  const cacheByTitle = new Map((cachedRows ?? []).map((row) => [row.name, row]));
  const configuredHours = Number(process.env.SERPAPI_IMAGE_CACHE_TTL_HOURS ?? 168);
  const ttlMs = (Number.isFinite(configuredHours) ? Math.max(1, configuredHours) : 168) * 60 * 60 * 1000;
  const candidateRows = [];
  const claimedImageUrls = new Set(
    rows.flatMap((row) => [row.image_url, row.thumbnail_url]).filter((url): url is string => Boolean(url)),
  );
  let candidateRefreshes = 0;
  let candidateCacheHits = 0;
  let candidateWarnings = 0;
  let rateLimited = false;

  for (const row of rows) {
    const cached = cacheByTitle.get(row.name);
    try {
      const resolved = rateLimited
        ? {
            candidates: parseHairstyleImageCandidates(cached?.image_candidates),
            refreshed: false,
            cachedAt: cached?.image_candidates_updated_at ?? null,
            error: new Error("Alternative image discovery paused after SerpApi rate limiting"),
          }
        : await getCachedHairstyleImageCandidates({
            title: row.name,
            candidates: cached?.image_candidates,
            cachedAt: cached?.image_candidates_updated_at,
            ttlMs,
            discover: () => discoverHairstyleImageCandidates(row.name),
          });

      const candidates = resolved.candidates.filter((candidate) => {
        const candidateUrls = flattenImageCandidateUrls([candidate]);
        if (candidateUrls.some((url) => claimedImageUrls.has(url))) return false;
        claimedImageUrls.add(candidate.imageUrl);
        return true;
      });
      if (candidates.length > 0) {
        for (const candidateUrl of flattenImageCandidateUrls(candidates)) {
          if (candidateUrl) claimedImageUrls.add(candidateUrl);
        }
      }
      if (resolved.refreshed) candidateRefreshes += 1;
      else candidateCacheHits += 1;
      if (resolved.error) {
        candidateWarnings += 1;
        if (resolved.error instanceof SerpApiRequestError && resolved.error.status === 429) rateLimited = true;
        console.warn(`Could not refresh images for "${row.name}"; using cached candidates.`, resolved.error.message);
      }
      candidateRows.push({
        ...row,
        image_candidates: candidates,
        image_candidates_updated_at: resolved.cachedAt ?? null,
      });
    } catch (error) {
      candidateWarnings += 1;
      if (error instanceof SerpApiRequestError && error.status === 429) rateLimited = true;
      console.warn(
        `Could not discover alternative images for "${row.name}".`,
        error instanceof Error ? error.message : String(error),
      );
      candidateRows.push({
        ...row,
        image_candidates: [],
        image_candidates_updated_at: cached?.image_candidates_updated_at ?? null,
      });
    }
  }

  const { error } = await adminClient
    .from("trending_styles")
    .upsert(candidateRows, { onConflict: "name" });
  if (error) throw new Error(`Could not upsert trending styles: ${error.message}`);

  return {
    searched: TREND_QUERIES.length,
    discovered: results.length,
    upserted: candidateRows.length,
    candidateRefreshes,
    candidateCacheHits,
    candidateWarnings,
  };
}
