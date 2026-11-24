import { normalizeSupabaseUrl } from "./supabaseUrl";

export const HAIRSTYLE_BUCKET = "hairstyles";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EXT_BY_MIME = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
type ImageMime = keyof typeof EXT_BY_MIME;

const supabaseUrl = () => normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

/** Public URL prefix that uploaded hairstyle photos live under. */
export const publicPrefix = () => `${supabaseUrl()}/storage/v1/object/public/${HAIRSTYLE_BUCKET}/`;

/** Only same-site /images/ assets or objects in our own hairstyle bucket may be used as a card image. */
export function isTrustedImageUrl(url: string): boolean {
  if (/^\/images\/[\w\-./]+$/.test(url) && !url.includes("..") && !url.includes("//")) return true;
  const prefix = publicPrefix();
  return !!supabaseUrl() && url.startsWith(prefix) && /^[\w-]+\.(jpg|png|webp)$/.test(url.slice(prefix.length));
}

function sniff(bytes: Uint8Array): ImageMime | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 8 && [0x89, 0x50, 0x4e, 0x47].every((b, i) => bytes[i] === b)) return "image/png";
  const tag = (o: number) => String.fromCharCode(...bytes.slice(o, o + 4));
  if (bytes.length > 12 && tag(0) === "RIFF" && tag(8) === "WEBP") return "image/webp";
  return null;
}

/** Checks the declared MIME type, size and actual file signature. Returns the extension or an error message. */
export function validateImage(declaredType: string, bytes: Uint8Array): { ext: string } | { error: string } {
  if (!(declaredType in EXT_BY_MIME)) return { error: "Only JPEG, PNG or WebP images are allowed" };
  if (bytes.byteLength === 0) return { error: "Empty file" };
  if (bytes.byteLength > MAX_IMAGE_BYTES) return { error: "Image must be 5 MB or smaller" };
  const real = sniff(bytes);
  if (!real || real !== declaredType) return { error: "File contents do not match the declared image type" };
  return { ext: EXT_BY_MIME[real] };
}

/** Uploads with the service-role key (server only). A fresh UUID key means existing objects can never be overwritten. */
export async function uploadHairstyleImage(bytes: Uint8Array, mime: string, ext: string): Promise<{ url: string } | { error: string }> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl() || !key) return { error: "Storage is not configured" };
  const name = `${crypto.randomUUID()}.${ext}`;
  const res = await fetch(`${supabaseUrl()}/storage/v1/object/${HAIRSTYLE_BUCKET}/${name}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, apikey: key, "Content-Type": mime, "x-upsert": "false" },
    body: bytes as BodyInit,
  });
  if (!res.ok) return { error: "Upload failed" };
  return { url: `${publicPrefix()}${name}` };
}
