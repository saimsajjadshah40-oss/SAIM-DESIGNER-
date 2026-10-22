import { requireAdminPage } from "@/lib/auth/admin";
import { getAdminSettings } from "@/lib/content/admin";
import { DEFAULT_PROFILE } from "@/lib/content/defaults";
import { ContentEditor } from "@/components/admin/ContentEditor";
import type { ProfileRow } from "@/types/content";

export const metadata = { title: "Website Content" };

export default async function ContentPage() {
  const { supabase } = await requireAdminPage();
  const [settings, { data: profile }] = await Promise.all([
    getAdminSettings(supabase),
    supabase.from("profiles").select("*").eq("id", 1).maybeSingle<ProfileRow>(),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-3xl font-extrabold">Website content</h2>
        <p className="mt-1 text-sm text-muted">Every change is saved to the database and goes live on the website immediately.</p>
      </div>
      <ContentEditor settings={settings} profile={profile ?? { ...DEFAULT_PROFILE, updated_at: "" }} />
    </div>
  );
}
