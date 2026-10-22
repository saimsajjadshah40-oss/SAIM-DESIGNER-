import "server-only";
import { mergeSettings } from "./defaults";
import type { SiteSettings } from "@/types/content";
import type { AdminContext } from "@/lib/auth/admin";

/** All website settings (public and private) as seen by the signed-in admin. */
export async function getAdminSettings(supabase: AdminContext["supabase"]): Promise<SiteSettings> {
  const { data } = await supabase.from("website_settings").select("key, value");
  const stored: Partial<Record<keyof SiteSettings, unknown>> = {};
  for (const row of data ?? []) stored[row.key as keyof SiteSettings] = row.value;
  return mergeSettings(stored);
}
