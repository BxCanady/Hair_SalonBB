export type HairstyleImageCandidate = {
  imageUrl: string;
  thumbnailUrl: string | null;
  sourceUrl: string;
  sourceName: string | null;
  title: string;
  width: number | null;
  height: number | null;
  relevanceScore: number;
  usageRights: "commercial-reuse";
};

export type SerpApiImageResult = {
  position?: number;
  title?: string;
  original?: string;
  thumbnail?: string;
  link?: string;
  source?: string;
  originalWidth?: number;
  originalHeight?: number;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
};

const STYLE_TERMS = [
  "knotless braids",
  "boho braids",
  "bohemian braids",
  "fulani braids",
  "stitch braids",
  "butterfly locs",
  "soft locs",
  "passion twists",
  "silk press",
  "micro twists",
];

const PROMOTIONAL_GRAPHIC = /\b(advertisement|banner|coupon|flyer|infographic|logo|meme|sale|template)\b/i;
const NON_RELEVANT_HOST = /(^|\.)pinterest\.com$|(^|\.)pinimg\.com$/i;

export function normalizeHairstyleTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isSafeImageUrl(value: string): boolean {
  if (value.startsWith("/images/") && !value.includes("..")) return true;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (url.port && url.port !== "443") return false;

    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) ||
      host.includes(":")
    ) {
      return false;
    }
    return !NON_RELEVANT_HOST.test(host);
  } catch {
    return false;
  }
}

export function buildHairstyleSearchQuery(title: string): string {
  const normalized = normalizeHairstyleTitle(title);
  if (/\b(micro twists?|micro locs?)\b/.test(normalized)) {
    return `${title.trim()} natural hairstyle`;
  }
  return `${title.trim()} hairstyle`;
}

export function getLocalHairstyleImage(title: string): string | undefined {
  const normalized = normalizeHairstyleTitle(title);
  if (normalized === "micro locs") return "/images/styles/micro-locs.jpg";
  if (normalized === "custom braided perfection" || normalized === "custom braids") {
    return "/images/styles/custom-braids.jpg";
  }
  if (normalized === "short hair gripper") return "/images/styles/short-hair.jpg";
  return undefined;
}

function sourceTrustScore(sourceUrl: string): number {
  const host = new URL(sourceUrl).hostname.toLowerCase();
  if (host.endsWith(".edu") || host.endsWith(".gov")) return 6;
  if (host.startsWith("commons.") || host.endsWith("wikimedia.org")) return 8;
  if (host.endsWith("instagram.com") || host.endsWith("facebook.com")) return -2;
  return 2;
}

function relevanceScore(title: string, candidateTitle: string): number {
  const normalizedTitle = normalizeHairstyleTitle(title);
  const normalizedCandidate = normalizeHairstyleTitle(candidateTitle);
  if (!normalizedTitle || !normalizedCandidate || PROMOTIONAL_GRAPHIC.test(candidateTitle)) return 0;

  const titleWords = normalizedTitle
    .split(" ")
    .filter((word) => word.length > 2 && !["hair", "hairstyle", "natural", "style", "styles"].includes(word));
  const matchedWords = titleWords.filter((word) => normalizedCandidate.includes(word)).length;
  const exactMatch = normalizedCandidate.includes(normalizedTitle);
  const matchingRatio = titleWords.length === 0 ? 0 : matchedWords / titleWords.length;
  const conflictingStyle = STYLE_TERMS.some(
    (style) => style !== normalizedTitle && normalizedCandidate.includes(style) && !normalizedTitle.includes(style),
  );
  if (conflictingStyle || matchingRatio < 0.5) return 0;

  return (exactMatch ? 60 : 0) + Math.round(matchingRatio * 35) + 5;
}

