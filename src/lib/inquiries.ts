import "server-only";
import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseUrl } from "./supabaseUrl";
import type { StyleInquiry, StyleInquiryStatus } from "./types";

export type NewStyleInquiry = Pick<
  StyleInquiry,
  "styleName" | "customerName" | "customerEmail" | "customerPhone" | "message" | "sourceUrl"
>;

function adminClient() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Inquiry service is not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mapInquiry(row: Record<string, unknown>): StyleInquiry {
  return {
    id: String(row.id),
    styleName: String(row.style_name),
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    customerPhone: String(row.customer_phone),
    message: String(row.message ?? ""),
    sourceUrl: typeof row.source_url === "string" ? row.source_url : null,
    status: row.status as StyleInquiryStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createStyleInquiry(input: NewStyleInquiry): Promise<StyleInquiry> {
  const { data, error } = await adminClient()
    .from("style_inquiries")
    .insert({
      style_name: input.styleName,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      message: input.message,
      source_url: input.sourceUrl,
    })
    .select()
    .single();
  if (error || !data) throw new Error(`Could not save style inquiry: ${error?.message ?? "unknown error"}`);
  return mapInquiry(data);
}

export async function listStyleInquiries(): Promise<StyleInquiry[]> {
  const { data, error } = await adminClient()
    .from("style_inquiries")
    .select()
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Could not load style inquiries: ${error.message}`);
  return (data ?? []).map(mapInquiry);
}

export async function updateStyleInquiryStatus(id: string, status: StyleInquiryStatus): Promise<void> {
  const { error } = await adminClient()
    .from("style_inquiries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Could not update style inquiry: ${error.message}`);
}
