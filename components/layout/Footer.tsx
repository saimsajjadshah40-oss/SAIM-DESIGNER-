import { SocialLinks } from "@/components/ui/SocialLinks";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { formatWhatsAppDisplay, whatsappLink } from "@/lib/utils/whatsapp";
import type { PublicSocialLink } from "@/types/content";

const QUICK_LINKS = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About Me" },
  { href: "#logo-designs", label: "Logo Designs" },
  { href: "#banner-designs", label: "Banner Designs" },
  { href: "#thumbnail-designs", label: "Thumbnail Designs" },
  { href: "#contact", label: "Contact Me" },
];

export function Footer({
  tagline,
  whatsapp,
  socials,
  name,
}: {
  tagline: string;
  whatsapp: string;
  socials: PublicSocialLink[];
  name: string;
}) {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink pt-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-electric/70 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-brand/15 blur-[140px]" />

      <div className="relative mx-auto max-w-[90rem] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl font-extrabold tracking-[0.12em] text-white">
              SAIM<span className="text-glow">.</span>DESIGNER
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-300">{name} — Professional Graphic Designer</p>
            <p className="mt-4 max-w-sm text-muted">{tagline}</p>
            <SocialLinks links={socials} className="mt-6" />
          </div>

          <nav aria-label="Footer">
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-glow">Quick Links</h2>
            <ul className="mt-5 space-y-3">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-muted transition hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-glow">Contact</h2>
            <a
              href={whatsappLink(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2.5 text-white transition hover:text-glow"
            >
              <WhatsAppIcon size={18} className="text-[#25D366]" />
              WhatsApp: {formatWhatsAppDisplay(whatsapp)}
            </a>
          </div>
        </div>

        <div className="mt-16 h-px bg-linear-to-r from-transparent via-line to-transparent" />
        <p className="py-8 text-center text-sm text-muted">
          © {new Date().getFullYear() > 2026 ? `2026–${new Date().getFullYear()}` : "2026"} Saim Sajjad. All Rights Reserved.
        </p>
      </div>

      {/* oversized wordmark */}
      <p
        aria-hidden
        className="pointer-events-none select-none whitespace-nowrap text-center font-display text-[17vw] font-extrabold leading-[0.75] text-outline"
      >
        SAIM DESIGNER
      </p>
    </footer>
  );
}
