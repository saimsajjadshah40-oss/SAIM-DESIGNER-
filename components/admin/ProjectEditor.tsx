"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ExternalLink,
  ImagePlus,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { Card, FieldShell, Toggle, inputClass } from "./FormControls";
import { ImageDropzone } from "./ImageDropzone";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";
import { deleteProject, saveProject, syncProjectMedia } from "@/app/admin/dashboard/projects/actions";
import { newObjectPath, readImageSize, removeUploaded, uploadImage, validateImageFile } from "@/lib/upload/client";
import { cn, mediaUrl } from "@/lib/utils";
import { PROJECT_CATEGORIES, type ProjectCategory, type ProjectWithImages } from "@/types/content";

interface MediaItem {
  key: string;
  id?: string; // existing project_images row
  path?: string; // storage path once uploaded
  file?: File; // pending upload
  previewUrl: string;
  alt: string;
  width: number | null;
  height: number | null;
  progress?: number;
}

let keySeq = 0;
const nextKey = () => `m${++keySeq}`;

async function fileToItem(file: File, alt = ""): Promise<MediaItem> {
  const size = await readImageSize(file);
  return {
    key: nextKey(),
    file,
    previewUrl: URL.createObjectURL(file),
    alt,
    width: size?.width ?? null,
    height: size?.height ?? null,
  };
}

