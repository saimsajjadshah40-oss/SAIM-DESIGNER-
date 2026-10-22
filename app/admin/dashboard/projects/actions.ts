"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAction, UnauthorizedError } from "@/lib/auth/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { fail, done, type ActionResult } from "@/lib/actions/result";
import {
  SETTINGS_SCHEMAS,
  displayNameSchema,
  fieldErrors,
  firstError,
  passwordSchema,
  portraitSchema,
  profileSchema,
  socialLinksSchema,
} from "@/lib/validation/admin";
import type { SettingsKey } from "@/types/content";

function refresh() {
  revalidatePath("/", "layout");
}

function handle(err: unknown) {
  if (err instanceof UnauthorizedError) return fail(err.message);
  console.error("[settings action]", err);
  return fail("Something went wrong. Please try again.");
}

/* ── Website settings (hero, about, portfolio, contact, seo, footer) ──── */

export async function updateSettings(key: SettingsKey, value: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!(key in SETTINGS_SCHEMAS)) return fail("Unknown settings section.");

    const schema = SETTINGS_SCHEMAS[key] as z.ZodTypeAny;
    const parsed = schema.safeParse(value);
    if (!parsed.success) return fail(firstError(parsed.error), fieldErrors(parsed.error));

    let next = parsed.data as Record<string, unknown>;
    if (key === "seo") {
      // the share image is managed by setSiteImage — never overwrite it from the text form
      const { data: current } = await supabase.from("website_settings").select("value").eq("key", "seo").maybeSingle();
      next = { ...next, ogImage: (current?.value as { ogImage?: string | null } | null)?.ogImage ?? null };
    }

    const { error } = await supabase
      .from("website_settings")
      .upsert({ key, value: next, is_public: true }, { onConflict: "key" });
    if (error) throw error;

    refresh();
    return done("Saved. The website has been updated.");
  } catch (err) {
    return handle(err);
  }
}

/* ── Profile (about text, experience, skills) ─────────────────────────── */

export async function updateProfile(value: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    const parsed = profileSchema.safeParse(value);
    if (!parsed.success) return fail(firstError(parsed.error), fieldErrors(parsed.error));

    const { error } = await supabase.from("profiles").upsert({ id: 1, ...parsed.data }, { onConflict: "id" });
    if (error) throw error;

    refresh();
    return done("Profile saved.");
  } catch (err) {
    return handle(err);
  }
}

/* ── Site images: portrait (profile picture) and social sharing image ─── */

export async function setSiteImage(kind: "portrait" | "og", value: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (kind !== "portrait" && kind !== "og") return fail("Unknown image.");
    const parsed = portraitSchema.safeParse(value);
    if (!parsed.success) return fail(firstError(parsed.error));
    const { path, alt } = parsed.data;

    let previous: string | null = null;

    if (kind === "portrait") {
      const { data: current } = await supabase.from("profiles").select("profile_image_url").eq("id", 1).maybeSingle();
      previous = current?.profile_image_url ?? null;
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: 1, profile_image_url: path, profile_image_alt: alt || null }, { onConflict: "id" });
      if (error) throw error;
    } else {
      const { data: current } = await supabase.from("website_settings").select("value").eq("key", "seo").maybeSingle();
      const seo = (current?.value ?? {}) as Record<string, unknown>;
      previous = typeof seo.ogImage === "string" ? seo.ogImage : null;
      const { error } = await supabase
        .from("website_settings")
        .upsert({ key: "seo", value: { ...seo, ogImage: path }, is_public: true }, { onConflict: "key" });
      if (error) throw error;
    }

    if (previous && previous !== path && previous.startsWith("site/")) {
      const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([previous]);
      if (error) console.warn("[settings] could not remove old image", error.message);
    }

    refresh();
    return done(path ? "Image updated." : "Image removed.");
  } catch (err) {
    return handle(err);
  }
}

/* ── Social links ─────────────────────────────────────────────────────── */

export async function updateSocialLinks(value: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    const parsed = socialLinksSchema.safeParse(value);
    if (!parsed.success) return fail(firstError(parsed.error), fieldErrors(parsed.error));

    for (const link of parsed.data) {
      const { error } = await supabase
        .from("social_links")
        .update({ url: link.url, is_visible: link.is_visible })
        .eq("platform", link.platform);
      if (error) throw error;
    }

    refresh();
    return done("Social links saved.");
  } catch (err) {
    return handle(err);
  }
}

/* ── Admin account ────────────────────────────────────────────────────── */

export async function updateDisplayName(value: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    const parsed = displayNameSchema.safeParse(value);
    if (!parsed.success) return fail(firstError(parsed.error));

    const { error } = await supabase.auth.updateUser({ data: { display_name: parsed.data.displayName } });
    if (error) throw error;

    revalidatePath("/admin/dashboard", "layout");
    return done("Display name updated.");
  } catch (err) {
    return handle(err);
  }
}

export async function changePassword(value: unknown): Promise<ActionResult> {
  try {
    const { supabase, user } = await requireAdminAction();
    const parsed = passwordSchema.safeParse(value);
    if (!parsed.success) return fail(firstError(parsed.error), fieldErrors(parsed.error));
    if (!user.email) return fail("Your account has no email address.");

    // Re-verify the current password with a separate, cookie-less client so the
    // live session is not replaced if verification fails.
    const verifier = createPublicClient();
    if (!verifier) return fail("Supabase is not configured.");
    const { error: verifyError } = await verifier.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.currentPassword,
    });
    if (verifyError) return fail("Your current password is incorrect.", { currentPassword: "Incorrect password." });
    // scope "local" ends only the verification session, never the admin's live one
    await verifier.auth.signOut({ scope: "local" });

    const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
    if (error) return fail(error.message);

    return done("Password changed. Use the new password next time you sign in.");
  } catch (err) {
    return handle(err);
  }
}
