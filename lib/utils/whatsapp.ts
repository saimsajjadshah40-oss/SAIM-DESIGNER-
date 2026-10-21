export const DEFAULT_WHATSAPP = "923228037525";

/** Keep digits only — wa.me requires the full international number without + or spaces. */
export function normalizeWhatsAppNumber(input: string | null | undefined): string {
  const digits = (input ?? "").replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? digits : DEFAULT_WHATSAPP;
}

export function whatsappLink(number: string, message?: string): string {
  const base = `https://wa.me/${normalizeWhatsAppNumber(number)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** "923228037525" → "+92 322 8037525" (Pakistani numbers), otherwise "+<digits>". */
export function formatWhatsAppDisplay(number: string): string {
  const d = normalizeWhatsAppNumber(number);
  if (d.startsWith("92") && d.length === 12) {
    return `+92 ${d.slice(2, 5)} ${d.slice(5)}`;
  }
  return `+${d}`;
}

export const WHATSAPP_MESSAGES = {
  hire: "Hi Saim, I visited your portfolio and would like to discuss a graphic design project.",
  floating:
    "Hi Saim, I visited your graphic design portfolio and would like to discuss a project.",
  logo: "Hi Saim, I saw your logo design portfolio and would like to request a logo design for my brand.",
  banner:
    "Hi Saim, I saw your banner design portfolio and would like to get a banner designed.",
  thumbnail:
    "Hi Saim, I saw your YouTube thumbnail designs and would like to request a thumbnail for my video.",
} as const;

export interface InquiryValues {
  name: string;
  whatsapp: string;
  email?: string;
  service: string;
  details: string;
  budget?: string;
  deadline?: string;
}

export function buildInquiryMessage(v: InquiryValues): string {
  const clean = (s: string | undefined) => (s ?? "").trim();
  return [
    "New Graphic Design Inquiry",
    "",
    `Name: ${clean(v.name)}`,
    "",
    `WhatsApp: ${clean(v.whatsapp)}`,
    "",
    `Email: ${clean(v.email) || "Not Provided"}`,
    "",
    `Service: ${clean(v.service)}`,
    "",
    `Project Details: ${clean(v.details)}`,
    "",
    `Budget: ${clean(v.budget) || "Not Specified"}`,
    "",
    `Deadline: ${clean(v.deadline) || "Flexible"}`,
    "",
    "I would like to discuss this project with you.",
  ].join("\n");
}
