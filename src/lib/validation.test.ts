import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isTrustedImageUrl, MAX_IMAGE_BYTES, validateImage } from "./storage";
import { parseHairstyle } from "./validate";
import { rateLimit } from "./rateLimit";
import { bookHref } from "./links";

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const jpg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);

describe("validateImage", () => {
  it("accepts real images and returns the extension", () => {
    expect(validateImage("image/png", png)).toEqual({ ext: "png" });
    expect(validateImage("image/jpeg", jpg)).toEqual({ ext: "jpg" });
  });
  it("rejects disallowed MIME types, mismatched content, empty and oversized files", () => {
    expect(validateImage("image/svg+xml", png)).toHaveProperty("error");
    expect(validateImage("image/png", jpg)).toHaveProperty("error");
    expect(validateImage("image/png", new TextEncoder().encode("<script>alert(1)</script>"))).toHaveProperty("error");
    expect(validateImage("image/png", new Uint8Array(0))).toHaveProperty("error");
    const big = new Uint8Array(MAX_IMAGE_BYTES + 1);
    big.set(png);
    expect(validateImage("image/png", big)).toHaveProperty("error");
  });
});

describe("isTrustedImageUrl", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co"));
  afterEach(() => vi.unstubAllEnvs());

  it("allows local images and our own bucket", () => {
    expect(isTrustedImageUrl("/images/hero.png")).toBe(true);
    expect(isTrustedImageUrl("https://proj.supabase.co/storage/v1/object/public/hairstyles/abc-123.webp")).toBe(true);
  });
  it("rejects traversal, foreign hosts, other buckets and nested paths", () => {
    expect(isTrustedImageUrl("/images/../secret.png")).toBe(false);
    expect(isTrustedImageUrl("https://evil.example/x.png")).toBe(false);
    expect(isTrustedImageUrl("https://proj.supabase.co/storage/v1/object/public/other/a.png")).toBe(false);
    expect(isTrustedImageUrl("https://proj.supabase.co/storage/v1/object/public/hairstyles/../a.png")).toBe(false);
    expect(isTrustedImageUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("parseHairstyle", () => {
  const ok = { title: "Locs", description: "d", imageUrl: "/images/hero.png", serviceId: "svc-1", priceCents: 5000, durationMin: 90, isPublished: true, sortOrder: 2 };
  it("accepts valid input", () => expect(parseHairstyle(ok)).toEqual(ok));
  it("normalises an empty service to null", () => expect(parseHairstyle({ ...ok, serviceId: "" })?.serviceId).toBeNull());
  it.each([
    ["blank title", { title: " " }],
    ["untrusted image", { imageUrl: "https://evil.example/a.png" }],
    ["fractional price", { priceCents: 10.5 }],
    ["negative price", { priceCents: -1 }],
    ["tiny duration", { durationMin: 5 }],
    ["non-boolean publish flag", { isPublished: "yes" }],
  ])("rejects %s", (_n, patch) => expect(parseHairstyle({ ...ok, ...patch })).toBeNull());
});

describe("rateLimit", () => {
  it("blocks after the limit and recovers after the window", () => {
    const t = 1_000_000;
    expect([1, 2, 3].map(() => rateLimit("k1", 2, 1000, t))).toEqual([true, true, false]);
    expect(rateLimit("k1", 2, 1000, t + 1001)).toBe(true);
    expect(rateLimit("k2", 2, 1000, t)).toBe(true);
  });
});

describe("bookHref", () => {
  it("preselects the linked service", () => {
    expect(bookHref("svc-style")).toBe("/book?serviceId=svc-style");
    expect(bookHref(null)).toBe("/book");
  });
});
