import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

async function logout(request: NextRequest) {
  if (getSupabaseEnv()) {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  }
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = request.nextUrl.searchParams.get("reason") === "denied" ? "?error=denied" : "";
  return NextResponse.redirect(url, { status: 303 });
}

// POST is used by the dashboard's logout button; GET is used for the
// automatic sign-out of authenticated users who are not the administrator.
export const POST = logout;
export const GET = logout;