export function rankHairstyleImageCandidates(
  hairstyleTitle: string,
  results: SerpApiImageResult[],
  limit = 5,
): HairstyleImageCandidate[] {
  const seen = new Set<string>();
  const ranked = results
    .map((result): HairstyleImageCandidate | null => {
      const imageUrl = result.original || result.thumbnail;
      if (!imageUrl || !result.link || !result.title || !isSafeImageUrl(imageUrl) || !isSafeImageUrl(result.link)) {
        return null;
      }

      const relevance = relevanceScore(hairstyleTitle, result.title);
      if (relevance === 0) return null;

      const thumbnailUrl =
        result.thumbnail && result.thumbnail !== imageUrl && isSafeImageUrl(result.thumbnail)
          ? result.thumbnail
          : null;
      const width = result.originalWidth ?? result.thumbnailWidth ?? null;
      const height = result.originalHeight ?? result.thumbnailHeight ?? null;
      const pixels = width && height ? width * height : 0;
      const quality = pixels >= 1_000_000 ? 18 : pixels >= 400_000 ? 12 : pixels > 0 ? 5 : 0;
      const score = relevance + quality + sourceTrustScore(result.link) - Math.max(0, (result.position ?? 100) - 1) * 0.05;

      return {
        imageUrl,
        thumbnailUrl,
        sourceUrl: result.link,
        sourceName: result.source?.trim() || new URL(result.link).hostname,
        title: result.title.trim(),
        width,
        height,
        relevanceScore: score,
        usageRights: "commercial-reuse" as const,
      };
    })
    .filter((candidate): candidate is HairstyleImageCandidate => candidate !== null)
    .sort((a, b) => b.relevanceScore - a.relevanceScore || a.title.localeCompare(b.title))
    .filter((candidate) => {
      if (seen.has(candidate.imageUrl)) return false;
      seen.add(candidate.imageUrl);
      return true;
    });

  return ranked.slice(0, Math.max(0, limit));
}

export function parseHairstyleImageCandidates(value: unknown): HairstyleImageCandidate[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Partial<HairstyleImageCandidate>;
    if (
      typeof candidate.imageUrl !== "string" ||
      typeof candidate.sourceUrl !== "string" ||
      typeof candidate.title !== "string" ||
      !isSafeImageUrl(candidate.imageUrl) ||
      !isSafeImageUrl(candidate.sourceUrl) ||
      seen.has(candidate.imageUrl)
    ) {
      return [];
    }
    seen.add(candidate.imageUrl);
    return [{
      imageUrl: candidate.imageUrl,
      thumbnailUrl:
        typeof candidate.thumbnailUrl === "string" && isSafeImageUrl(candidate.thumbnailUrl)
          ? candidate.thumbnailUrl
          : null,
      sourceUrl: candidate.sourceUrl,
      sourceName: typeof candidate.sourceName === "string" ? candidate.sourceName : null,
      title: candidate.title,
      width: typeof candidate.width === "number" ? candidate.width : null,
      height: typeof candidate.height === "number" ? candidate.height : null,
      relevanceScore: typeof candidate.relevanceScore === "number" ? candidate.relevanceScore : 0,
      usageRights: "commercial-reuse" as const,
    }];
  });
}

export function buildFallbackImageSources({
  primaryUrl,
  originalThumbnailUrl,
  alternativeUrls = [],
  title,
  localImageUrl,
}: {
  primaryUrl?: string | null;
  originalThumbnailUrl?: string | null;
  alternativeUrls?: Array<string | null | undefined>;
  title: string;
  localImageUrl?: string | null;
}): string[] {
  return [...new Set([
    primaryUrl,
    originalThumbnailUrl,
    ...alternativeUrls,
    localImageUrl ?? getLocalHairstyleImage(title),
  ].filter((url): url is string => typeof url === "string" && isSafeImageUrl(url)))];
}

export function flattenImageCandidateUrls(candidates: HairstyleImageCandidate[]): string[] {
  return candidates.flatMap((candidate) =>
    candidate.thumbnailUrl ? [candidate.imageUrl, candidate.thumbnailUrl] : [candidate.imageUrl],
  );
}
