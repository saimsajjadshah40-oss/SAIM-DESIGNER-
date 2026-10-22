import { requireAdminPage } from "@/lib/auth/admin";
import { AccountSettings } from "@/components/admin/AccountSettings";

export const metadata = { title: "Profile Settings" };

export default async function ProfileSettingsPage() {
  const { supabase, user } = await requireAdminPage();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, profile_image_url, profile_image_alt")
    .eq("id", 1)
    .maybeSingle();

  const displayName =
    (typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name) ||
    profile?.display_name ||
    "";

  return (
    <div>
      <h2 className="mb-6 font-display text-3xl font-extrabold">Profile settings</h2>
      <AccountSettings
        email={user.email ?? ""}
        displayName={displayName}
        portraitPath={profile?.profile_image_url ?? null}
        portraitAlt={profile?.profile_image_alt ?? ""}
      />
    </div>
  );
}
