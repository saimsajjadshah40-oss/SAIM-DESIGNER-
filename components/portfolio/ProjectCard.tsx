"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Eye, Images, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectCategory, PublicProject } from "@/types/content";

const FRAME: Record<ProjectCategory, string> = {
  logo: "aspect-square",
  thumbnail: "aspect-video",
  banner: "", // banners keep their own proportions
};

interface ProjectCardProps {
  project: PublicProject;
  onOpen: () => void;
  index: number;
}

export function ProjectCard({ project, onOpen, index }: ProjectCardProps) {
  const { cover, category } = project;
  const extra = project.images.length + (project.cover ? 1 : 0);
  const hasRatio = category === "banner" && cover?.width && cover?.height;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.6, delay: Math.min(index, 5) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group", category === "banner" && "mb-5 break-inside-avoid sm:mb-6")}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View project: ${project.title}`}
        className="block w-full text-left"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-line bg-ink-2 transition-[border-color,box-shadow] duration-500",
            "group-hover:border-electric/70 group-hover:shadow-[0_0_0_1px_rgb(59_130_246/0.25),0_24px_60px_-24px_rgb(37_99_235/0.75)]",
            FRAME[category],
            category === "banner" && !hasRatio && "aspect-[4/3]",
          )}
          style={hasRatio ? { aspectRatio: `${cover!.width} / ${cover!.height}` } : undefined}
        >
          {cover ? (
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
              className={cn(
                "transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]",
                category === "logo" ? "object-contain p-[12%]" : "object-cover",
              )}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-sm text-muted">No image</div>
          )}

          {/* view overlay */}
          <div className="absolute inset-0 flex items-end bg-linear-to-t from-ink/90 via-ink/30 to-transparent p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
            <span className="inline-flex translate-y-3 items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white shadow-[0_8px_24px_-6px_rgb(37_99_235/0.9)] transition-transform duration-500 group-hover:translate-y-0">
              <Eye size={16} aria-hidden /> View Project
            </span>
          </div>

          <div className="absolute left-3 top-3 flex gap-2">
            {project.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-glow backdrop-blur">
                <Star size={11} aria-hidden className="fill-glow" /> Featured
              </span>
            )}
            {extra > 1 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1 text-[0.7rem] font-bold text-white backdrop-blur">
                <Images size={11} aria-hidden /> {extra}
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between gap-4 px-1">
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-bold text-white transition-colors group-hover:text-glow">
              {project.title}
            </h3>
            {(project.clientName || project.subcategory) && (
              <p className="mt-0.5 truncate text-sm text-muted">
                {[project.clientName, project.subcategory].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </button>
    </motion.article>
  );
}
