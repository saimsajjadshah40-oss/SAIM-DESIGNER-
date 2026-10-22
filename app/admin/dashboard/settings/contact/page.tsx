import { requireAdminPage } from "@/lib/auth/admin";
import { getAdminSettings } from "@/lib/content/admin";
import { ContactSettingsForm } from "@/components/admin/ContactSettingsForm";

export const metadata = { title: "Contact Settings" };

export default async function ContactSettingsPage() {
  const { supabase } = await requireAdminPage();
  const settings = await getAdminSettings(supabase);
  return (
    <div>
      <h2 className="mb-6 font-display text-3xl font-extrabold">Contact settings</h2>
      <ContactSettingsForm initial={settings.contact} />
    </div>
  );
}
