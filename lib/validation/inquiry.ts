import { z } from "zod";

export const DESIGN_SERVICES = [
  "Logo Design",
  "Banner Design",
  "YouTube Thumbnail Design",
  "Social Media Design",
  "Brand Identity Design",
  "Other Graphic Design Services",
] as const;

const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;

export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(80, "Name is too long."),
  whatsapp: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid WhatsApp number, e.g. +92 300 1234567.")
    .refine((v) => {
      const digits = v.replace(/\D/g, "").length;
      return digits >= 10 && digits <= 15;
    }, "A WhatsApp number should have 10–15 digits including the country code."),
  email: z
    .string()
    .trim()
    .max(120)
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid email address."),
  service: z.enum(DESIGN_SERVICES, { errorMap: () => ({ message: "Please choose a design service." }) }),
  details: z
    .string()
    .trim()
    .min(15, "Please describe your project in a little more detail (at least 15 characters).")
    .max(1500, "Please keep project details under 1500 characters."),
  budget: z.string().trim().max(60, "Budget is too long.").optional(),
  deadline: z.string().trim().max(40).optional(),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
