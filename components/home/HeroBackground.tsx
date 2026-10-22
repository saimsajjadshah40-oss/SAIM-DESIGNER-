import type { CSSProperties } from "react";

// Deterministic "random" particle field (same on server and client → no hydration mismatch)
const PARTICLES = Array.from({ length: 18 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const r = seed / 233280;
  return {
    left: `${(i * 37 + 11) % 100}%`,
    top: `${40 + ((i * 53) % 55)}%`,
    size: 2 + Math.round(r * 3),
    dur: `${8 + ((i * 7) % 9)}s`,
    delay: `${-((i * 13) % 12)}s`,
    dx: `${((i % 5) - 2) * 18}px`,
  };
});

export function HeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* faint editorial grid */}
      <div className="grid-lines absolute inset-0 opacity-60" />

      {/* slowly drifting ambient glows */}
      <div className="animate-drift absolute -left-[15%] top-[-20%] h-[38rem] w-[38rem] rounded-full bg-brand/20 blur-[140px]" />
      <div
        className="animate-drift absolute right-[-10%] top-[10%] h-[44rem] w-[44rem] rounded-full bg-electric/20 blur-[160px]"
        style={{ animationDelay: "-9s" }}
      />
      <div className="absolute bottom-[-25%] left-1/3 h-[30rem] w-[50rem] rounded-full bg-[#1d4ed8]/15 blur-[150px]" />

      {/* light particles */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="animate-particle absolute rounded-full bg-glow shadow-[0_0_8px_2px_rgb(96_165_250/0.6)]"
          style={
            {
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              "--dur": p.dur,
              "--delay": p.delay,
              "--dx": p.dx,
            } as CSSProperties
          }
        />
      ))}

      {/* vignette so text stays crisp */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#030712_100%)]" />
    </div>
  );
}
