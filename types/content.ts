export type ProjectCategory = "logo" | "banner" | "thumbnail";

export const PROJECT_CATEGORIES: { value: ProjectCategory; label: string }[] = [
  { value: "logo", label: "Logo Design" },
  { value: "banner", label: "Banner Design" },
  { value: "thumbnail", label: "YouTube Thumbnail" },
];

export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "behance",
  "dribbble",
  "linkedin",
  "youtube",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/* ── Database rows ─────────────────────────────────────────────────────── */

export interface ProfileRow {
  id: number;
  display_name: string;
  professional_title: string;
  experience: string;
  experience_caption: string;
  about_text: string;
  skills: string[];
  profile_image_url: string | null;
  profile_image_alt: string | null;
  updated_at: string;
}

export interface ProjectImageRow {
  id: string;
  project_id: string;
  image_path: string;
  alt_text: string;
  width: number | null;
  height: number | null;
  display_order: number;
  created_at: string;
}

export interface ProjectRow {
  id: string;
  title: string;
  slug: string;
  category: ProjectCategory;
  subcategory: string | null;
  description: string;
  cover_image: string | null;
  cover_alt: string | null;
  cover_width: number | null;
  cover_height: number | null;
  client_name: string | null;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithImages extends ProjectRow {
  project_images: ProjectImageRow[];
}

export interface SocialLinkRow {
  id: string;
  platform: SocialPlatform;
  url: string | null;
  is_visible: boolean;
  display_order: number;
}

/* ── Website settings (JSON values) ───────────────────────────────────── */

export interface HeroSettings {
  intro: string;
  name: string;
  title: string;
  roles: string[];
  description: string;
  primaryLabel: string;
  secondaryLabel: string;
  marquee: string[];
}

export interface AboutSettings {
  heading: string;
  subheading: string;
}

export interface PortfolioSectionSettings {
  heading: string;
  description: string;
  cta: string;
}

export interface PortfolioSettings {
  logo: PortfolioSectionSettings;
  banner: PortfolioSectionSettings;
  thumbnail: PortfolioSectionSettings;
  bannerCategories: string[];
}

export interface ContactSettings {
  whatsapp: string;
  heading: string;
  description: string;
}

export interface SeoSettings {
  title: string;
  description: string;
  ogImage: string | null;
}

export interface FooterSettings {
  tagline: string;
}

export interface SiteSettings {
  hero: HeroSettings;
  about: AboutSettings;
  portfolio: PortfolioSettings;
  contact: ContactSettings;
  seo: SeoSettings;
  footer: FooterSettings;
}

export type SettingsKey = keyof SiteSettings;

/* ── What the public page receives ─────────────────────────────────────── */

export interface PublicImage {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface PublicProject {
  id: string;
  slug: string;
  title: string;
  category: ProjectCategory;
  subcategory: string | null;
  description: string;
  clientName: string | null;
  isFeatured: boolean;
  cover: PublicImage | null;
  images: PublicImage[];
}

export interface PublicSocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface PublicSiteData {
  settings: SiteSettings;
  profile: {
    name: string;
    title: string;
    experience: string;
    experienceCaption: string;
    aboutText: string;
    skills: string[];
    portrait: PublicImage | null;
  };
  projects: Record<ProjectCategory, PublicProject[]>;
  socials: PublicSocialLink[];
  /** true when the data came from Supabase, false when using built-in defaults */
  live: boolean;
}
