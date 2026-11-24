import type { GoogleImageResult } from "./serpApiImages";

export const CANONICAL_STYLES = [
  { name: "Knotless Braids", terms: ["knotless"] },
  { name: "Boho Braids", terms: ["boho", "bohemian"] },
  { name: "Fulani Braids", terms: ["fulani"] },
  { name: "Stitch Braids", terms: ["stitch braid"] },
  { name: "Butterfly Locs", terms: ["butterfly loc"] },
  { name: "Soft Locs", terms: ["soft loc"] },
  { name: "Passion Twists", terms: ["passion twist"] },
  { name: "Silk Press", terms: ["silk press"] },
  { name: "Micro Twists", terms: ["micro twist"] },
] as const;

export type RankedStyle = {
  name: string;
  image_url: string | null;
  source_url: string | null;
  google_position: number;
  trend_score: number;
  updated_at: string;
};

export function isAllowedTrendImage(
  result: Pick<GoogleImageResult, "imageUrl" | "sourceUrl">,
): boolean {
  try {
    const hosts = [new URL(result.imageUrl).hostname, new URL(result.sourceUrl).hostname]
      .map((host) => host.toLowerCase());
    return hosts.every(
      (host) => !host.endsWith("pinterest.com") && !host.endsWith("pinimg.com"),
    );
  } catch {
    return false;
  }
}

export function normalizeStyleName(result: Pick<GoogleImageResult, "title" | "query">): string | null {
  const text = `${result.query} ${result.title}`.toLowerCase();
  return CANONICAL_STYLES.find(({ terms }) => terms.some((term) => text.includes(term)))?.name ?? null;
}

export function calculateTrendScore(position: number, occurrenceCount: number): number {
  return Math.max(0, 100 - Math.max(1, position)) + Math.max(0, occurrenceCount) * 10;
}

export function rankImageResults(results: GoogleImageResult[], updatedAt = new Date().toISOString()): RankedStyle[] {
  const grouped = new Map<string, GoogleImageResult[]>();
  for (const result of results) {
    const name = normalizeStyleName(result);
    if (!name) continue;
    const entries = grouped.get(name) ?? [];
    entries.push(result);
    grouped.set(name, entries);
  }

  return [...grouped.entries()]
    .map(([name, matches]) => {
      const sorted = [...matches].sort((a, b) => a.position - b.position);
      const best = sorted[0];
      return {
        name,
        image_url: best?.imageUrl ?? null,
        source_url: best?.sourceUrl ?? null,
        google_position: best?.position ?? 100,
        trend_score: calculateTrendScore(best?.position ?? 100, matches.length),
        updated_at: updatedAt,
      };
    })
    .sort((a, b) => b.trend_score - a.trend_score || a.google_position - b.google_position);
}