export function ProjectEditor({
  project,
  bannerCategories,
  defaultCategory,
}: {
  project?: ProjectWithImages;
  bannerCategories: string[];
  defaultCategory?: ProjectCategory;
}) {
  const uid = useId();
  const router = useRouter();
  const toast = useToast();
  const isNew = !project;

  const [fields, setFields] = useState({
    title: project?.title ?? "",
    category: (project?.category ?? defaultCategory ?? "logo") as ProjectCategory,
    subcategory: project?.subcategory ?? "",
    description: project?.description ?? "",
    client_name: project?.client_name ?? "",
    is_featured: project?.is_featured ?? false,
    is_published: project?.is_published ?? false,
    display_order: project?.display_order ?? 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [cover, setCover] = useState<MediaItem | null>(() =>
    project?.cover_image
      ? {
          key: nextKey(),
          path: project.cover_image,
          previewUrl: mediaUrl(project.cover_image)!,
          alt: project.cover_alt ?? "",
          width: project.cover_width,
          height: project.cover_height,
        }
      : null,
  );
  const [gallery, setGallery] = useState<MediaItem[]>(() =>
    [...(project?.project_images ?? [])]
      .sort((a, b) => a.display_order - b.display_order)
      .map((img) => ({
        key: nextKey(),
        id: img.id,
        path: img.image_path,
        previewUrl: mediaUrl(img.image_path)!,
        alt: img.alt_text,
        width: img.width,
        height: img.height,
      })),
  );

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);

  // revoke blob previews on unmount
  const previews = useRef<string[]>([]);
  useEffect(() => () => previews.current.forEach((u) => URL.revokeObjectURL(u)), []);

  // warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const update = <K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) => {
    setFields((f) => ({ ...f, [key]: value }));
    setDirty(true);
    if (errors[key as string]) setErrors((e) => ({ ...e, [key as string]: "" }));
  };

  const acceptFiles = async (files: File[]): Promise<MediaItem[]> => {
    const ok: MediaItem[] = [];
    for (const file of files) {
      const problem = validateImageFile(file);
      if (problem) {
        toast("error", problem);
        continue;
      }
      const item = await fileToItem(file, fields.title);
      previews.current.push(item.previewUrl);
      ok.push(item);
    }
    return ok;
  };

  const setCoverFile = async (files: File[]) => {
    const [item] = await acceptFiles(files);
    if (item) {
      setCover(item);
      setDirty(true);
    }
  };

  const addGalleryFiles = async (files: File[]) => {
    const room = 30 - gallery.length;
    if (room <= 0) return toast("error", "A project can have at most 30 additional images.");
    const items = await acceptFiles(files.slice(0, room));
    if (items.length) {
      setGallery((g) => [...g, ...items]);
      setDirty(true);
    }
  };

  const replaceGalleryItem = async (key: string, files: File[]) => {
    const [item] = await acceptFiles(files);
    if (!item) return;
    setGallery((g) => g.map((m) => (m.key === key ? { ...item, alt: m.alt } : m)));
    setDirty(true);
  };

  const moveGallery = (index: number, dir: -1 | 1) => {
    setGallery((g) => {
      const j = index + dir;
      if (j < 0 || j >= g.length) return g;
      const copy = [...g];
      [copy[index], copy[j]] = [copy[j], copy[index]];
      return copy;
    });
    setDirty(true);
  };

  const setProgress = (key: string, progress: number) => {
    setCover((c) => (c && c.key === key ? { ...c, progress } : c));
    setGallery((g) => g.map((m) => (m.key === key ? { ...m, progress } : m)));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setErrors({});

    const res = await saveProject({
      id: project?.id,
      fields: {
        ...fields,
        subcategory: fields.subcategory || null,
        client_name: fields.client_name || null,
        display_order: Number(fields.display_order) || 0,
      },
    });

    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast("error", res.message);
      setSaving(false);
      return;
    }
    const projectId = res.data!.id;

    // Upload any new files into this project's private folder
    const uploaded: string[] = [];
    try {
      const folder = `projects/${projectId}`;
      let nextCover = cover;
      if (cover?.file) {
        const path = newObjectPath(folder, cover.file);
        await uploadImage(path, cover.file, (p) => setProgress(cover.key, p));
        uploaded.push(path);
        nextCover = { ...cover, path, file: undefined };
      }
      const nextGallery: MediaItem[] = [];
      for (const item of gallery) {
        if (item.file) {
          const path = newObjectPath(folder, item.file);
          await uploadImage(path, item.file, (p) => setProgress(item.key, p));
          uploaded.push(path);
          nextGallery.push({ ...item, path, file: undefined, id: undefined });
        } else {
          nextGallery.push(item);
        }
      }

      const mediaRes = await syncProjectMedia({
        projectId,
        cover: nextCover?.path
          ? { path: nextCover.path, alt: nextCover.alt, width: nextCover.width, height: nextCover.height }
          : null,
        images: nextGallery
          .filter((m) => m.path)
          .map((m) => ({ id: m.id, path: m.path!, alt: m.alt, width: m.width, height: m.height })),
      });
      if (!mediaRes.ok) throw new Error(mediaRes.message);

      setDirty(false);
      toast("success", isNew ? "Project created." : "All changes saved.");
      if (isNew) {
        router.replace(`/admin/dashboard/projects/${projectId}`);
      } else {
        // The page passes key={updated_at}, so refreshing remounts this editor
        // with the saved rows (including the new image IDs).
        router.refresh();
      }
    } catch (err) {
      await removeUploaded(uploaded);
      toast("error", err instanceof Error ? err.message : "Uploading images failed.");
      if (isNew) router.replace(`/admin/dashboard/projects/${projectId}`);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!project) return;
    setDeleting(true);
    const res = await deleteProject(project.id);
    setDeleting(false);
    if (!res.ok) {
      toast("error", res.message);
      return;
    }
    setConfirmDelete(false);
    setDirty(false);
    toast("success", res.message);
    router.replace("/admin/dashboard/projects");
    router.refresh();
  }

  const hasImage = Boolean(cover || gallery.length);

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/admin/dashboard/projects" className="inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft size={16} aria-hidden /> All projects
        </Link>
        <div className="flex flex-wrap gap-2">
          {project?.is_published && (
            <a
              href={`/#${project.category}-designs`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold hover:border-electric"
            >
              View live <ExternalLink size={14} aria-hidden />
            </a>
          )}
          <button type="submit" disabled={saving} className="btn-primary min-h-11 disabled:opacity-70">
            {saving ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Save size={18} aria-hidden />}
            {saving ? "Saving…" : isNew ? "Create project" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card title="Project details">
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldShell id={`${uid}-title`} label="Project title" required error={errors.title} className="sm:col-span-2">
                <input
                  id={`${uid}-title`}
                  value={fields.title}
                  onChange={(e) => update("title", e.target.value)}
                  maxLength={140}
                  aria-invalid={Boolean(errors.title)}
                  className={inputClass}
                />
              </FieldShell>
              <FieldShell id={`${uid}-category`} label="Category" required error={errors.category}>
                <select
                  id={`${uid}-category`}
                  value={fields.category}
                  onChange={(e) => update("category", e.target.value as ProjectCategory)}
                  className={inputClass}
                >
                  {PROJECT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell
                id={`${uid}-sub`}
                label="Sub-category"
                hint={fields.category === "banner" ? "Used for the banner filters on the website." : "Optional label, e.g. Minimal, Mascot."}
                error={errors.subcategory}
              >
                <input
                  id={`${uid}-sub`}
                  list={`${uid}-sub-list`}
                  value={fields.subcategory}
                  onChange={(e) => update("subcategory", e.target.value)}
                  maxLength={60}
                  className={inputClass}
                />
                <datalist id={`${uid}-sub-list`}>
                  {(fields.category === "banner" ? bannerCategories : []).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </FieldShell>
              <FieldShell id={`${uid}-client`} label="Client / brand name" hint="Optional — only add real clients." error={errors.client_name}>
                <input
                  id={`${uid}-client`}
                  value={fields.client_name}
                  onChange={(e) => update("client_name", e.target.value)}
                  maxLength={120}
                  className={inputClass}
                />
              </FieldShell>
              <FieldShell id={`${uid}-order`} label="Display order" hint="Lower numbers appear first. 0 = add to the end." error={errors.display_order}>
                <input
                  id={`${uid}-order`}
                  type="number"
                  inputMode="numeric"
                  value={fields.display_order}
                  onChange={(e) => update("display_order", Number(e.target.value))}
                  className={inputClass}
                />
              </FieldShell>
              <FieldShell id={`${uid}-desc`} label="Description" error={errors.description} className="sm:col-span-2">
                <textarea
                  id={`${uid}-desc`}
                  rows={6}
                  value={fields.description}
                  onChange={(e) => update("description", e.target.value)}
                  maxLength={3000}
                  className={cn(inputClass, "py-2.5")}
                />
                <p className="mt-1 text-right text-xs text-muted">{fields.description.length}/3000</p>
              </FieldShell>
            </div>
          </Card>

          <Card
            title="Additional images"
            description="Shown in the fullscreen project gallery. Use the arrows to reorder."
          >
            <ImageDropzone multiple onFiles={addGalleryFiles} disabled={saving} compact={gallery.length > 0} />
            {gallery.length > 0 && (
              <ul className="mt-5 space-y-3">
                {gallery.map((item, i) => (
                  <li key={item.key} className="flex gap-3 rounded-xl border border-line bg-ink-2/50 p-3">
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-ink">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.previewUrl} alt="" className="size-full object-cover" />
                      {item.file && (
                        <span className="absolute left-1 top-1 rounded bg-brand px-1.5 text-[0.6rem] font-bold uppercase">New</span>
                      )}
                      {typeof item.progress === "number" && item.progress < 100 && (
                        <ProgressBar value={item.progress} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <label htmlFor={`${uid}-alt-${item.key}`} className="text-xs font-semibold text-muted">
                        Alt text (describe the image)
                      </label>
                      <input
                        id={`${uid}-alt-${item.key}`}
                        value={item.alt}
                        maxLength={300}
                        onChange={(e) => {
                          const v = e.target.value;
                          setGallery((g) => g.map((m) => (m.key === item.key ? { ...m, alt: v } : m)));
                          setDirty(true);
                        }}
                        className={cn(inputClass, "mt-1 min-h-9 text-sm")}
                      />
                      <p className="mt-1 text-xs text-muted">
                        {item.width && item.height ? `${item.width} × ${item.height}px` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <IconBtn label="Move up" onClick={() => moveGallery(i, -1)} disabled={i === 0 || saving}>
                        <ArrowUp size={15} />
                      </IconBtn>
                      <IconBtn label="Move down" onClick={() => moveGallery(i, 1)} disabled={i === gallery.length - 1 || saving}>
                        <ArrowDown size={15} />
                      </IconBtn>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <ReplaceButton disabled={saving} onFile={(files) => replaceGalleryItem(item.key, files)} />
                      <IconBtn
                        label="Remove image"
                        danger
                        disabled={saving}
                        onClick={() => {
                          setGallery((g) => g.filter((m) => m.key !== item.key));
                          setDirty(true);
                        }}
                      >
                        <Trash2 size={15} />
                      </IconBtn>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Visibility">
            <div className="space-y-3">
              <Toggle
                id={`${uid}-pub`}
                label={fields.is_published ? "Published" : "Draft"}
                description="Published projects appear on the public website."
                checked={fields.is_published}
                onChange={(v) => update("is_published", v)}
              />
              <Toggle
                id={`${uid}-feat`}
                label="Featured project"
                description="Featured projects are shown first with a badge."
                checked={fields.is_featured}
                onChange={(v) => update("is_featured", v)}
              />
              {fields.is_published && !hasImage && (
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  Add a cover image — published projects without images look empty on the website.
                </p>
              )}
            </div>
          </Card>

          <Card title="Cover image" description="The main image shown on the portfolio card.">
            {cover ? (
              <div>
                <div className="relative overflow-hidden rounded-xl border border-line bg-ink-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover.previewUrl} alt="Cover preview" className="max-h-72 w-full object-contain" />
                  {typeof cover.progress === "number" && cover.progress < 100 && <ProgressBar value={cover.progress} />}
                </div>
                <label htmlFor={`${uid}-cover-alt`} className="mt-4 block text-xs font-semibold text-muted">
                  Cover alt text
                </label>
                <input
                  id={`${uid}-cover-alt`}
                  value={cover.alt}
                  maxLength={300}
                  placeholder="e.g. Minimal coffee brand logo in navy and gold"
                  onChange={(e) => {
                    const v = e.target.value;
                    setCover((c) => (c ? { ...c, alt: v } : c));
                    setDirty(true);
                  }}
                  className={cn(inputClass, "mt-1 min-h-10 text-sm")}
                />
                <div className="mt-3 flex gap-2">
                  <ReplaceButton disabled={saving} onFile={setCoverFile} withLabel />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setCover(null);
                      setDirty(true);
                    }}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-semibold text-red-300 hover:border-red-500/60"
                  >
                    <Trash2 size={14} aria-hidden /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <ImageDropzone onFiles={setCoverFile} label="Drop the cover image" disabled={saving} />
            )}
          </Card>

          {!isNew && (
            <Card title="Danger zone">
              <p className="text-sm text-muted">Deleting removes the project and all of its images permanently.</p>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-red-500/50 px-4 text-sm font-bold text-red-300 hover:bg-red-500/10"
              >
                <Trash2 size={16} aria-hidden /> Delete project
              </button>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete “${project?.title ?? ""}”?`}
        description="This permanently deletes the project, its cover and all gallery images. This cannot be undone."
        busy={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={onDelete}
      />
    </form>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="absolute inset-x-0 bottom-0 bg-ink/80 p-1" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-electric transition-[width]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-9 place-items-center rounded-lg border border-line text-slate-300 transition disabled:opacity-30",
        danger ? "hover:border-red-500/60 hover:text-red-300" : "hover:border-electric hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function ReplaceButton({
  onFile,
  disabled,
  withLabel,
}: {
  onFile: (files: File[]) => void;
  disabled?: boolean;
  withLabel?: boolean;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      title="Replace image"
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line text-slate-300 transition hover:border-electric hover:text-white",
        withLabel ? "min-h-9 rounded-full px-3.5 text-sm font-semibold" : "size-9",
        disabled && "pointer-events-none opacity-30",
      )}
    >
      {withLabel ? <ImagePlus size={14} aria-hidden /> : <RefreshCw size={15} aria-hidden />}
      {withLabel ? "Replace" : <span className="sr-only">Replace image</span>}
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files?.length) onFile(Array.from(e.target.files));
          e.target.value = "";
        }}
      />
    </label>
  );
}
