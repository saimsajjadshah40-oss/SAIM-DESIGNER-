import Link from "next/link";
import { ArrowRight, CheckCircle2, FileClock, FolderKanban, LayoutTemplate, PenTool, Plus, MonitorPlay } from "lucide-react";
import { requireAdminPage } from "@/lib/auth/admin";
import { formatDate, mediaUrl } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { ProjectRow } from "@/types/content";

export const metadata = { title: "Overview" };

const CATEGORY_LABEL = { logo: "Logo", banner: "Banner", thumbnail: "Thumbnail" } as const;

export default async function OverviewPage() {
  const { supabase } = await requireAdminPage();

  const base = () => supabase.from("portfolio_projects").select("id", { count: "exact", head: true });
  const [total, logo, banner, thumbnail, published, drafts, recent] = await Promise.all([
    base(),
    base().eq("category", "logo"),
    base().eq("category", "banner"),
    base().eq("category", "thumbnail"),
    base().eq("is_published", true),
    base().eq("is_published", false),
    supabase
      .from("portfolio_projects")
      .select("id, title, category, is_published, cover_image, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(8)
      .returns<Pick<ProjectRow, "id" | "title" | "category" | "is_published" | "cover_image" | "created_at" | "updated_at">[]>(),
  ]);

  const failed = [total, logo, banner, thumbnail, published, drafts, recent].some((r) => r.error);

  const cards = [
    { label: "Total Projects", value: total.count, icon: FolderKanban, href: "/admin/dashboard/projects" },
    { label: "Logo Projects", value: logo.count, icon: PenTool, href: "/admin/dashboard/projects?category=logo" },
    { label: "Banner Projects", value: banner.count, icon: LayoutTemplate, href: "/admin/dashboard/projects?category=banner" },
    { label: "Thumbnail Projects", value: thumbnail.count, icon: MonitorPlay, href: "/admin/dashboard/projects?category=thumbnail" },
    { label: "Published Projects", value: published.count, icon: CheckCircle2, href: "/admin/dashboard/projects?status=published" },
    { label: "Draft Projects", value: drafts.count, icon: FileClock, href: "/admin/dashboard/projects?status=draft" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">Welcome back 👋</p>
          <h2 className="font-display text-3xl font-extrabold">Your portfolio at a glance</h2>
        </div>
        <Link href="/admin/dashboard/projects/new" className="btn-primary min-h-11 self-start">
          <Plus size={18} aria-hidden /> Add project
        </Link>
      </div>

      {failed && (
        <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          Some statistics couldn&apos;t be loaded. Check that the database migration has been applied.
        </p>
      )}

      <section aria-label="Statistics" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group relative overflow-hidden rounded-2xl border border-line bg-ink p-5 transition hover:border-electric/60"
          >
            <div aria-hidden className="absolute -right-8 -top-8 size-28 rounded-full bg-brand/10 blur-2xl transition group-hover:bg-brand/25" />
            <Icon size={20} className="relative text-glow" aria-hidden />
            <p className="relative mt-4 font-display text-4xl font-extrabold">{value ?? "—"}</p>
            <p className="relative mt-1 text-sm text-muted">{label}</p>
          </Link>
        ))}
      </section>

      <section aria-labelledby="recent-title" className="rounded-2xl border border-line bg-ink">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 id="recent-title" className="font-display text-lg font-bold">Recent activity</h3>
          <Link href="/admin/dashboard/projects" className="inline-flex items-center gap-1 text-sm font-semibold text-glow hover:underline">
            All projects <ArrowRight size={14} aria-hidden />
          </Link>
        </div>
        {recent.data && recent.data.length > 0 ? (
          <ul className="divide-y divide-line">
            {recent.data.map((p) => {
              const isNew = Math.abs(new Date(p.updated_at).getTime() - new Date(p.created_at).getTime()) < 5000;
              const thumb = mediaUrl(p.cover_image);
              return (
                <li key={p.id}>
                  <Link href={`/admin/dashboard/projects/${p.id}`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-white/[0.03]">
                    <span className="size-12 shrink-0 overflow-hidden rounded-lg border border-line bg-ink-2">
                      {thumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="size-full object-cover" loading="lazy" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{p.title}</span>
                      <span className="block text-xs text-muted">
                        {CATEGORY_LABEL[p.category]} · {isNew ? "Added" : "Updated"} {formatDate(p.updated_at)}
                      </span>
                    </span>
                    <StatusBadge published={p.is_published} />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="font-semibold">No projects yet</p>
            <p className="mt-1 text-sm text-muted">Add your first logo, banner or thumbnail project to get started.</p>
            <Link href="/admin/dashboard/projects/new" className="btn-primary mt-5 min-h-11">
              <Plus size={18} aria-hidden /> Add project
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
