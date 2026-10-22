"use client";

import { useState } from "react";
import { KeyRound, Loader2, LogOut, Mail, Save } from "lucide-react";
import { Card, FieldShell, inputClass } from "./FormControls";
import { SiteImageField } from "./SiteImageField";
import { useSave } from "./useSave";
import { changePassword, updateDisplayName } from "@/app/admin/dashboard/settings-actions";

export function AccountSettings({
  email,
  displayName,
  portraitPath,
  portraitAlt,
}: {
  email: string;
  displayName: string;
  portraitPath: string | null;
  portraitAlt: string;
}) {
  const [name, setName] = useState(displayName);
  const nameSave = useSave();

  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const pwSave = useSave();

  return (
    <div className="space-y-6">
      <Card title="Administrator account">
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-ink-2/50 p-4">
            <Mail size={18} className="text-glow" aria-hidden />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Signed in as</p>
              <p className="font-semibold">{email}</p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              nameSave.save(() => updateDisplayName({ displayName: name }));
            }}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <FieldShell id="display-name" label="Display name" error={nameSave.errors.displayName} className="flex-1">
              <input id="display-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </FieldShell>
            <button type="submit" disabled={nameSave.pending} className="btn-primary min-h-11 px-5 text-sm">
              {nameSave.pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Save size={16} aria-hidden />} Save
            </button>
          </form>
        </div>
      </Card>

      <Card title="Profile picture" description="Used as your hero portrait on the website and as your admin avatar.">
        <SiteImageField kind="portrait" currentPath={portraitPath} currentAlt={portraitAlt} hint="Transparent PNG/WebP recommended · up to 10 MB" />
      </Card>

      <Card title="Change password" description="At least 12 characters with upper- and lowercase letters and a number.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            pwSave.save(
              () => changePassword(pw),
              () => setPw({ currentPassword: "", newPassword: "", confirmPassword: "" }),
            );
          }}
          className="grid gap-5 sm:grid-cols-3"
        >
          {(
            [
              ["currentPassword", "Current password", "current-password"],
              ["newPassword", "New password", "new-password"],
              ["confirmPassword", "Confirm new password", "new-password"],
            ] as const
          ).map(([key, label, ac]) => (
            <FieldShell key={key} id={key} label={label} error={pwSave.errors[key]}>
              <input
                id={key}
                type="password"
                autoComplete={ac}
                value={pw[key]}
                maxLength={72}
                onChange={(e) => setPw((s) => ({ ...s, [key]: e.target.value }))}
                aria-invalid={Boolean(pwSave.errors[key])}
                className={inputClass}
              />
            </FieldShell>
          ))}
          <div className="sm:col-span-3 flex justify-end">
            <button type="submit" disabled={pwSave.pending} className="btn-primary min-h-11 px-5 text-sm">
              {pwSave.pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <KeyRound size={16} aria-hidden />} Update password
            </button>
          </div>
        </form>
      </Card>

      <Card title="Session">
        <form action="/admin/logout" method="post">
          <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-red-500/50 px-5 text-sm font-bold text-red-300 hover:bg-red-500/10">
            <LogOut size={16} aria-hidden /> Log out of the admin dashboard
          </button>
        </form>
      </Card>
    </div>
  );
}
