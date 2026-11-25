import { createClient } from "@supabase/supabase-js";
import {
  flattenImageCandidateUrls,
  normalizeHairstyleTitle,
  parseHairstyleImageCandidates,
} from "./imageCandidates";
import { normalizeSupabaseUrl } from "./supabaseUrl";
import { CANONICAL_STYLES } from "./trendRanking";
import type { Hairstyle } from "./types";

const canonicalNames = new Map(
  CANONICAL_STYLES.map(({ name }) => [normalizeHairstyleTitle(name), name]),
);

export async function enrichHairstylesWithImageAlternatives(
  hairstyles: Hairstyle[],
): Promise<Hairstyle[]> {
  const requestedNames = [...new Set(hairstyles.flatMap(({ title }) => {
    const name = canonicalNames.get(normalizeHairstyleTitle(title));
    return name ? [name] : [];
  }))];
  if (requestedNames.length === 0) return hairstyles;

  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return hairstyles;

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client
    .from("trending_styles")
    .select("name,thumbnail_url,image_candidates")
    .in("name", requestedNames);
  if (error) {
    console.warn("Could not load cached hairstyle image alternatives.", error.message);
    return hairstyles;
  }

  const alternativesByTitle = new Map((data ?? []).map((row) => {
    const candidates = parseHairstyleImageCandidates(row.image_candidates);
    const alternatives = [...new Set([
      row.thumbnail_url,
      ...flattenImageCandidateUrls(candidates),
    ].filter((url): url is string => Boolean(url)))];
    return [normalizeHairstyleTitle(row.name), alternatives];
  }));

  return hairstyles.map((hairstyle) => {
    const imageAlternativeUrls = alternativesByTitle.get(normalizeHairstyleTitle(hairstyle.title));
    return imageAlternativeUrls?.length ? { ...hairstyle, imageAlternativeUrls } : hairstyle;
  });
}
