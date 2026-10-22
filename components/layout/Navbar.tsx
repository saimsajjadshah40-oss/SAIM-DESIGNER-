"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { whatsappLink, WHATSAPP_MESSAGES } from "@/lib/utils/whatsapp";

export const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About Me" },
  { id: "logo-designs", label: "Logo Designs" },
  { id: "banner-designs", label: "Banner Designs" },
  { id: "thumbnail-designs", label: "Thumbnail Designs" },
  { id: "contact", label: "Contact" },
] as const;

export function Navbar({ whatsapp }: { whatsapp: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("home");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Active-section indicator
  useEffect(() => {
    const sections = NAV_LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Lock scroll + close on Escape while the mobile menu is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hireHref = whatsappLink(whatsapp, WHATSAPP_MESSAGES.hire);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500",
        scrolled
          ? "border-b border-line/60 bg-ink/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-18 max-w-[90rem] items-center justify-between px-5 sm:px-8 lg:px-12"
      >
        <a href="#home" className="group flex items-center gap-2.5" aria-label="SAIM DESIGNER — home">
          <span className="relative grid size-9 place-items-center rounded-full border border-electric/50 bg-brand/15 font-display text-sm font-extrabold text-white shadow-[0_0_24px_-4px_rgb(59_130_246/0.7)]">
            S
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-glow shadow-[0_0_10px_2px_rgb(96_165_250/0.9)]" />
          </span>
          <span className="font-display text-[1.05rem] font-extrabold tracking-[0.18em] text-white">
            SAIM<span className="text-glow">.</span>
            <span className="font-semibold text-muted transition-colors group-hover:text-white">DESIGNER</span>
          </span>
        </a>

        <ul className="hidden items-center gap-1 xl:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                aria-current={active === link.id ? "true" : undefined}
                className={cn(
                  "group relative px-3.5 py-2 text-sm font-semibold transition-colors",
                  active === link.id ? "text-white" : "text-muted hover:text-white",
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute inset-x-3.5 -bottom-0.5 h-px origin-left bg-linear-to-r from-electric to-glow transition-transform duration-300",
                    active === link.id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                  )}
                />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <a
            href={hireHref}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-11 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-bold text-white shadow-[0_8px_28px_-8px_rgb(37_99_235/0.9)] transition hover:scale-[1.03] hover:bg-electric hover:shadow-[0_10px_36px_-6px_rgb(59_130_246/1)] sm:inline-flex"
          >
            Hire Me <ArrowUpRight size={16} aria-hidden />
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-11 place-items-center rounded-full border border-line bg-ink-2/80 text-white transition hover:border-electric xl:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 bottom-0 top-18 z-40 overflow-y-auto bg-ink/95 backdrop-blur-2xl xl:hidden"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 top-10 size-80 rounded-full bg-brand/25 blur-[100px]"
            />
            <motion.ul
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
              className="relative flex flex-col gap-1 px-6 pt-8"
            >
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.id}
                  variants={{ hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0 } }}
                >
                  <a
                    href={`#${link.id}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-baseline gap-4 border-b border-line/60 py-4 font-display text-3xl font-bold",
                      active === link.id ? "text-white" : "text-muted",
                    )}
                  >
                    <span className="text-xs font-semibold text-glow">0{i + 1}</span>
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
            <div className="relative px-6 py-8">
              <a
                href={hireHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="btn-primary w-full"
              >
                Hire Me on WhatsApp <ArrowUpRight size={18} aria-hidden />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
