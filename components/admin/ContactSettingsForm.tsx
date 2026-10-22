"use client";

import { useState } from "react";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { Card, FieldShell, inputClass } from "./FormControls";
import { useSave } from "./useSave";
import { updateSettings } from "@/app/admin/dashboard/settings-actions";
import { formatWhatsAppDisplay, whatsappLink } from "@/lib/utils/whatsapp";
import { cn } from "@/lib/utils";
import type { ContactSettings } from "@/types/content";

export function ContactSettingsForm({ initial }: { initial: ContactSettings }) {
  const [v, setV] = useState(initial);
  const { save, pending, errors } = useSave();
  const digits = v.whatsapp.replace(/\D/g, "");

  return (
    <Card title="Contact settings" description="Used by every Hire Me button, the contact form and the floating WhatsApp button.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(() => updateSettings("contact", v));
        }}
        className="space-y-5"
      >
        <FieldShell
          id="wa"
          label="WhatsApp number"
          required
          error={errors.whatsapp}
          hint="Full international format without + or spaces, e.g. 923228037525."
        >
          <input
            id="wa"
            inputMode="numeric"
            value={v.whatsapp}
            maxLength={20}
            onChange={(e) => setV((s) => ({ ...s, whatsapp: e.target.value }))}
            className={inputClass}
          />
        </FieldShell>
        {digits.length >= 10 && (
          <p className="text-sm text-muted">
            Displays as <strong className="text-white">{formatWhatsAppDisplay(digits)}</strong> ·{" "}
            <a href={whatsappLink(digits)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-glow hover:underline">
              Test link <ExternalLink size={12} aria-hidden />
            </a>
          </p>
        )}
        <FieldShell id="c-heading" label="Contact heading" required error={errors.heading}>
          <input id="c-heading" value={v.heading} maxLength={80} onChange={(e) => setV((s) => ({ ...s, heading: e.target.value }))} className={inputClass} />
        </FieldShell>
        <FieldShell id="c-desc" label="Contact description" required error={errors.description}>
          <textarea id="c-desc" rows={3} value={v.description} maxLength={300} onChange={(e) => setV((s) => ({ ...s, description: e.target.value }))} className={cn(inputClass, "py-2.5")} />
        </FieldShell>
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn-primary min-h-10 px-5 text-sm">
            {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Save size={16} aria-hidden />} Save contact settings
          </button>
        </div>
      </form>
    </Card>
  );
}
