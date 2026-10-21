import { requireAdminPage } from "@/lib/auth/admin";
import { SocialLinksForm } from "@/components/admin/SocialLinksForm";
import { SOCIAL_PLATFORMS, type SocialLinkRow } from "@/types/content";

export const metadata = { title: "Social Media Links" };

export default async function SocialSettingsPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase
    .from("social_links")
    .select("id, platform, url, is_visible, display_order")
    .order("display_order", { ascending: true })
    .returns<SocialLinkRow[]>();

  // Make sure every supported platform is listed, even if the seed row is missing
  const rows: SocialLinkRow[] = SOCIAL_PLATFORMS.map(
    (platform, i) =>
      data?.find((d) => d.platform === platform) ?? {
        id: platform,
        platform,
        url: null,
        is_visible: false,
        display_order: i + 1,
      },
  );

  return (
    <div>
      <h2 className="mb-6 font-display text-3xl font-extrabold">Social media links</h2>
      <SocialLinksForm initial={rows} />
    </div>
  );
}
