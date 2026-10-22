"use client";

import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import { HeroBackground } from "./HeroBackground";
import { RotatingText } from "./RotatingText";
import { SocialLinks } from "@/components/ui/SocialLinks";
import { whatsappLink, WHATSAPP_MESSAGES } from "@/lib/utils/whatsapp";
import type { HeroSettings, PublicImage, PublicSocialLink } from "@/types/content";

const EASE = [0.22, 1, 0.36, 1] as const;

interface HeroProps {
  hero: HeroSettings;
  portrait: PublicImage | null;
  experience: string;
  whatsapp: string;
  socials: PublicSocialLink[];
}

export function Hero({ hero, portrait, experience, whatsapp, socials }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const wordX = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -160]);

  const [first, ...rest] = (hero.name || "Saim Sajjad").trim().split(/\s+/);
  const last = rest.join(" ");
  const portraitSrc = portrait?.src ?? "/portrait-placeholder.svg";
  const isPlaceholder = !portrait;
  const marquee = hero.marquee.length ? hero.marquee : ["Logos", "Branding", "Banners", "Thumbnails"];

  return (
    <section
      id="home"
      ref={ref}
      aria-labelledby="hero-title"
      className="grain relative isolate flex min-h-svh flex-col overflow-hidden bg-ink pt-18"
    >
      <HeroBackground />

      {/* Oversized outlined word drifting behind the portrait */}
      <motion.div
        aria-hidden
        style={{ x: wordX }}
        className="pointer-events-none absolute bottom-[16%] left-0 right-0 -z-0 select-none whitespace-nowrap text-center font-display text-[30vw] font-extrabold leading-none tracking-tight text-outline lg:bottom-[12%] lg:text-[19vw]"
      >
        DESIGNER
      </motion.div>

      <div className="relative z-10 mx-auto grid w-full max-w-[90rem] flex-1 grid-cols-1 items-center gap-y-2 px-5 sm:px-8 lg:grid-cols-[1.08fr_1fr] lg:gap-x-6 lg:px-12">
        {/* ── Copy ───────────────────────────────────────────── */}
        <div className="order-2 -mt-24 pb-6 sm:-mt-28 lg:order-1 lg:mt-0 lg:pb-16">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
            className="mb-4 flex items-center gap-3 text-sm font-bold uppercase tracking-[0.28em] text-glow sm:text-base"
          >
            <span className="h-px w-10 bg-linear-to-r from-transparent to-glow" />
            {hero.intro}
          </motion.p>

          <h1 id="hero-title" className="font-display font-extrabold leading-[0.86] tracking-[-0.035em]">
            <span className="block overflow-hidden pb-1">
              <motion.span
                className="block text-[clamp(3.6rem,15vw,9.5rem)] text-white"
                initial={{ y: "105%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.95, delay: 0.25, ease: EASE }}
              >
                {first}
              </motion.span>
            </span>
            {last && (
              <span className="block overflow-hidden pb-2">
                <motion.span
                  className="text-gradient-blue block text-[clamp(3.6rem,15vw,9.5rem)]"
                  initial={{ y: "105%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.95, delay: 0.38, ease: EASE }}
                >
                  {last}
                </motion.span>
              </span>
            )}
            <span className="sr-only"> — {hero.title}</span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
            className="mt-5 font-display text-[clamp(1.35rem,3.6vw,2.25rem)] font-bold leading-tight text-white"
          >
            <RotatingText words={hero.roles.length ? hero.roles : [hero.title]} />
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.72, ease: EASE }}
            className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg"
          >
            {hero.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.84, ease: EASE }}
            className="mt-8 flex flex-col gap-3 xs:flex-row xs:flex-wrap"
          >
            <a href="#logo-designs" className="btn-primary">
              {hero.primaryLabel} <ArrowDownRight size={18} aria-hidden />
            </a>
            <a
              href={whatsappLink(whatsapp, WHATSAPP_MESSAGES.hire)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              {hero.secondaryLabel} <ArrowUpRight size={18} aria-hidden />
            </a>
          </motion.div>

          {socials.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-8"
            >
              <SocialLinks links={socials} />
            </motion.div>
          )}
        </div>

        {/* ── Portrait ───────────────────────────────────────── */}
        <motion.div
          style={{ y: portraitY }}
          className="relative order-1 mx-auto h-[min(58svh,30rem)] w-full max-w-[34rem] sm:h-[min(62svh,36rem)] lg:order-2 lg:h-[min(86svh,52rem)] lg:max-w-none"
        >
          {/* radial blue light + ring */}
          <div
            aria-hidden
            className="absolute left-1/2 top-[46%] aspect-square w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgb(59_130_246/0.55),rgb(37_99_235/0.18)_45%,transparent_70%)] blur-2xl"
          />
          <div
            aria-hidden
            className="animate-spin-slow absolute left-1/2 top-[46%] aspect-square w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-electric/25 [border-top-color:rgb(96_165_250/0.9)]"
          />
          <div
            aria-hidden
            className="absolute left-1/2 top-[46%] aspect-square w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line/80"
          />

          {/* floating glowing orbs */}
          <span
            aria-hidden
            className="animate-float absolute left-[12%] top-[16%] size-5 rounded-full bg-linear-to-br from-white via-glow to-brand shadow-[0_0_30px_8px_rgb(59_130_246/0.65)]"
          />
          <span
            aria-hidden
            className="animate-float-slow absolute right-[10%] top-[34%] size-2.5 rounded-full bg-glow shadow-[0_0_16px_4px_rgb(96_165_250/0.8)]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
            className="animate-float-slow absolute inset-0"
          >
            <Image
              src={portraitSrc}
              alt={portrait?.alt ?? "Portrait placeholder — Saim Sajjad, graphic designer"}
              fill
              priority
              unoptimized={isPlaceholder}
              sizes="(min-width: 1024px) 48vw, (min-width: 640px) 34rem, 92vw"
              className="object-contain object-bottom [mask-image:linear-gradient(to_bottom,black_72%,transparent_100%)]"
            />
          </motion.div>

          {/* soft blue floor shadow */}
          <div
            aria-hidden
            className="absolute bottom-0 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-[100%] bg-brand/40 blur-3xl"
          />

          {/* experience badge — real info only */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.05, ease: EASE }}
            className="absolute bottom-[22%] right-0 hidden rounded-2xl border border-line bg-ink-2/70 px-5 py-4 backdrop-blur-xl sm:block lg:right-[2%]"
          >
            <p className="font-display text-3xl font-extrabold text-white">{experience}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Design Experience</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.15, ease: EASE }}
            className="absolute left-0 top-[58%] hidden items-center gap-2 rounded-full border border-electric/30 bg-ink-2/70 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-xl md:flex lg:left-[4%]"
          >
            <Sparkles size={16} className="text-glow" aria-hidden />
            {hero.title}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#about"
        aria-label="Scroll to About section"
        className="absolute bottom-20 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.3em] text-muted transition hover:text-white lg:flex"
      >
        <span className="flex h-9 w-5.5 justify-center rounded-full border border-muted/50 pt-1.5">
          <span className="animate-scroll-dot size-1.5 rounded-full bg-glow" />
        </span>
        Scroll
      </a>

      {/* Service marquee */}
      <div className="relative z-10 border-y border-line/70 bg-ink-2/60 py-4 backdrop-blur-sm">
        <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="animate-marquee flex shrink-0 items-center gap-10 pr-10">
            {[...marquee, ...marquee, ...marquee, ...marquee].map((word, i) => (
              <span
                key={i}
                className="flex items-center gap-10 whitespace-nowrap font-display text-lg font-bold uppercase tracking-[0.2em] text-white/80"
                aria-hidden={i >= marquee.length}
              >
                {word}
                <span className="size-2 rounded-full bg-electric shadow-[0_0_12px_3px_rgb(59_130_246/0.7)]" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
