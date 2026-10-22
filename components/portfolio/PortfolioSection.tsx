"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Layers, Plus } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard } from "./ProjectCard";
import { Lightbox } from "./Lightbox";
import { cn } from "@/lib/utils";
import { whatsappLink, WHATSAPP_MESSAGES } from "@/lib/utils/whatsapp";
import type { PortfolioSectionSettings, ProjectCategory, PublicProject } from "@/types/content";

const PAGE_SIZE = 6;

interface PortfolioSectionProps {
  id: string;
  index: string;
  eyebrow: string;
  category: ProjectCategory;
  settings: PortfolioSectionSettings;
  projects: PublicProject[];
  whatsapp: string;
  filters?: string[];
  tone?: "dark" | "darker";
}

export function PortfolioSection({
  id,
  index,
  eyebrow,
  category,
  settings,
  projects,
  whatsapp,
  filters = [],
  tone = "dark",
}: PortfolioSectionProps) {
  const [filter, setFilter] = useState<string>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // only show filter pills that actually have projects
  const activeFilters = useMemo(
    () => filters.filter((f) => projects.some((p) => p.subcategory === f)),
    [filters, projects],
  );

  const filtered = useMemo(
    () => (filter === "all" ? projects : projects.filter((p) => p.subcategory === filter)),
    [projects, filter],
  );
  const shown = filtered.slice(0, visible);

  const grid =
    category === "banner"
      ? "columns-1 gap-5 sm:columns-2 sm:gap-6 lg:columns-3"
      : category === "logo"
        ? "grid grid-cols-1 gap-5 xs:grid-cols-2 sm:gap-6 lg:grid-cols-3"
        : "grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3";

  const ctaMessage = WHATSAPP_MESSAGES[category];
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn("relative overflow-hidden py-24 sm:py-32", tone === "darker" ? "bg-ink-2/40" : "bg-ink")}
    >
      <div aria-hidden className="pointer-events-none absolute right-[-10%] top-0 size-[32rem] rounded-full bg-brand/10 blur-[140px]" />
      <div className="relative mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id={titleId}
            index={index}
            eyebrow={eyebrow}
            title={settings.heading}
            description={settings.description}
          />
          <a
            href={whatsappLink(whatsapp, ctaMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost shrink-0 self-start lg:self-auto"
          >
            {settings.cta} <ArrowUpRight size={18} aria-hidden />
          </a>
        </div>

        {activeFilters.length > 0 && (
          <div role="group" aria-label="Filter banners" className="mt-10 flex flex-wrap gap-2">
            {["all", ...activeFilters].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFilter(f);
                  setVisible(PAGE_SIZE);
                }}
                aria-pressed={filter === f}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  filter === f ? "text-white" : "text-muted hover:text-white",
                )}
              >
                {filter === f && (
                  <motion.span
                    layoutId={`${id}-filter-pill`}
                    className="absolute inset-0 rounded-full border border-electric/60 bg-brand/20"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{f === "all" ? "All" : f}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-12">
          {projects.length === 0 ? (
            <EmptyState cta={settings.cta} href={whatsappLink(whatsapp, ctaMessage)} />
          ) : (
            <motion.div layout className={grid}>
              <AnimatePresence initial={false}>
                {shown.map((project, i) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={i}
                    onOpen={() => setOpenIndex(filtered.indexOf(project))}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {filtered.length > visible && (
          <div className="mt-12 flex justify-center">
            <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="btn-ghost">
              <Plus size={18} aria-hidden /> Load more ({filtered.length - visible} left)
            </button>
          </div>
        )}
      </div>

      <Lightbox
        projects={filtered}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </section>
  );
}

function EmptyState({ cta, href }: { cta: string; href: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-line bg-ink-2/50 px-6 py-16 text-center">
      <div aria-hidden className="absolute left-1/2 top-0 h-40 w-2/3 -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      <div className="relative mx-auto grid size-14 place-items-center rounded-2xl border border-electric/40 bg-brand/10 text-glow">
        <Layers size={24} aria-hidden />
      </div>
      <p className="relative mt-5 font-display text-xl font-bold text-white">New work is being curated</p>
      <p className="relative mx-auto mt-2 max-w-md text-muted">
        Projects for this category will appear here soon. Want something designed in the meantime?
      </p>
      <a href={href} target="_blank" rel="noopener noreferrer" className="btn-primary relative mt-7">
        {cta} <ArrowUpRight size={18} aria-hidden />
      </a>
    </div>
  );
}
