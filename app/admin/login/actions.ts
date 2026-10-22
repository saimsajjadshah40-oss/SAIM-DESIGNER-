"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { loginSchema, firstError } from "@/lib/validation/admin";

export interface LoginState {
  error?: string;
}

function rateKey(parts: string[]): string {
  const salt = process.env.RATE_LIMIT_SALT || "saim-designer";
  return createHash("sha256").update([salt, ...parts].join("|")).digest("hex");
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!getSupabaseEnv()) {
    return { error: "Supabase is not configured yet. Add the environment variables first." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { email, password } = parsed.data;

  // Rate limit: 5 attempts / 15 min per IP and per IP+email (enforced in Postgres).
  const ip = await clientIp();
  const anon = createPublicClient();
  if (anon) {
    const [byIp, byPair] = await Promise.all([
      anon.rpc("register_login_attempt", { p_key: rateKey(["ip", ip]) }),
      anon.rpc("register_login_attempt", { p_key: rateKey(["pair", ip, email]) }),
    ]);
    if (byIp.error || byPair.error) {
      console.error("[login] rate-limit check failed", byIp.error ?? byPair.error);
      return { error: "Sign-in is temporarily unavailable. Please try again shortly." };
    }
    if (byIp.data === false || byPair.data === false) {
      return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
    }
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Incorrect email or password." };
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError || isAdmin !== true) {
    await supabase.auth.signOut();
    return { error: "This account does not have access to the admin dashboard." };
  }

  redirect("/admin/dashboard");
}
