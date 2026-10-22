"use client";

import { RotateCcw } from "lucide-react";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-8 text-center">
      <h2 className="font-display text-xl font-bold">Something went wrong</h2>
      <p className="mt-2 text-sm text-red-200">
        The page couldn&apos;t load. Check your connection and that the database migration has been applied.
      </p>
      <button onClick={reset} className="btn-primary mt-6 min-h-11">
        <RotateCcw size={16} aria-hidden /> Try again
      </button>
    </div>
  );
}
