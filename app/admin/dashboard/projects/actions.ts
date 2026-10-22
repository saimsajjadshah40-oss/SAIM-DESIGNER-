"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAction, UnauthorizedError } from "@/lib/auth/admin";
import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { slugify } from "@/lib/utils";
import { fail, done, type ActionResult } from "@/lib/actions/result";
import {
  fieldErrors,
  firstError,
  projectFieldsSchema,
  projectMediaSchema,
  type ProjectFieldsInput,
  type ProjectMediaInput,
} from "@/lib/validation/admin";

function refresh(id?: string) {
  revalidatePath("/");
  revalidatePath("/admin/dashboard", "layout");
  if (id) revalidatePath(`/admin/dashboard/projects/${id}`);
}

function handle(err: unknown): { ok: false; message: string } {
  if (err instanceof UnauthorizedError) return fail(err.message);
  console.error("[projects action]", err);
  return fail("Something went wrong. Please try again.");
}

const idSchema = z.string().uuid();

/* ── Create / update the text fields ──────────────────────────────────── */

export async function saveProject(input: {
  id?: string;
  fields: ProjectFieldsInput;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await requireAdminAction();

    const parsed = projectFieldsSchema.safeParse(input.fields);
    if (!parsed.success) return fail(firstError(parsed.error), fieldErrors(parsed.error));
    const fields = parsed.data;

    if (input.id && !idSchema.safeParse(input.id).success) return fail("Invalid project.");

    // Build a unique slug
    let slug: string | undefined;
    let existingTitle: string | null = null;
    if (input.id) {
      const { data: current, error } = await supabase
        .from("portfolio_projects")
        .select("title, slug")
        .eq("id", input.id)
        .maybeSingle();
      if (error) throw error;
      if (!current) return fail("This project no longer exists.");
      existingTitle = current.title;
      slug = current.slug;
    }
    if (!input.id || existingTitle !== fields.title) {
      const baseSlug = slugify(fields.title);
      const { data: clash } = await supabase
        .from("portfolio_projects")
        .select("id")
        .eq("slug", baseSlug)
        .maybeSingle();
      slug = clash && clash.id !== input.id ? `${baseSlug}-${randomBytes(3).toString("hex")}` : baseSlug;
    }

    // New projects go to the end of their category unless an order was given
    let displayOrder = fields.display_order;
    if (!input.id && displayOrder === 0) {
      const { data: last } = await supabase
        .from("portfolio_projects")
        .select("display_order")
        .eq("category", fields.category)
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      displayOrder = (last?.display_order ?? 0) + 1;
    }

    const row = { ...fields, slug, display_order: displayOrder };

    if (input.id) {
      const { error } = await supabase.from("portfolio_projects").update(row).eq("id", input.id);
      if (error) throw error;
      refresh(input.id);
      return done("Project saved.", { id: input.id });
    }

    const { data, error } = await supabase.from("portfolio_projects").insert(row).select("id").single();
    if (error) throw error;
    refresh(data.id);
    return done("Project created.", { id: data.id as string });
  } catch (err) {
    return handle(err);
  }
}

/* ── Attach cover + gallery after the browser has uploaded the files ──── */

