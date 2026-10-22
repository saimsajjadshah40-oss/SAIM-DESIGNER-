"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "./Toast";
import { ConfirmDialog } from "./ConfirmDialog";
import { deleteProject, moveProject, setProjectFlag } from "@/app/admin/dashboard/projects/actions";

export function ProjectRowActions({
  id,
  title,
  isPublished,
  isFeatured,
  isFirst,
  isLast,
  canReorder,
}: {
  id: string;
  title: string;
  isPublished: boolean;
  isFeatured: boolean;
  isFirst: boolean;
  isLast: boolean;
  canReorder: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);

  const run = (fn: () => Promise<{ ok: boolean; message: string }>) =>
    start(async () => {
      const res = await fn();
      toast(res.ok ? "success" : "error", res.message);
      if (res.ok) {
        setConfirm(false);
        router.refresh();
      }
    });

  const btn =
    "grid size-9 place-items-center rounded-lg border border-line text-slate-300 transition hover:border-electric hover:text-white disabled:opacity-30";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {pending && <Loader2 size={16} className="animate-spin text-glow" aria-label="Working" />}
      {canReorder && (
        <>
          <button type="button" className={btn} aria-label="Move up" title="Move up" disabled={isFirst || pending} onClick={() => run(() => moveProject(id, "up"))}>
            <ArrowUp size={15} />
          </button>
          <button type="button" className={btn} aria-label="Move down" title="Move down" disabled={isLast || pending} onClick={() => run(() => moveProject(id, "down"))}>
            <ArrowDown size={15} />
          </button>
        </>
      )}
      <button
        type="button"
        className={cn(btn, isPublished && "border-emerald-500/40 text-emerald-300")}
        aria-label={isPublished ? "Unpublish" : "Publish"}
        title={isPublished ? "Unpublish (move to drafts)" : "Publish"}
        disabled={pending}
        onClick={() => run(() => setProjectFlag(id, "is_published", !isPublished))}
      >
        {isPublished ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
      <button
        type="button"
        className={cn(btn, isFeatured && "border-glow/50 text-glow")}
        aria-label={isFeatured ? "Remove from featured" : "Mark as featured"}
        title={isFeatured ? "Remove from featured" : "Mark as featured"}
        aria-pressed={isFeatured}
        disabled={pending}
        onClick={() => run(() => setProjectFlag(id, "is_featured", !isFeatured))}
      >
        <Star size={15} className={isFeatured ? "fill-glow" : undefined} />
      </button>
      <Link href={`/admin/dashboard/projects/${id}`} className={btn} aria-label={`Edit ${title}`} title="Edit">
        <Pencil size={15} />
      </Link>
      <button
        type="button"
        className={cn(btn, "hover:border-red-500/60 hover:text-red-300")}
        aria-label={`Delete ${title}`}
        title="Delete"
        disabled={pending}
        onClick={() => setConfirm(true)}
      >
        <Trash2 size={15} />
      </button>

      <ConfirmDialog
        open={confirm}
        title={`Delete “${title}”?`}
        description="This permanently deletes the project and all of its images. This cannot be undone."
        busy={pending}
        onCancel={() => setConfirm(false)}
        onConfirm={() => run(() => deleteProject(id))}
      />
    </div>
  );
}
