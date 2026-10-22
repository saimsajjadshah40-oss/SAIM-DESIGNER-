import { z } from "zod";
import { SOCIAL_PLATFORMS } from "@/types/content";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB — matches the bucket limit
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_IMAGE_EXT = ["jpg", "jpeg", "png", "webp"] as const;

const text = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters.`);
const required = (max: number, label: string) => text(max, label).min(1, `${label} is required.`);
const optionalText = (max: number, label: string) =>
  text(max, label)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const uuid = z.string().uuid();

/* ── Projects ─────────────────────────────────────────────────────────── */

export const projectFieldsSchema = z.object({
  title: required(140, "Title"),
  category: z.enum(["logo", "banner", "thumbnail"], {
    errorMap: () => ({ message: "Choose a category." }),
  }),
  subcategory: optionalText(60, "Sub-category"),
  description: text(3000, "Description").default(""),
  client_name: optionalText(120, "Client / brand name"),
  is_featured: z.boolean(),
  is_published: z.boolean(),
  display_order: z.coerce.number().int().min(-100000).max(100000),
});
export type ProjectFieldsInput = z.input<typeof projectFieldsSchema>;

const storagePath = z
  .string()
  .max(500)
  .regex(/^projects\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,120}$/, "Invalid image path.");

const dim = z.number().int().min(1).max(20000).nullable().optional();

export const projectMediaSchema = z.object({
  projectId: uuid,
  cover: z
    .object({
      path: storagePath,
      alt: text(300, "Cover alt text").default(""),
      width: dim,
      height: dim,
    })
    .nullable(),
  images: z
    .array(
      z.object({
        id: uuid.optional(),
        path: storagePath,
        alt: text(300, "Alt text").default(""),
        width: dim,
        height: dim,
      }),
    )
    .max(30, "A project can have at most 30 additional images."),
});
export type ProjectMediaInput = z.input<typeof projectMediaSchema>;

/* ── Website settings ─────────────────────────────────────────────────── */

const stringList = (maxItems: number, maxLen: number, label: string) =>
  z
    .array(z.string().trim().min(1).max(maxLen, `Each ${label} must be at most ${maxLen} characters.`))
    .max(maxItems, `At most ${maxItems} ${label}s.`);

export const heroSchema = z.object({
  intro: required(40, "Intro text"),
  name: required(60, "Designer name"),
  title: required(80, "Professional title"),
  roles: stringList(8, 50, "animated title").min(1, "Add at least one animated title."),
  description: required(240, "Hero description"),
  primaryLabel: required(30, "Primary button label"),
  secondaryLabel: required(30, "Secondary button label"),
  marquee: stringList(12, 30, "marquee word"),
});

export const aboutSettingsSchema = z.object({
  heading: required(60, "About heading"),
  subheading: required(120, "About subheading"),
});

const sectionSchema = z.object({
  heading: required(80, "Section heading"),
  description: required(300, "Section description"),
  cta: required(40, "Button label"),
});

export const portfolioSettingsSchema = z.object({
  logo: sectionSchema,
  banner: sectionSchema,
  thumbnail: sectionSchema,
  bannerCategories: stringList(12, 60, "banner category"),
});

export const contactSettingsSchema = z.object({
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10 && v.length <= 15, "Enter the full international number, e.g. 923228037525."),
  heading: required(80, "Contact heading"),
  description: required(300, "Contact description"),
});

export const seoSettingsSchema = z.object({
  title: required(70, "Website title"),
  description: required(170, "Meta description"),
  ogImage: z
    .string()
    .regex(/^site\/[A-Za-z0-9._-]{1,120}$/)
    .nullable(),
});

export const footerSettingsSchema = z.object({
  tagline: required(160, "Footer tagline"),
});

export const SETTINGS_SCHEMAS = {
  hero: heroSchema,
  about: aboutSettingsSchema,
  portfolio: portfolioSettingsSchema,
  contact: contactSettingsSchema,
  seo: seoSettingsSchema,
  footer: footerSettingsSchema,
} as const;

/* ── Profile ──────────────────────────────────────────────────────────── */

export const profileSchema = z.object({
  display_name: required(80, "Display name"),
  professional_title: required(120, "Professional title"),
  experience: required(40, "Experience"),
  experience_caption: text(80, "Experience caption"),
  about_text: required(5000, "About text"),
  skills: stringList(30, 50, "skill"),
});

export const portraitSchema = z.object({
  path: z.string().regex(/^site\/[A-Za-z0-9._-]{1,120}$/).nullable(),
  alt: text(200, "Portrait alt text").default(""),
});

/* ── Socials ──────────────────────────────────────────────────────────── */

export const socialLinksSchema = z
  .array(
    z
      .object({
        platform: z.enum(SOCIAL_PLATFORMS),
        url: z
          .string()
          .trim()
          .max(300)
          .transform((v) => (v ? v : null))
          .nullable()
          .refine((v) => {
            if (!v) return true;
            try {
              const u = new URL(v);
              return u.protocol === "https:" && u.hostname.includes(".");
            } catch {
              return false;
            }
          }, "Use a full https:// link."),
        is_visible: z.boolean(),
      })
      .transform((v) => ({ ...v, is_visible: v.is_visible && Boolean(v.url) })),
  )
  .max(SOCIAL_PLATFORMS.length);

/* ── Account ──────────────────────────────────────────────────────────── */

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(12, "Use at least 12 characters.")
      .max(72, "Use at most 72 characters.")
      .regex(/[a-z]/, "Include a lowercase letter.")
      .regex(/[A-Z]/, "Include an uppercase letter.")
      .regex(/[0-9]/, "Include a number."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "The new passwords don't match.",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "Choose a password different from the current one.",
    path: ["newPassword"],
  });

export const displayNameSchema = z.object({ displayName: required(60, "Display name") });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(120),
  password: z.string().min(1, "Enter your password.").max(200),
});

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
