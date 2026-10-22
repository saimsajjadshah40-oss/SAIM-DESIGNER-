"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Card, FieldShell, ListInput, inputClass } from "./FormControls";
import { SiteImageField } from "./SiteImageField";
import { clean, useSave } from "./useSave";
import { updateProfile, updateSettings } from "@/app/admin/dashboard/settings-actions";
import { cn } from "@/lib/utils";
import type { ProfileRow, SiteSettings } from "@/types/content";

function SaveButton({ pending, label = "Save" }: { pending: boolean; label?: string }) {
  return (
    <button type="submit" disabled={pending} className="btn-primary min-h-10 px-5 text-sm disabled:opacity-70">
      {pending ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Save size={16} aria-hidden />}
      {pending ? "Saving…" : label}
    </button>
  );
}

function Text({
  id,
  label,
  value,
  onChange,
  error,
  max,
  hint,
  area,
  rows = 3,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  max: number;
  hint?: string;
  area?: boolean;
  rows?: number;
  className?: string;
}) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      {area ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          maxLength={max}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={cn(inputClass, "py-2.5")}
        />
      ) : (
        <input
          id={id}
          value={value}
          maxLength={max}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={inputClass}
        />
      )}
    </FieldShell>
  );
}

/* ── Hero ─────────────────────────────────────────────────────────────── */

function HeroForm({ initial, portraitPath, portraitAlt }: { initial: SiteSettings["hero"]; portraitPath: string | null; portraitAlt: string }) {
  const [v, setV] = useState(initial);
  const { save, pending, errors } = useSave();
  const set = <K extends keyof typeof v>(k: K) => (val: (typeof v)[K]) => setV((s) => ({ ...s, [k]: val }));

  return (
    <Card title="Homepage hero" description="The first thing visitors see.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(() => updateSettings("hero", { ...v, roles: clean(v.roles), marquee: clean(v.marquee) }));
        }}
        className="space-y-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Text id="hero-intro" label="Intro text" value={v.intro} onChange={set("intro")} error={errors.intro} max={40} />
          <Text id="hero-name" label="Designer name" value={v.name} onChange={set("name")} error={errors.name} max={60} />
          <Text id="hero-title" label="Professional title" value={v.title} onChange={set("title")} error={errors.title} max={80} />
          <div />
          <Text id="hero-desc" label="Hero description" value={v.description} onChange={set("description")} error={errors.description} max={240} area className="sm:col-span-2" />
          <Text id="hero-primary" label="Primary button label" value={v.primaryLabel} onChange={set("primaryLabel")} error={errors.primaryLabel} max={30} />
          <Text id="hero-secondary" label="Hire Me button label" value={v.secondaryLabel} onChange={set("secondaryLabel")} error={errors.secondaryLabel} max={30} />
          <FieldShell id="hero-roles" label="Animated titles" hint="One per line — they rotate under your name." error={errors.roles}>
            <ListInput id="hero-roles" value={v.roles} onChange={set("roles")} rows={5} />
          </FieldShell>
          <FieldShell id="hero-marquee" label="Scrolling service words" hint="One per line — shown in the strip under the hero." error={errors.marquee}>
            <ListInput id="hero-marquee" value={v.marquee} onChange={set("marquee")} rows={5} />
          </FieldShell>
        </div>
        <div className="flex justify-end">
          <SaveButton pending={pending} label="Save hero" />
        </div>
      </form>

      <div className="mt-8 border-t border-line pt-6">
        <h3 className="mb-1 font-semibold">Profile picture (hero portrait)</h3>
        <p className="mb-4 text-sm text-muted">
          For the cut-out look, upload a PNG or WebP with a transparent background, ideally at least 1200 px tall.
        </p>
        <SiteImageField kind="portrait" currentPath={portraitPath} currentAlt={portraitAlt} hint="Transparent PNG/WebP recommended · up to 10 MB" />
      </div>
    </Card>
  );
}

/* ── About ────────────────────────────────────────────────────────────── */

function AboutForm({ initial, profile }: { initial: SiteSettings["about"]; profile: ProfileRow }) {
  const [about, setAbout] = useState(initial);
  const [p, setP] = useState({
    display_name: profile.display_name,
    professional_title: profile.professional_title,
    experience: profile.experience,
    experience_caption: profile.experience_caption,
    about_text: profile.about_text,
    skills: profile.skills,
  });
  const s1 = useSave();
  const s2 = useSave();
  const errors = { ...s1.errors, ...s2.errors };

  return (
    <Card title="About Me" description="Your story, experience and skills.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          s1.save(() => updateSettings("about", about));
          s2.save(() => updateProfile({ ...p, skills: clean(p.skills) }));
        }}
        className="space-y-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Text id="about-heading" label="Section heading" value={about.heading} onChange={(v) => setAbout((s) => ({ ...s, heading: v }))} error={errors.heading} max={60} />
          <Text id="about-sub" label="Subheading" value={about.subheading} onChange={(v) => setAbout((s) => ({ ...s, subheading: v }))} error={errors.subheading} max={120} />
          <Text id="p-name" label="Display name" value={p.display_name} onChange={(v) => setP((s) => ({ ...s, display_name: v }))} error={errors.display_name} max={80} />
          <Text id="p-title" label="Professional title" value={p.professional_title} onChange={(v) => setP((s) => ({ ...s, professional_title: v }))} error={errors.professional_title} max={120} />
          <Text id="p-exp" label="Experience" value={p.experience} onChange={(v) => setP((s) => ({ ...s, experience: v }))} error={errors.experience} max={40} hint="e.g. 3–4 Years" />
          <Text id="p-exp-cap" label="Experience caption" value={p.experience_caption} onChange={(v) => setP((s) => ({ ...s, experience_caption: v }))} error={errors.experience_caption} max={80} />
          <Text
            id="p-about"
            label="About description"
            value={p.about_text}
            onChange={(v) => setP((s) => ({ ...s, about_text: v }))}
            error={errors.about_text}
            max={5000}
            area
            rows={10}
            hint="Leave an empty line between paragraphs."
            className="sm:col-span-2"
          />
          <FieldShell id="p-skills" label="Skills & software" hint="One per line. Confirm or edit your tools here." error={errors.skills} className="sm:col-span-2">
            <ListInput id="p-skills" value={p.skills} onChange={(v) => setP((s) => ({ ...s, skills: v }))} rows={8} />
          </FieldShell>
        </div>
        <div className="flex justify-end">
          <SaveButton pending={s1.pending || s2.pending} label="Save About" />
        </div>
      </form>
    </Card>
  );
}

