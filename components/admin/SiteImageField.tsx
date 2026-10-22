"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { ImageDropzone } from "./ImageDropzone";
import { useToast } from "./Toast";
import { inputClass } from "./FormControls";
import { newObjectPath, removeUploaded, uploadImage, validateImageFile } from "@/lib/upload/client";
import { setSiteImage } from "@/app/admin/dashboard/settings-actions";
import { cn, mediaUrl } from "@/lib/utils";

export function SiteImageField({
  kind,
  currentPath,
  currentAlt = "",
  hint,
  previewClassName,
}: {
  kind: "portrait" | "og";
  currentPath: string | null;
  currentAlt?: string;
  hint?: string;
  previewClassName?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [alt, setAlt] = useState(currentAlt);
  const preview = mediaUrl(currentPath);

  async function onFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) return toast("error", problem);

    setBusy(true);
    setProgress(0);
    const path = newObjectPath("site", file);
    try {
      await uploadImage(path, file, setProgress);
      const res = await setSiteImage(kind, { path, alt });
      if (!res.ok) {
        await removeUploaded([path]);
        throw new Error(res.message);
      }
      toast("success", res.message);
      router.refresh();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function saveAlt() {
    if (!currentPath) return;
    setBusy(true);
    const res = await setSiteImage(kind, { path: currentPath, alt });
    setBusy(false);
    toast(res.ok ? "success" : "error", res.ok ? "Alt text saved." : res.message);
  }

  async function remove() {
    setBusy(true);
    const res = await setSiteImage(kind, { path: null, alt: "" });
    setBusy(false);
    toast(res.ok ? "success" : "error", res.message);
    if (res.ok) router.refresh();
  }

  return (
    <div className="grid gap-5 sm:grid-cols-[12rem_1fr]">
      <div
        className={cn(
          "relative grid place-items-center overflow-hidden rounded-xl border border-line bg-[radial-gradient(circle,rgb(37_99_235/0.35),transparent_70%)]",
          previewClassName ?? "aspect-[3/4]",
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Current image" className="size-full object-contain" />
        ) : (
          <span className="px-4 text-center text-xs text-muted">No image yet — the website shows a placeholder.</span>
        )}
        {progress !== null && (
          <div className="absolute inset-x-2 bottom-2 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
            <div className="h-full bg-electric transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <div className="space-y-4">
        <ImageDropzone onFiles={onFiles} disabled={busy} compact label={preview ? "Drop a new image to replace" : "Drop an image"} hint={hint} />
        {kind === "portrait" && (
          <div>
            <label htmlFor={`${kind}-alt`} className="mb-1.5 block text-sm font-semibold text-slate-200">
              Alt text
            </label>
            <div className="flex gap-2">
              <input
                id={`${kind}-alt`}
                value={alt}
                maxLength={200}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Portrait of Saim Sajjad, graphic designer"
                className={inputClass}
              />
              {currentPath && (
                <button type="button" onClick={saveAlt} disabled={busy} className="shrink-0 rounded-xl border border-line px-4 text-sm font-semibold hover:border-electric">
                  Save
                </button>
              )}
            </div>
          </div>
        )}
        {currentPath && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-semibold text-red-300 hover:border-red-500/60"
          >
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Trash2 size={14} aria-hidden />} Remove image
          </button>
        )}
      </div>
    </div>
  );
}
