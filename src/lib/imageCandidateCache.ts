import {
  normalizeHairstyleTitle,
  parseHairstyleImageCandidates,
  type HairstyleImageCandidate,
} from "./imageCandidates";

type CandidateCacheOptions = {
  title: string;
  candidates: unknown;
  cachedAt?: string | null;
  ttlMs: number;
  now?: number;
  discover: () => Promise<HairstyleImageCandidate[]>;
};

type CandidateCacheResult = {
  candidates: HairstyleImageCandidate[];
  refreshed: boolean;
  cachedAt: string | null;
  error?: Error;
};

const inFlight = new Map<string, Promise<CandidateCacheResult>>();

export async function getCachedHairstyleImageCandidates(
  options: CandidateCacheOptions,
): Promise<CandidateCacheResult> {
  const candidates = parseHairstyleImageCandidates(options.candidates);
  const now = options.now ?? Date.now();
  const cachedAtMs = options.cachedAt ? Date.parse(options.cachedAt) : Number.NaN;
  const isFresh = candidates.length > 0 && Number.isFinite(cachedAtMs) && now - cachedAtMs < options.ttlMs;
  if (isFresh) {
    return { candidates, refreshed: false, cachedAt: options.cachedAt ?? null };
  }

  const key = normalizeHairstyleTitle(options.title);
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = (async (): Promise<CandidateCacheResult> => {
    try {
      const discovered = parseHairstyleImageCandidates(await options.discover());
      if (discovered.length === 0) {
        const error = new Error(`No relevant licensed images were found for "${options.title}"`);
        if (candidates.length > 0) {
          return { candidates, refreshed: false, cachedAt: options.cachedAt ?? null, error };
        }
        throw error;
      }
      return {
        candidates: discovered,
        refreshed: true,
        cachedAt: new Date(now).toISOString(),
      };
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      if (candidates.length > 0) {
        return { candidates, refreshed: false, cachedAt: options.cachedAt ?? null, error: failure };
      }
      throw failure;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, request);
  return request;
}
