export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

/** Returns null when Supabase is not configured (the public site then falls back to defaults). */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || url.includes("your-project-ref")) return null;
  return { url, anonKey };
}

export function requireSupabaseEnv(): SupabaseEnv {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return env;
}

export const STORAGE_BUCKET = "portfolio";
