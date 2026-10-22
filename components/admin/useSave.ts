"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import type { ActionResult } from "@/lib/actions/result";

/** Runs a server action, shows a toast, refreshes server data, and exposes field errors. */
export function useSave() {
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();

  const save = (fn: () => Promise<ActionResult<unknown>>, onSuccess?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        setErrors({});
        toast("success", res.message);
        onSuccess?.();
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast("error", res.message);
      }
    });

  return { save, pending, errors };
}

export const clean = (list: string[]) => list.map((s) => s.trim()).filter(Boolean);