/* ── Portfolio section texts ──────────────────────────────────────────── */

function PortfolioForm({ initial }: { initial: SiteSettings["portfolio"] }) {
  const [v, setV] = useState(initial);
  const { save, pending, errors } = useSave();
  const sections = [
    { key: "logo", label: "Logo section" },
    { key: "banner", label: "Banner section" },
    { key: "thumbnail", label: "Thumbnail section" },
  ] as const;

  return (
    <Card title="Portfolio sections" description="Headings, descriptions, buttons and banner categories.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(() => updateSettings("portfolio", { ...v, bannerCategories: clean(v.bannerCategories) }));
        }}
        className="space-y-6"
      >
        {sections.map(({ key, label }) => (
          <fieldset key={key} className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
            <legend className="px-1 text-sm font-bold text-glow">{label}</legend>
            <Text id={`${key}-h`} label="Heading" value={v[key].heading} onChange={(val) => setV((s) => ({ ...s, [key]: { ...s[key], heading: val } }))} error={errors[`${key}.heading`]} max={80} />
            <Text id={`${key}-cta`} label="Button label" value={v[key].cta} onChange={(val) => setV((s) => ({ ...s, [key]: { ...s[key], cta: val } }))} error={errors[`${key}.cta`]} max={40} />
            <Text id={`${key}-d`} label="Description" value={v[key].description} onChange={(val) => setV((s) => ({ ...s, [key]: { ...s[key], description: val } }))} error={errors[`${key}.description`]} max={300} area className="sm:col-span-2" />
          </fieldset>
        ))}
        <FieldShell id="banner-cats" label="Banner categories (filters)" hint="One per line. Filters only show when a published banner uses that category." error={errors.bannerCategories}>
          <ListInput id="banner-cats" value={v.bannerCategories} onChange={(val) => setV((s) => ({ ...s, bannerCategories: val }))} rows={5} />
        </FieldShell>
        <div className="flex justify-end">
          <SaveButton pending={pending} label="Save portfolio texts" />
        </div>
      </form>
    </Card>
  );
}

/* ── SEO + footer ─────────────────────────────────────────────────────── */

function SeoForm({ initial }: { initial: SiteSettings["seo"] }) {
  const [v, setV] = useState({ title: initial.title, description: initial.description });
  const { save, pending, errors } = useSave();
  return (
    <Card title="SEO" description="How the site appears in Google and when shared.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(() => updateSettings("seo", { ...v, ogImage: initial.ogImage }));
        }}
        className="space-y-5"
      >
        <Text id="seo-title" label="Website title" value={v.title} onChange={(t) => setV((s) => ({ ...s, title: t }))} error={errors.title} max={70} hint={`${v.title.length}/70 — around 60 characters is ideal.`} />
        <Text id="seo-desc" label="Meta description" value={v.description} onChange={(t) => setV((s) => ({ ...s, description: t }))} error={errors.description} max={170} area hint={`${v.description.length}/170 — around 150 characters is ideal.`} />
        <div className="flex justify-end">
          <SaveButton pending={pending} label="Save SEO" />
        </div>
      </form>
      <div className="mt-8 border-t border-line pt-6">
        <h3 className="mb-1 font-semibold">Social sharing image</h3>
        <p className="mb-4 text-sm text-muted">Shown when your link is shared on WhatsApp, Facebook, X, LinkedIn. Use 1200 × 630 px.</p>
        <SiteImageField kind="og" currentPath={initial.ogImage} previewClassName="aspect-[1200/630]" hint="1200 × 630 px JPG/PNG/WebP · up to 10 MB" />
      </div>
    </Card>
  );
}

function FooterForm({ initial }: { initial: SiteSettings["footer"] }) {
  const [tagline, setTagline] = useState(initial.tagline);
  const { save, pending, errors } = useSave();
  return (
    <Card title="Footer">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(() => updateSettings("footer", { tagline }));
        }}
        className="space-y-5"
      >
        <Text id="footer-tagline" label="Tagline" value={tagline} onChange={setTagline} error={errors.tagline} max={160} />
        <div className="flex justify-end">
          <SaveButton pending={pending} label="Save footer" />
        </div>
      </form>
    </Card>
  );
}

export function ContentEditor({ settings, profile }: { settings: SiteSettings; profile: ProfileRow }) {
  return (
    <div className="space-y-6">
      <HeroForm initial={settings.hero} portraitPath={profile.profile_image_url} portraitAlt={profile.profile_image_alt ?? ""} />
      <AboutForm initial={settings.about} profile={profile} />
      <PortfolioForm initial={settings.portfolio} />
      <SeoForm initial={settings.seo} />
      <FooterForm initial={settings.footer} />
    </div>
  );
}
