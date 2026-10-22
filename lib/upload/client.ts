"use client";

import { createBrowserSupabase } from "@/lib/supabase/client";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/validation/admin";

const BUCKET = "portfolio";

export function validateImageFile(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type) || !["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return `"${file.name}" isn't supported. Use JPG, JPEG, PNG or WebP.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. The maximum is 10 MB.`;
  }
  if (file.size === 0) return `"${file.name}" is empty.`;
  return null;
}

export function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

function extFor(file: File) {
  return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
}

export function newObjectPath(folder: string, file: File) {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
  return `${folder}/${id}.${extFor(file)}`;
}

/**
 * Uploads straight from the browser to Supabase Storage (so large images never
 * pass through a serverless function), with real progress events.
 * Authorisation is enforced by the bucket's RLS policies (admin only) and the
 * bucket's own MIME-type and 10 MB size limits.
 */
export async function uploadImage(
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const supabase = createBrowserSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Your session has expired. Please sign in again.");

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/+$/, "");
  const url = `${base}/storage/v1/object/${BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.setRequestHeader("cache-control", "max-age=31536000");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        let message = `Upload failed (${xhr.status}).`;
        try {
          const body = JSON.parse(xhr.responseText);
          if (body?.message) message = body.message;
        } catch {
          /* ignore */
        }
        if (xhr.status === 403 || xhr.status === 401) message = "Upload not allowed — admin access required.";
        reject(new Error(message));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading."));
    xhr.send(file);
  });
}

/** Best-effort removal of files uploaded during a save that then failed. */
export async function removeUploaded(paths: string[]) {
  if (!paths.length) return;
  try {
    await createBrowserSupabase().storage.from(BUCKET).remove(paths);
  } catch {
    /* ignore */
  }
}
