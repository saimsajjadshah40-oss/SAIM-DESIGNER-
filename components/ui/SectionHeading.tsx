import { Reveal } from "@/components/animations/Reveal";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  index?: string;
  className?: string;
}

export function SectionHeading({ id, eyebrow, title, description, index, className }: SectionHeadingProps) {
  return (
    <Reveal className={cn("max-w-3xl", className)}>
      <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-glow sm:text-sm">
        {index && <span className="text-muted">{index}</span>}
        <span className="h-px w-10 bg-linear-to-r from-electric to-transparent" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className="font-display text-[clamp(2.25rem,6vw,4.5rem)] font-extrabold leading-[0.95] tracking-[-0.03em] text-white"
      >
        {title}
      </h2>
      {description && <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">{description}</p>}
    </Reveal>
  );
}
