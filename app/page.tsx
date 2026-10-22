import { getPublicSiteData } from "@/lib/content/public";
import { MotionProvider } from "@/components/animations/MotionProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { PortfolioSection } from "@/components/portfolio/PortfolioSection";
import { ContactSection } from "@/components/contact/ContactSection";
import { normalizeWhatsAppNumber } from "@/lib/utils/whatsapp";
import { siteUrl } from "@/lib/utils";

// Incremental static regeneration: rebuilt at most once a minute, and instantly
// whenever the admin saves something (see revalidatePath in the admin actions).
export const revalidate = 60;

export default async function HomePage() {
  const data = await getPublicSiteData();
  const { settings, profile, projects, socials } = data;
  const whatsapp = normalizeWhatsAppNumber(settings.contact.whatsapp);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Saim Sajjad",
    alternateName: "SAIM DESIGNER",
    jobTitle: "Graphic Designer",
    description: settings.seo.description,
    url: siteUrl(),
    telephone: `+${whatsapp}`,
    knowsAbout: ["Logo Design", "Brand Identity", "Banner Design", "YouTube Thumbnail Design", "Social Media Design"],
    address: { "@type": "PostalAddress", addressCountry: "PK" },
    ...(socials.length ? { sameAs: socials.map((s) => s.url) } : {}),
  };

  return (
    <MotionProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand focus:px-5 focus:py-3 focus:font-bold"
      >
        Skip to content
      </a>
      <Navbar whatsapp={whatsapp} />
      <main id="main">
        <Hero
          hero={settings.hero}
          portrait={profile.portrait}
          experience={profile.experience}
          whatsapp={whatsapp}
          socials={socials}
        />
        <About
          heading={settings.about.heading}
          subheading={settings.about.subheading}
          aboutText={profile.aboutText}
          experience={profile.experience}
          experienceCaption={profile.experienceCaption}
          skills={profile.skills}
        />
        <PortfolioSection
          id="logo-designs"
          index="02"
          eyebrow="Logo Designs"
          category="logo"
          settings={settings.portfolio.logo}
          projects={projects.logo}
          whatsapp={whatsapp}
        />
        <PortfolioSection
          id="banner-designs"
          index="03"
          eyebrow="Banner Designs"
          category="banner"
          settings={settings.portfolio.banner}
          projects={projects.banner}
          whatsapp={whatsapp}
          filters={settings.portfolio.bannerCategories}
          tone="darker"
        />
        <PortfolioSection
          id="thumbnail-designs"
          index="04"
          eyebrow="Thumbnail Designs"
          category="thumbnail"
          settings={settings.portfolio.thumbnail}
          projects={projects.thumbnail}
          whatsapp={whatsapp}
        />
        <ContactSection
          heading={settings.contact.heading}
          description={settings.contact.description}
          whatsapp={whatsapp}
        />
      </main>
      <Footer tagline={settings.footer.tagline} whatsapp={whatsapp} socials={socials} name={profile.name} />
      <FloatingWhatsApp whatsapp={whatsapp} />
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot break out of the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </MotionProvider>
  );
}
