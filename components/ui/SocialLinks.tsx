import type { PublicSocialLink } from "@/types/content";
import { SOCIAL_META } from "./BrandIcons";
import { cn } from "@/lib/utils";

export function SocialLinks({
  links,
  className,
  size = 18,
}: {
  links: PublicSocialLink[];
  className?: string;
  size?: number;
}) {
  if (!links.length) return null;
  return (
    <ul className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {links.map(({ platform, url }) => {
        const meta = SOCIAL_META[platform];
        if (!meta) return null;
        const { Icon, label } = meta;
        return (
          <li key={platform}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer me"
              aria-label={`Saim Sajjad on ${label}`}
              className="grid size-10 place-items-center rounded-full border border-line text-muted transition hover:-translate-y-0.5 hover:border-electric hover:text-white hover:shadow-[0_0_24px_-6px_rgb(59_130_246/0.7)]"
            >
              <Icon size={size} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
