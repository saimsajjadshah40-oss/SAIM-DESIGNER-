import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/admin";
import { getAdminSettings } from "@/lib/content/admin";
import { ProjectEditor } from "@/components/admin/ProjectEditor";
import type { ProjectWithImages } from "@/types/content";

export const metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdminPage();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data: project }, settings] = await Promise.all([
    supabase
      .from("portfolio_projects")
      .select("*, project_images(*)")
      .eq("id", id)
      .maybeSingle<ProjectWithImages>(),
    getAdminSettings(supabase),
  ]);
  if (!project) notFound();

  return (
    <div>
      <h2 className="mb-6 font-display text-3xl font-extrabold">Edit project</h2>
      <ProjectEditor
        key={project.updated_at}
        project={project}
        bannerCategories={settings.portfolio.bannerCategories}
      />
    </div>
  );
}
