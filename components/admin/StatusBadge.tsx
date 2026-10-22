export function StatusBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
      Published
    </span>
  ) : (
    <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
      Draft
    </span>
  );
}
