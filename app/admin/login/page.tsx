import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { getAdminContext } from "@/lib/auth/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  config: "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  denied: "That account does not have access to the admin dashboard.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  if (getSupabaseEnv() && (await getAdminContext())) redirect("/admin/dashboard");

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-ink px-5 py-16">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-[150px]" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted transition hover:text-white">
          <ArrowLeft size={16} aria-hidden /> Back to website
        </Link>
        <div className="rounded-3xl border border-line bg-ink-2/80 p-8 shadow-[0_40px_120px_-50px_rgb(37_99_235/0.7)] backdrop-blur-xl sm:p-10">
          <div className="mb-8">
            <span className="grid size-12 place-items-center rounded-2xl border border-electric/40 bg-brand/15 text-glow">
              <ShieldCheck size={24} aria-hidden />
            </span>
            <h1 className="mt-5 font-display text-3xl font-extrabold text-white">Admin sign in</h1>
            <p className="mt-2 text-sm text-muted">SAIM DESIGNER content dashboard. Authorised access only.</p>
          </div>
          <LoginForm initialError={error ? MESSAGES[error] : undefined} />
        </div>
      </div>
    </main>
  );
}
