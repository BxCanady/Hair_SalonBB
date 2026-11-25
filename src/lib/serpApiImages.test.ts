import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  discoverHairstyleImageCandidates,
  fetchGoogleImageResults,
  SerpApiRequestError,
} from "./serpApiImages";

describe("SerpApi image discovery", () => {
  const originalKey = process.env.SERPAPI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) delete process.env.SERPAPI_API_KEY;
    else process.env.SERPAPI_API_KEY = originalKey;
  });

  it("fails explicitly when the API credential is missing", async () => {
    delete process.env.SERPAPI_API_KEY;
    await expect(fetchGoogleImageResults("Stitch Braids hairstyle")).rejects.toThrow(
      "SERPAPI_API_KEY is not configured",
    );
  });

  it("reports rate limiting with retry metadata", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      void input;
      return new Response(null, {
        status: 429,
        headers: { "retry-after": "30" },
      });
    });

    const error = await fetchGoogleImageResults(
      "Stitch Braids hairstyle",
      { commercialReuse: true },
      { apiKey: "test-key", fetchImpl },
    ).catch((failure) => failure as SerpApiRequestError);

    expect(error).toBeInstanceOf(SerpApiRequestError);
    expect(error).toMatchObject({ status: 429, retryAfterSeconds: 30 });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const requestUrl = new URL(String(fetchImpl.mock.calls[0][0]));
    expect(requestUrl.searchParams.get("licenses")).toBe("fmc");
    expect(requestUrl.searchParams.get("num")).toBe("20");
  });

  it("uses a title-specific, commercially reusable five-result search", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      void input;
      return Response.json({ images_results: [] });
    });

    await discoverHairstyleImageCandidates("Micro Twists", {
      apiKey: "test-key",
      fetchImpl,
    });

    const requestUrl = new URL(String(fetchImpl.mock.calls[0][0]));
    expect(requestUrl.searchParams.get("q")).toBe("Micro Twists natural hairstyle");
    expect(requestUrl.searchParams.get("licenses")).toBe("fmc");
    expect(requestUrl.searchParams.get("num")).toBe("5");
  });

  it("converts request failures into a safe server error", async () => {
    await expect(fetchGoogleImageResults(
      "Micro Twists natural hairstyle",
      {},
      {
        apiKey: "test-key",
        fetchImpl: vi.fn(async (input: RequestInfo | URL) => {
          void input;
          throw new Error("network down");
        }),
      },
    )).rejects.toMatchObject({
      name: "SerpApiRequestError",
      status: 502,
      message: "SerpApi image search request failed",
    });
  });
});
