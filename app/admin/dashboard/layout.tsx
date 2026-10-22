import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/admin/Toast";
import { mediaUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

// Always rendered per request with the caller's session — never cached.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireAdminPage();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, profile_image_url")
    .eq("id", 1)
    .maybeSingle();

  const displayName =
    (typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name) ||
    profile?.display_name ||
    "Administrator";

  return (
    <ToastProvider>
      <AdminShell
        email={user.email ?? ""}
        displayName={displayName}
        avatarUrl={mediaUrl(profile?.profile_image_url ?? null)}
      >
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
