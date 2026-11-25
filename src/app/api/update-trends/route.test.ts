import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateTrendingStyles } = vi.hoisted(() => ({
  updateTrendingStyles: vi.fn(),
}));
vi.mock("@/lib/trendingStyles", () => ({ updateTrendingStyles }));

import { GET } from "./route";

describe("GET /api/update-trends", () => {
  beforeEach(() => {
    updateTrendingStyles.mockReset();
    delete process.env.CRON_SECRET;
  });

  it("preserves bearer authentication", async () => {
    process.env.CRON_SECRET = "secret";
    const response = await GET(new Request("http://localhost/api/update-trends"));

    expect(response.status).toBe(401);
    expect(updateTrendingStyles).not.toHaveBeenCalled();
  });

  it("returns cache metrics after an authenticated refresh", async () => {
    process.env.CRON_SECRET = "secret";
    updateTrendingStyles.mockResolvedValue({
      searched: 10,
      discovered: 90,
      upserted: 9,
      candidateRefreshes: 3,
      candidateCacheHits: 6,
      candidateWarnings: 0,
    });

    const response = await GET(new Request("http://localhost/api/update-trends", {
      headers: { authorization: "Bearer secret" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      candidateRefreshes: 3,
      candidateCacheHits: 6,
    });
  });
});
