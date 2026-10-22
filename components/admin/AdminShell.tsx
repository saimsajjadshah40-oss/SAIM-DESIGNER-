"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  FolderKanban,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  PenTool,
  Phone,
  Share2,
  UserCog,
  X,
  MonitorPlay,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/dashboard/projects", label: "Portfolio Projects", icon: FolderKanban },
  { href: "/admin/dashboard/projects?category=logo", label: "Logo Designs", icon: PenTool },
  { href: "/admin/dashboard/projects?category=banner", label: "Banner Designs", icon: LayoutTemplate },
  { href: "/admin/dashboard/projects?category=thumbnail", label: "Thumbnail Designs", icon: MonitorPlay },
  { href: "/admin/dashboard/content", label: "Website Content", icon: FileText },
  { href: "/admin/dashboard/settings/profile", label: "Profile Settings", icon: UserCog },
  { href: "/admin/dashboard/settings/contact", label: "Contact Settings", icon: Phone },
  { href: "/admin/dashboard/settings/social", label: "Social Media Links", icon: Share2 },
];

function useIsActive() {
  const pathname = usePathname();
  const params = useSearchParams();
  return (href: string) => {
    const [path, query] = href.split("?");
    if (query) {
      const [k, v] = query.split("=");
      return pathname === path && params.get(k) === v;
    }
    if (path === "/admin/dashboard") return pathname === path;
    if (path === "/admin/dashboard/projects") {
      return pathname.startsWith(path) && !params.get("category");
    }
    return pathname.startsWith(path);
  };
}

function LogoutButton({ className }: { className?: string }) {
  return (
    <form action="/admin/logout" method="post">
      <button
        type="submit"
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-red-500/10 hover:text-red-300",
          className,
        )}
      >
        <LogOut size={18} aria-hidden /> Logout
      </button>
    </form>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const isActive = useIsActive();
  return (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition",
              active
                ? "bg-brand/15 text-white shadow-[inset_0_0_0_1px_rgb(59_130_246/0.4)]"
                : "text-slate-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon size={18} aria-hidden className={active ? "text-glow" : undefined} />
            {label}
          </Link>
        );
      })}
      <div className="mt-auto border-t border-line pt-3">
        <LogoutButton />
      </div>
    </nav>
  );
}

export function AdminShell({
  email,
  displayName,
  avatarUrl,
  children,
}: {
  email: string;
  displayName: string;
  avatarUrl: string | null;
  children: React.ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!menu) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const title = NAV.find((n) => n.href.split("?")[0] === pathname)?.label ?? "Dashboard";
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-svh bg-[#050b18] text-white">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-68 flex-col border-r border-line bg-ink px-4 py-6 lg:flex">
        <Brand />
        <div className="mt-8 flex flex-1 flex-col">
          <SidebarNav />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-line bg-ink px-4 py-6">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setDrawer(false)}
                aria-label="Close menu"
                className="grid size-10 place-items-center rounded-lg border border-line"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-8 flex flex-1 flex-col">
              <SidebarNav onNavigate={() => setDrawer(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-68">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-[#050b18]/85 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              className="grid size-10 place-items-center rounded-lg border border-line lg:hidden"
            >
              <Menu size={18} />
            </button>
            <h1 className="truncate font-display text-lg font-bold sm:text-xl">{title}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-semibold text-slate-300 transition hover:border-electric hover:text-white sm:inline-flex"
            >
              View website <ExternalLink size={14} aria-hidden />
            </a>
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenu((m) => !m)}
                aria-expanded={menu}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2.5 transition hover:border-electric"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="size-8 rounded-full bg-ink-2 object-cover object-top" />
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-brand text-xs font-bold">{initials || "SS"}</span>
                )}
                <ChevronDown size={16} aria-hidden className="text-muted" />
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-ink-2 shadow-2xl">
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-bold">{displayName}</p>
                    <p className="truncate text-xs text-muted">{email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link role="menuitem" href="/admin/dashboard/settings/profile" onClick={() => setMenu(false)} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                      <UserCog size={16} aria-hidden /> Profile settings
                    </Link>
                    <a role="menuitem" href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                      <ImageIcon size={16} aria-hidden /> Public website
                    </a>
                    <LogoutButton className="px-3 py-2 font-normal" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-2">
      <span className="grid size-9 place-items-center rounded-full border border-electric/50 bg-brand/15 font-display text-sm font-extrabold shadow-[0_0_24px_-4px_rgb(59_130_246/0.7)]">
        S
      </span>
      <span className="font-display text-sm font-extrabold tracking-[0.16em]">
        SAIM<span className="text-glow">.</span>ADMIN
      </span>
    </Link>
  );
}
