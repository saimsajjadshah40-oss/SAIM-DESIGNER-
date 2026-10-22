import { Reveal } from "@/components/animations/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface AboutProps {
  heading: string;
  subheading: string;
  aboutText: string;
  experience: string;
  experienceCaption: string;
  skills: string[];
}

export function About({ heading, subheading, aboutText, experience, experienceCaption, skills }: AboutProps) {
  const paragraphs = aboutText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section id="about" aria-labelledby="about-title" className="relative overflow-hidden bg-ink py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-1/3 size-[30rem] rounded-full bg-brand/10 blur-[130px]" />
      <span
        aria-hidden
        className="animate-float pointer-events-none absolute right-[8%] top-24 size-3 rounded-full bg-glow shadow-[0_0_20px_5px_rgb(96_165_250/0.7)]"
      />

      <div className="relative mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* Left — heading + experience */}
          <div>
            <SectionHeading id="about-title" index="01" eyebrow={heading} title={subheading} />

            <Reveal delay={0.15} className="mt-12">
              <div className="relative inline-flex flex-col overflow-hidden rounded-3xl border border-line bg-linear-to-br from-ink-2 to-ink p-8 pr-14">
                <div aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full bg-electric/25 blur-3xl" />
                <span className="relative font-display text-[clamp(3.5rem,9vw,6rem)] font-extrabold leading-none text-gradient-blue">
                  {experience}
                </span>
                <span className="relative mt-3 text-sm font-bold uppercase tracking-[0.22em] text-muted">
                  {experienceCaption}
                </span>
              </div>
            </Reveal>
          </div>

          {/* Right — story + skills */}
          <div>
            <div className="space-y-5 border-l border-electric/40 pl-6 sm:pl-8">
              {paragraphs.map((p, i) => (
                <Reveal key={i} delay={0.06 * i}>
                  <p className="text-base leading-relaxed text-slate-300 sm:text-lg">{p}</p>
                </Reveal>
              ))}
            </div>

            {skills.length > 0 && (
              <Reveal delay={0.2} className="mt-12">
                <h3 className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-glow">Skills & Tools</h3>
                <ul className="flex flex-wrap gap-2.5">
                  {skills.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-full border border-electric/35 bg-brand/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-glow hover:bg-brand/15 hover:shadow-[0_0_20px_-6px_rgb(59_130_246/0.8)]"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
