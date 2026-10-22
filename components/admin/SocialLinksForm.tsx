"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Card, inputClass } from "./FormControls";
import { useSave } from "./useSave";
import { updateSocialLinks } from "@/app/admin/dashboard/settings-actions";
import { SOCIAL_META } from "@/components/ui/BrandIcons";
import { cn } from "@/lib/utils";
import type { SocialLinkRow } from "@/types/content";

const PLACEHOLDER: Record<string, string> = {
  instagram: "https://www.instagram.com/yourname",
  facebook: "https://www.facebook.com/yourpage",
  behance: "https://www.behance.net/yourname",
  dribbble: "https://dribbble.com/yourname",
  linkedin: "https://www.linkedin.com/in/yourname",
  youtube: "https://www.youtube.com/@yourchannel",
};

export function SocialLinksForm({ initial }: { initial: SocialLinkRow[] }) {
  const [links, setLinks] = useState(initial.map((l) => ({ platform: l.platform, url: l.url ?? "", is_visible: l.is_visible })));
  const { save, pending, errors } = useSave();

  return (
    <Card
      title="Social media links"
      description="Icons appear in the hero and footer only when a link is added and set to visible. Add only accounts you own."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(() => updateSocialLinks(links));
        }}
        className="space-y-3"
      >
        {links.map((link, i) => {
          const meta = SOCIAL_META[link.platform];
          const error = errors[`${i}.url`];
          return (
            <div key={link.platform} className="rounded-xl border border-line bg-ink-2/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label htmlFor={`social-${link.platform}`} className="flex w-36 shrink-0 items-center gap-2.5 font-semibold">
                  <meta.Icon size={18} className="text-glow" /> {meta.label}
                </label>
                <input
                  id={`social-${link.platform}`}
                  type="url"
                  inputMode="url"
                  value={link.url}
                  placeholder={PLACEHOLDER[link.platform]}
                  maxLength={300}
                  aria-invalid={Boolean(error)}
                  onChange={(e) => {
                    const url = e.target.value;
                    setLinks((all) => all.map((l, j) => (j === i ? { ...l, url, is_visible: url ? l.is_visible || !all[j].url : false } : l)));
                  }}
                  className={cn(inputClass, "flex-1")}
                />
                <label className={cn("flex shrink-0 items-center gap-2 text-sm", !link.url && "opacity-40")}>
                  <input
                    type="checkbox"
                    checked={link.is_visible && Boolean(link.url)}
                    disabled={!link.url}
                    onChange={(e) => setLinks((all) => all.map((l, j) => (j === i ? { ...l, is_visible: e.target.checked } : l)))}
                    className="size-4 accent-[#3b82f6]"
                  />
                  Visible
                </label>
              </div>
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </div>
          );
        })}
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={pending} className="btn-primary min-h-10 px-5 text-sm">
            {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Save size={16} aria-hidden />} Save social links
          </button>
        </div>
      </form>
    </Card>
  );
}
