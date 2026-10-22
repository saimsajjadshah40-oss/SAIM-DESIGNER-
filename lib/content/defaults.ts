import type { ProfileRow, SiteSettings } from "@/types/content";

/**
 * Built-in defaults. Used to fill any gaps in the database and to keep the
 * public site rendering if Supabase is not configured yet. These mirror the
 * seed rows in the SQL migration.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  hero: {
    intro: "Hello, I'm",
    name: "Saim Sajjad",
    title: "Creative Graphic Designer",
    roles: [
      "Graphic Designer",
      "Brand Identity Designer",
      "Logo Design Specialist",
      "YouTube Thumbnail Designer",
      "Creative Visual Designer",
    ],
    description:
      "Transforming creative ideas into powerful visual designs that help brands stand out.",
    primaryLabel: "Explore My Work",
    secondaryLabel: "Hire Me",
    marquee: ["Logos", "Branding", "Banners", "Thumbnails", "Social Media"],
  },
  about: {
    heading: "About Me",
    subheading: "Creativity Meets Professional Design",
  },
  portfolio: {
    logo: {
      heading: "Logo Design Portfolio",
      description:
        "Explore professionally crafted logo designs that combine creativity, originality, and meaningful brand identity.",
      cta: "Request a Logo Design",
    },
    banner: {
      heading: "Professional Banner Designs",
      description:
        "Creative banner designs built to communicate powerful brand messages and capture attention.",
      cta: "Get Your Banner Designed",
    },
    thumbnail: {
      heading: "YouTube Thumbnail Designs",
      description:
        "Eye-catching thumbnails designed to communicate video topics clearly and make content visually memorable.",
      cta: "Request a Thumbnail",
    },
    bannerCategories: [
      "Social Media Banners",
      "Advertising Banners",
      "Website Banners",
      "Promotional Banners",
    ],
  },
  contact: {
    whatsapp: "923228037525",
    heading: "Let's Work Together",
    description:
      "Have a creative project in mind? Let's turn your ideas into something remarkable.",
  },
  seo: {
    title: "Saim Sajjad — Graphic Designer | SAIM DESIGNER",
    description:
      "Portfolio of Saim Sajjad, a graphic designer from Pakistan with 3–4 years of experience in logo design, brand identity, banner design and YouTube thumbnails.",
    ogImage: null,
  },
  footer: {
    tagline: "Turning Creative Ideas Into Powerful Visual Experiences.",
  },
};

export const DEFAULT_PROFILE: Omit<ProfileRow, "updated_at"> = {
  id: 1,
  display_name: "Saim Sajjad",
  professional_title: "Creative Graphic Designer",
  experience: "3–4 Years",
  experience_caption: "Graphic Design Experience",
  about_text: [
    "I'm Saim Sajjad, a professional graphic designer with 3–4 years of experience creating visually impactful designs for businesses, brands, and digital platforms.",
    "During my creative journey, I have worked with different companies and professional teams, including Pixely Careers, contributing to a variety of professional design projects.",
    "My expertise includes logo design, branding, banner design, YouTube thumbnails, and social media graphics.",
    "I focus on creating visually engaging, professional designs that communicate the right message and help brands establish a stronger identity.",
  ].join("\n\n"),
  skills: [
    "Adobe Photoshop",
    "Adobe Illustrator",
    "Logo Design",
    "Brand Identity",
    "Banner Design",
    "YouTube Thumbnails",
    "Social Media Design",
    "Visual Communication",
  ],
  profile_image_url: null,
  profile_image_alt: null,
};

/** Merge a stored JSON value over its default so missing keys never break the UI. */
export function mergeSettings(stored: Partial<Record<keyof SiteSettings, unknown>>): SiteSettings {
  const out = structuredClone(DEFAULT_SETTINGS);
  (Object.keys(out) as (keyof SiteSettings)[]).forEach((key) => {
    const value = stored[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (key === "portfolio") {
        const v = value as Partial<SiteSettings["portfolio"]>;
        out.portfolio = {
          logo: { ...out.portfolio.logo, ...(v.logo ?? {}) },
          banner: { ...out.portfolio.banner, ...(v.banner ?? {}) },
          thumbnail: { ...out.portfolio.thumbnail, ...(v.thumbnail ?? {}) },
          bannerCategories: Array.isArray(v.bannerCategories)
            ? v.bannerCategories.filter((c): c is string => typeof c === "string")
            : out.portfolio.bannerCategories,
        };
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (out as any)[key] = { ...(out as any)[key], ...(value as object) };
      }
    }
  });
  return out;
}
