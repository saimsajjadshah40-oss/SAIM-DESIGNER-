"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ExternalLink, Info, Lock, MessageCircle, Send } from "lucide-react";
import { Reveal } from "@/components/animations/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WhatsAppIcon } from "@/components/ui/BrandIcons";
import { DESIGN_SERVICES, inquirySchema } from "@/lib/validation/inquiry";
import { buildInquiryMessage, formatWhatsAppDisplay, whatsappLink } from "@/lib/utils/whatsapp";
import { cn } from "@/lib/utils";

type FieldName = "name" | "whatsapp" | "email" | "service" | "details" | "budget" | "deadline";
type Errors = Partial<Record<FieldName, string>>;

const EMPTY: Record<FieldName, string> = {
  name: "",
  whatsapp: "",
  email: "",
  service: "",
  details: "",
  budget: "",
  deadline: "",
};

function formatDeadline(value: string): string {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function ContactSection({
  heading,
  description,
  whatsapp,
}: {
  heading: string;
  description: string;
  whatsapp: string;
}) {
  const formId = useId();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [openedLink, setOpenedLink] = useState<string | null>(null);

  const set = (field: FieldName) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOpenedLink(null);
    const parsed = inquirySchema.safeParse({
      ...values,
      email: values.email || undefined,
      budget: values.budget || undefined,
      deadline: values.deadline || undefined,
    });

    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      const first = Object.keys(next)[0];
      if (first) document.getElementById(`${formId}-${first}`)?.focus();
      return;
    }

    const message = buildInquiryMessage({
      ...parsed.data,
      deadline: parsed.data.deadline ? formatDeadline(parsed.data.deadline) : undefined,
    });
    const link = whatsappLink(whatsapp, message);
    // Note: passing "noopener" makes window.open() always return null, so we
    // detach the opener manually instead and keep a reliable popup-blocked check.
    const win = window.open(link, "_blank");
    if (win) {
      win.opener = null;
    } else {
      // popup blocked (common on mobile in-app browsers) → navigate in the same tab
      window.location.href = link;
    }
    setOpenedLink(link);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative overflow-hidden bg-ink py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[28rem] w-[60rem] -translate-x-1/2 rounded-full bg-brand/15 blur-[150px]" />
      <div className="relative mx-auto grid max-w-[90rem] gap-14 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-12">
        <div>
          <SectionHeading id="contact-title" index="05" eyebrow="Contact Me" title={heading} description={description} />

          <Reveal delay={0.15} className="mt-10 space-y-4">
            <a
              href={whatsappLink(whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-line bg-ink-2/70 p-5 transition hover:border-electric/60"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-[#25D366]/15 text-[#25D366]">
                <WhatsAppIcon size={24} />
              </span>
              <span>
                <span className="block text-xs font-bold uppercase tracking-[0.2em] text-muted">WhatsApp</span>
                <span className="block font-display text-xl font-bold text-white group-hover:text-glow">
                  {formatWhatsAppDisplay(whatsapp)}
                </span>
              </span>
            </a>
            <p className="flex gap-3 rounded-2xl border border-line/70 p-5 text-sm leading-relaxed text-muted">
              <Lock size={18} className="mt-0.5 shrink-0 text-glow" aria-hidden />
              <span>
                <strong className="text-white">Your privacy:</strong> this form doesn&apos;t store anything on this
                website. Your details are only placed into a WhatsApp message that you review and send yourself.
                Email, budget and deadline are optional.
              </span>
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <form
            noValidate
            onSubmit={onSubmit}
            aria-describedby={`${formId}-hint`}
            className="relative rounded-3xl border border-line bg-linear-to-b from-ink-2 to-ink p-6 shadow-[0_40px_120px_-60px_rgb(37_99_235/0.6)] sm:p-9"
          >
            <p id={`${formId}-hint`} className="mb-6 text-sm text-muted">
              Fields marked <span className="text-glow">*</span> are required.
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id={`${formId}-name`} label="Full Name" required error={errors.name}>
                <input
                  id={`${formId}-name`}
                  name="name"
                  autoComplete="name"
                  value={values.name}
                  onChange={set("name")}
                  maxLength={80}
                  placeholder="Your full name"
                  {...aria(formId, "name", errors.name)}
                  className={inputCls(errors.name)}
                />
              </Field>
              <Field id={`${formId}-whatsapp`} label="WhatsApp Number" required error={errors.whatsapp}>
                <input
                  id={`${formId}-whatsapp`}
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={values.whatsapp}
                  onChange={set("whatsapp")}
                  maxLength={20}
                  placeholder="+92 300 1234567"
                  {...aria(formId, "whatsapp", errors.whatsapp)}
                  className={inputCls(errors.whatsapp)}
                />
              </Field>
              <Field id={`${formId}-email`} label="Email Address" error={errors.email}>
                <input
                  id={`${formId}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={set("email")}
                  maxLength={120}
                  placeholder="Optional"
                  {...aria(formId, "email", errors.email)}
                  className={inputCls(errors.email)}
                />
              </Field>
              <Field id={`${formId}-service`} label="Design Service" required error={errors.service}>
                <select
                  id={`${formId}-service`}
                  name="service"
                  value={values.service}
                  onChange={set("service")}
                  {...aria(formId, "service", errors.service)}
                  className={cn(inputCls(errors.service), "appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10", !values.service && "text-muted")}
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360A5FA' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                  }}
                >
                  <option value="" disabled>
                    Choose a service
                  </option>
                  {DESIGN_SERVICES.map((s) => (
                    <option key={s} value={s} className="bg-ink-2 text-white">
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id={`${formId}-details`} label="Project Details" required error={errors.details} className="sm:col-span-2">
                <textarea
                  id={`${formId}-details`}
                  name="details"
                  rows={5}
                  value={values.details}
                  onChange={set("details")}
                  maxLength={1500}
                  placeholder="Tell me about your brand, what you need, preferred style, sizes…"
                  {...aria(formId, "details", errors.details)}
                  className={cn(inputCls(errors.details), "min-h-32 resize-y py-3")}
                />
              </Field>
              <Field id={`${formId}-budget`} label="Estimated Budget" error={errors.budget}>
                <input
                  id={`${formId}-budget`}
                  name="budget"
                  value={values.budget}
                  onChange={set("budget")}
                  maxLength={60}
                  placeholder="Optional, e.g. PKR 10,000"
                  {...aria(formId, "budget", errors.budget)}
                  className={inputCls(errors.budget)}
                />
              </Field>
              <Field id={`${formId}-deadline`} label="Preferred Deadline" error={errors.deadline}>
                <input
                  id={`${formId}-deadline`}
                  name="deadline"
                  type="date"
                  min={today}
                  value={values.deadline}
                  onChange={set("deadline")}
                  {...aria(formId, "deadline", errors.deadline)}
                  className={cn(inputCls(errors.deadline), "[color-scheme:dark]")}
                />
              </Field>
            </div>

            <button type="submit" className="btn-primary mt-8 w-full sm:w-auto">
              <Send size={18} aria-hidden /> Send Inquiry on WhatsApp
            </button>

            <AnimatePresence>
              {openedLink && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  role="status"
                  className="mt-6 flex gap-3 rounded-2xl border border-electric/40 bg-brand/10 p-4 text-sm leading-relaxed text-slate-200"
                >
                  <Info size={18} className="mt-0.5 shrink-0 text-glow" aria-hidden />
                  <div>
                    <p className="font-semibold text-white">WhatsApp opened — pending confirmation</p>
                    <p className="mt-1">
                      Your inquiry has been prepared in WhatsApp. It is <strong>not sent yet</strong> — please press
                      <strong> Send</strong> inside WhatsApp to deliver it.
                    </p>
                    <a
                      href={openedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 font-semibold text-glow underline-offset-4 hover:underline"
                    >
                      <MessageCircle size={15} aria-hidden /> WhatsApp didn&apos;t open? Tap here
                      <ExternalLink size={13} aria-hidden />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

function aria(formId: string, field: FieldName, error?: string) {
  return {
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? `${formId}-${field}-error` : undefined,
  };
}

function inputCls(error?: string) {
  return cn(
    "w-full min-h-12 rounded-xl border bg-ink/80 px-4 text-[0.95rem] text-white placeholder:text-slate-500 outline-none transition",
    "focus:border-electric focus:ring-4 focus:ring-electric/15",
    error ? "border-red-500/70" : "border-line hover:border-slate-600",
  );
}

function Field({
  id,
  label,
  required,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-200">
        {label} {required ? <span className="text-glow">*</span> : <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-sm text-red-400">
          <AlertCircle size={14} aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}
