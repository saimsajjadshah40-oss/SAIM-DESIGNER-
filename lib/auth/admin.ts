import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabase>>;

export interface AdminContext {
  supabase: ServerSupabase;
  user: User;
}

/** Verifies the JWT with Supabase Auth AND checks the admin_users table. */
export async function getAdminContext(): Promise<AdminContext | null> {
  if (!getSupabaseEnv()) return null;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("is_admin");
  if (error || data !== true) return null;

  return { supabase, user };
}

/** For Server Components: redirect anyone who is not the administrator. */
export async function requireAdminPage(): Promise<AdminContext> {
  if (!getSupabaseEnv()) redirect("/admin/login?error=config");
  const ctx = await getAdminContext();
  if (!ctx) {
    // Signed in but not an admin? End that session so it can't linger.
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/admin/logout?reason=denied");
    }
    redirect("/admin/login");
  }
  return ctx;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("You are not authorised to perform this action.");
  }
}

/** For Server Actions: throw (never silently continue) when the caller is not the admin. */
export async function requireAdminAction(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx) throw new UnauthorizedError();
  return ctx;
}
