"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicImage, PublicProject } from "@/types/content";

interface LightboxProps {
  projects: PublicProject[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ projects, index, onClose, onNavigate }: LightboxProps) {
  const open = index !== null && projects[index] !== undefined;
  const project = open ? projects[index!] : null;
  const [imageIndex, setImageIndex] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const gallery: PublicImage[] = project
    ? [project.cover, ...project.images].filter(
        (img, i, arr): img is PublicImage =>
          Boolean(img) && arr.findIndex((o) => o?.src === img!.src) === i,
      )
    : [];

  useEffect(() => setImageIndex(0), [index]);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (index === null || projects.length < 2) return;
      onNavigate((index + dir + projects.length) % projects.length);
    },
    [index, projects.length, onNavigate],
  );

  // focus, scroll lock, keyboard
  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 50);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && dialogRef.current) {
        // simple focus trap
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, go]);

  useEffect(() => {
    if (!open && lastFocus.current) {
      lastFocus.current.focus?.();
      lastFocus.current = null;
    }
  }, [open]);

  // swipe on touch devices
  const touchX = useRef<number | null>(null);

  const current = gallery[imageIndex] ?? gallery[0];

  return (
    <AnimatePresence>
      {open && project && (
        <motion.div
          key="lightbox"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[70] flex flex-col bg-ink/95 backdrop-blur-xl"
          onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
            if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/15 blur-[160px]" />

          {/* top bar */}
          <div className="relative flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted">
              {index! + 1} / {projects.length}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close project preview"
              className="grid size-11 place-items-center rounded-full border border-line bg-ink-2 text-white transition hover:border-electric hover:bg-brand"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-6 sm:px-8 lg:flex-row lg:overflow-hidden">
            {/* image stage */}
            <div className="relative flex min-h-[45svh] flex-1 items-center justify-center lg:min-h-0">
              <AnimatePresence mode="wait">
                {current && (
                  <motion.img
                    key={current.src}
                    src={current.src}
                    alt={current.alt}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="max-h-[60svh] w-auto max-w-full rounded-xl object-contain shadow-[0_30px_80px_-30px_rgb(37_99_235/0.6)] lg:max-h-[78svh]"
                  />
                )}
              </AnimatePresence>

              {projects.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Previous project"
                    className="absolute left-0 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-ink-2/90 text-white backdrop-blur transition hover:border-electric hover:bg-brand sm:left-2"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Next project"
                    className="absolute right-0 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border border-line bg-ink-2/90 text-white backdrop-blur transition hover:border-electric hover:bg-brand sm:right-2"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* details */}
            <aside className="relative w-full shrink-0 lg:w-[22rem] lg:overflow-y-auto">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-glow">
                {project.subcategory || project.category}
              </p>
              <h2 id="lightbox-title" className="mt-2 font-display text-3xl font-extrabold leading-tight text-white">
                {project.title}
              </h2>
              {project.clientName && (
                <p className="mt-2 text-sm text-muted">
                  Client / Brand: <span className="text-white">{project.clientName}</span>
                </p>
              )}
              {project.description && (
                <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-slate-300">{project.description}</p>
              )}

              {gallery.length > 1 && (
                <div className="mt-6">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted">
                    Project images ({gallery.length})
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {gallery.map((img, i) => (
                      <button
                        key={img.src}
                        type="button"
                        onClick={() => setImageIndex(i)}
                        aria-label={`Show image ${i + 1}`}
                        aria-current={i === imageIndex}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-lg border bg-ink-2 transition",
                          i === imageIndex ? "border-electric ring-2 ring-electric/40" : "border-line opacity-70 hover:opacity-100",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.src} alt="" loading="lazy" className="size-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