export async function syncProjectMedia(input: ProjectMediaInput): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    const parsed = projectMediaSchema.safeParse(input);
    if (!parsed.success) return fail(firstError(parsed.error));
    const { projectId, cover, images } = parsed.data;

    const prefix = `projects/${projectId}/`;
    const allPaths = [cover?.path, ...images.map((i) => i.path)].filter(Boolean) as string[];
    if (allPaths.some((p) => !p.startsWith(prefix))) {
      return fail("Images must belong to this project.");
    }

    const [{ data: project, error: pErr }, { data: currentImages, error: iErr }] = await Promise.all([
      supabase.from("portfolio_projects").select("id, cover_image").eq("id", projectId).maybeSingle(),
      supabase.from("project_images").select("id, image_path").eq("project_id", projectId),
    ]);
    if (pErr || iErr) throw pErr ?? iErr;
    if (!project) return fail("This project no longer exists.");

    // 1. cover
    const { error: coverErr } = await supabase
      .from("portfolio_projects")
      .update({
        cover_image: cover?.path ?? null,
        cover_alt: cover?.alt || null,
        cover_width: cover?.width ?? null,
        cover_height: cover?.height ?? null,
      })
      .eq("id", projectId);
    if (coverErr) throw coverErr;

    // 2. gallery — delete removed, update kept, insert new
    const keepIds = new Set(images.filter((i) => i.id).map((i) => i.id as string));
    const removed = (currentImages ?? []).filter((img) => !keepIds.has(img.id));
    if (removed.length) {
      const { error } = await supabase
        .from("project_images")
        .delete()
        .in(
          "id",
          removed.map((r) => r.id),
        );
      if (error) throw error;
    }

    const knownIds = new Set((currentImages ?? []).map((i) => i.id));
    for (const [index, img] of images.entries()) {
      if (img.id && knownIds.has(img.id)) {
        const { error } = await supabase
          .from("project_images")
          .update({ alt_text: img.alt, display_order: index })
          .eq("id", img.id)
          .eq("project_id", projectId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("project_images").insert({
          project_id: projectId,
          image_path: img.path,
          alt_text: img.alt,
          width: img.width ?? null,
          height: img.height ?? null,
          display_order: index,
        });
        if (error) throw error;
      }
    }

    // 3. storage cleanup — anything in this project's folder that's no longer referenced
    const referenced = new Set(allPaths);
    const stale = [
      project.cover_image,
      ...removed.map((r) => r.image_path),
    ].filter((p): p is string => Boolean(p) && p!.startsWith(prefix) && !referenced.has(p!));
    if (stale.length) {
      const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(stale);
      if (error) console.warn("[projects] storage cleanup failed", error.message);
    }

    refresh(projectId);
    return done("Images saved.");
  } catch (err) {
    return handle(err);
  }
}

/* ── Delete ───────────────────────────────────────────────────────────── */

export async function deleteProject(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!idSchema.safeParse(id).success) return fail("Invalid project.");

    // Remove every file in the project's folder (including any orphans)
    const folder = `projects/${id}`;
    const { data: files } = await supabase.storage.from(STORAGE_BUCKET).list(folder, { limit: 1000 });
    if (files?.length) {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(files.map((f) => `${folder}/${f.name}`));
      if (error) console.warn("[projects] storage delete failed", error.message);
    }

    const { error } = await supabase.from("portfolio_projects").delete().eq("id", id);
    if (error) throw error;

    refresh();
    return done("Project deleted permanently.");
  } catch (err) {
    return handle(err);
  }
}

/* ── Quick toggles ────────────────────────────────────────────────────── */

export async function setProjectFlag(
  id: string,
  flag: "is_published" | "is_featured",
  value: boolean,
): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!idSchema.safeParse(id).success) return fail("Invalid project.");
    if (flag !== "is_published" && flag !== "is_featured") return fail("Invalid field.");

    const { error } = await supabase
      .from("portfolio_projects")
      .update({ [flag]: Boolean(value) })
      .eq("id", id);
    if (error) throw error;

    refresh(id);
    const label =
      flag === "is_published" ? (value ? "Project published." : "Project moved to drafts.") : value ? "Marked as featured." : "Removed from featured.";
    return done(label);
  } catch (err) {
    return handle(err);
  }
}

/* ── Reorder within a category ────────────────────────────────────────── */

export async function moveProject(id: string, direction: "up" | "down"): Promise<ActionResult> {
  try {
    const { supabase } = await requireAdminAction();
    if (!idSchema.safeParse(id).success) return fail("Invalid project.");

    const { data: target, error: tErr } = await supabase
      .from("portfolio_projects")
      .select("category")
      .eq("id", id)
      .maybeSingle();
    if (tErr) throw tErr;
    if (!target) return fail("This project no longer exists.");

    const { data: list, error } = await supabase
      .from("portfolio_projects")
      .select("id, display_order")
      .eq("category", target.category)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;

    const ids = (list ?? []).map((p) => p.id as string);
    const i = ids.indexOf(id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= ids.length) return done("Already at the edge.");
    [ids[i], ids[j]] = [ids[j], ids[i]];

    // Renumber 1..n so orders stay tidy; only write rows that changed.
    const current = new Map((list ?? []).map((p) => [p.id as string, p.display_order as number]));
    for (const [index, pid] of ids.entries()) {
      const order = index + 1;
      if (current.get(pid) !== order) {
        const { error: uErr } = await supabase.from("portfolio_projects").update({ display_order: order }).eq("id", pid);
        if (uErr) throw uErr;
      }
    }

    refresh();
    return done("Order updated.");
  } catch (err) {
    return handle(err);
  }
}
