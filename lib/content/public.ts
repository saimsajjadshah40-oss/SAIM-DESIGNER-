import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, mergeSettings } from "./defaults";
import { mediaUrl } from "@/lib/utils";
import type {
  ProfileRow,
  ProjectCategory,
  ProjectWithImages,
  PublicProject,
  PublicSiteData,
  PublicSocialLink,
  SiteSettings,
  SocialLinkRow,
} from "@/types/content";

function toPublicProject(p: ProjectWithImages): PublicProject {
  const images = [...(p.project_images ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .map((img) => ({
      src: mediaUrl(img.image_path)!,
      alt: img.alt_text || `${p.title} — additional image`,
      width: img.width,
      height: img.height,
    }));

  const cover = p.cover_image
    ? {
        src: mediaUrl(p.cover_image)!,
        alt: p.cover_alt || `${p.title} — ${p.category} design by Saim Sajjad`,
        width: p.cover_width,
        height: p.cover_height,
      }
    : images[0] ?? null;

  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    subcategory: p.subcategory,
    description: p.description,
    clientName: p.client_name,
    isFeatured: p.is_featured,
    cover,
    images,
  };
}

function fallback(): PublicSiteData {
  return {
    settings: DEFAULT_SETTINGS,
    profile: {
      name: DEFAULT_PROFILE.display_name,
      title: DEFAULT_PROFILE.professional_title,
      experience: DEFAULT_PROFILE.experience,
      experienceCaption: DEFAULT_PROFILE.experience_caption,
      aboutText: DEFAULT_PROFILE.about_text,
      skills: DEFAULT_PROFILE.skills,
      portrait: null,
    },
    projects: { logo: [], banner: [], thumbnail: [] },
    socials: [],
    live: false,
  };
}

/** Everything the public homepage needs, in one round of parallel queries. */
export const getPublicSiteData = cache(async (): Promise<PublicSiteData> => {
  const supabase = createPublicClient();
  if (!supabase) return fallback();

  try {
    const [settingsRes, profileRes, projectsRes, socialsRes] = await Promise.all([
      supabase.from("website_settings").select("key, value").eq("is_public", true),
      supabase.from("profiles").select("*").eq("id", 1).maybeSingle<ProfileRow>(),
      supabase
        .from("portfolio_projects")
        .select("*, project_images(*)")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false })
        .returns<ProjectWithImages[]>(),
      supabase
        .from("social_links")
        .select("platform, url, is_visible, display_order")
        .eq("is_visible", true)
        .order("display_order", { ascending: true })
        .returns<SocialLinkRow[]>(),
    ]);

    if (settingsRes.error || profileRes.error || projectsRes.error || socialsRes.error) {
      console.error("[public-data]", settingsRes.error ?? profileRes.error ?? projectsRes.error ?? socialsRes.error);
      return fallback();
    }

    const stored: Partial<Record<keyof SiteSettings, unknown>> = {};
    for (const row of settingsRes.data ?? []) {
      stored[row.key as keyof SiteSettings] = row.value;
    }
    const settings = mergeSettings(stored);

    const profile = profileRes.data ?? { ...DEFAULT_PROFILE, updated_at: "" };

    const projects: Record<ProjectCategory, PublicProject[]> = {
      logo: [],
      banner: [],
      thumbnail: [],
    };
    for (const p of projectsRes.data ?? []) {
      if (p.category in projects) projects[p.category].push(toPublicProject(p));
    }

    const socials: PublicSocialLink[] = (socialsRes.data ?? [])
      .filter((s) => s.is_visible && typeof s.url === "string" && s.url.startsWith("https://"))
      .map((s) => ({ platform: s.platform, url: s.url as string }));

    return {
      settings,
      profile: {
        name: profile.display_name || settings.hero.name,
        title: profile.professional_title,
        experience: profile.experience,
        experienceCaption: profile.experience_caption,
        aboutText: profile.about_text || DEFAULT_PROFILE.about_text,
        skills: profile.skills?.length ? profile.skills : DEFAULT_PROFILE.skills,
        portrait: profile.profile_image_url
          ? {
              src: mediaUrl(profile.profile_image_url)!,
              alt: profile.profile_image_alt || `Portrait of ${profile.display_name}, graphic designer`,
              width: null,
              height: null,
            }
          : null,
      },
      projects,
      socials,
      live: true,
    };
  } catch (err) {
    console.error("[public-data] unexpected", err);
    return fallback();
  }
});
