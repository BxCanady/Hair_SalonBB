import "server-only";
import { createClient } from "@supabase/supabase-js";
import { discoverGoogleImages, TREND_QUERIES } from "./serpApiImages";
import { normalizeSupabaseUrl } from "./supabaseUrl";
import { rankImageResults } from "./trendRanking";

export type TrendingStyle = {
  id: string;
  name: string;
  imageUrl: string | null;
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
    .select("id,name,image_url,source_url,google_position,trend_score,updated_at")
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
    sourceUrl: item.source_url,
    googlePosition: item.google_position,
    trendScore: item.trend_score,
    updatedAt: item.updated_at,
  }));
}

export async function updateTrendingStyles(): Promise<{ searched: number; discovered: number; upserted: number }> {
  const results = await discoverGoogleImages();
  if (results.length === 0) throw new Error("SerpAPI returned no usable Google Images results");

  const rows = rankImageResults(results);
  if (rows.length === 0) throw new Error("SerpAPI results did not match any supported hairstyle");

  const { error } = await getAdminClient()
    .from("trending_styles")
    .upsert(rows, { onConflict: "name" });
  if (error) throw new Error(`Could not upsert trending styles: ${error.message}`);

  return {
    searched: TREND_QUERIES.length,
    discovered: results.length,
    upserted: rows.length,
  };
}
