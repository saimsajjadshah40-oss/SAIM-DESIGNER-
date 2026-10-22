import { requireAdminPage } from "@/lib/auth/admin";
import { getAdminSettings } from "@/lib/content/admin";
import { ProjectEditor } from "@/components/admin/ProjectEditor";
import type { ProjectCategory } from "@/types/content";

export const metadata = { title: "New project" };

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { supabase } = await requireAdminPage();
  const { category } = await searchParams;
  const settings = await getAdminSettings(supabase);
  const defaultCategory: ProjectCategory | undefined =
    category === "logo" || category === "banner" || category === "thumbnail" ? category : undefined;

  return (
    <div>
      <h2 className="mb-6 font-display text-3xl font-extrabold">Add new project</h2>
      <ProjectEditor bannerCategories={settings.portfolio.bannerCategories} defaultCategory={defaultCategory} />
    </div>
  );
}
