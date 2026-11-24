export function normalizeSupabaseUrl(value: string | undefined): string {
  const url = value?.trim().replace(/\/$/, "") ?? "";
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}
