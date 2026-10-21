import Link from "next/link";
import { Plus, Star, ImageOff } from "lucide-react";
import { requireAdminPage } from "@/lib/auth/admin";
import { ProjectRowActions } from "@/components/admin/ProjectRowActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { cn, formatDate, mediaUrl } from "@/lib/utils";
import { PROJECT_CATEGORIES, type ProjectCategory, type ProjectRow } from "@/types/content";

export const metadata = { title: "Portfolio Projects" };

const LABEL: Record<ProjectCategory, string> = { logo: "Logo", banner: "Banner", thumbnail: "Thumbnail" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const { supabase } = await requireAdminPage();
  const sp = await searchParams;
  const category = PROJECT_CATEGORIES.some((c) => c.value === sp.category) ? (sp.category as ProjectCategory) : null;
  const status = sp.status === "published" || sp.status === "draft" ? sp.status : null;

  let query = supabase
    .from("portfolio_projects")
    .select("*, project_images(count)")
    .order("category", { ascending: true })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);
  if (status) query = query.eq("is_published", status === "published");

  const { data, error } = await query.returns<(ProjectRow & { project_images: { count: number }[] })[]>();
  const projects = data ?? [];

  const tabs = [
    { href: "/admin/dashboard/projects", label: "All", active: !category },
    ...PROJECT_CATEGORIES.map((c) => ({
      href: `/admin/dashboard/projects?category=${c.value}`,
      label: c.label,
      active: category === c.value,
    })),
  ];

  const newHref = `/admin/dashboard/projects/new${category ? `?category=${category}` : ""}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Filter by category" className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                t.active ? "bg-brand text-white" : "border border-line text-slate-300 hover:border-electric hover:text-white",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <Link href={newHref} className="btn-primary min-h-11 self-start">
          <Plus size={18} aria-hidden /> Add new project
        </Link>
      </div>

      {status && (
        <p className="text-sm text-muted">
          Showing <strong className="text-white">{status}</strong> projects only.{" "}
          <Link href={category ? `/admin/dashboard/projects?category=${category}` : "/admin/dashboard/projects"} className="text-glow hover:underline">
            Clear filter
          </Link>
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          Couldn&apos;t load projects: {error.message}
        </p>
      )}

      {projects.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-line bg-ink px-6 py-16 text-center">
          <p className="font-display text-xl font-bold">No projects here yet</p>
          <p className="mt-1 text-sm text-muted">Upload your first design to show it on the website.</p>
          <Link href={newHref} className="btn-primary mt-6 min-h-11">
            <Plus size={18} aria-hidden /> Add project
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((p, i) => {
            const thumb = mediaUrl(p.cover_image);
            const sameCat = projects.filter((x) => x.category === p.category);
            const pos = sameCat.findIndex((x) => x.id === p.id);
            const imageCount = p.project_images?.[0]?.count ?? 0;
            return (
              <li
                key={p.id}
                className="flex flex-col gap-4 rounded-2xl border border-line bg-ink p-4 sm:flex-row sm:items-center"
              >
                <Link href={`/admin/dashboard/projects/${p.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-ink-2">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" loading={i > 6 ? "lazy" : "eager"} className="size-full object-cover" />
                    ) : (
                      <ImageOff size={18} className="text-muted" aria-label="No cover image" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold text-white">{p.title}</span>
                      {p.is_featured && <Star size={14} className="shrink-0 fill-glow text-glow" aria-label="Featured" />}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {LABEL[p.category]}
                      {p.subcategory ? ` · ${p.subcategory}` : ""} · Order {p.display_order} · {imageCount + (p.cover_image ? 1 : 0)} image
                      {imageCount + (p.cover_image ? 1 : 0) === 1 ? "" : "s"} · Updated {formatDate(p.updated_at)}
                    </span>
                  </span>
                </Link>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <StatusBadge published={p.is_published} />
                  <ProjectRowActions
                    id={p.id}
                    title={p.title}
                    isPublished={p.is_published}
                    isFeatured={p.is_featured}
                    isFirst={pos === 0}
                    isLast={pos === sameCat.length - 1}
                    canReorder={!status}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
