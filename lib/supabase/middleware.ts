import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Refreshes the Supabase session cookie and blocks unauthenticated visitors
 * from /admin/dashboard. (Admin-role verification happens server-side in the
 * dashboard layout and in every Server Action — this is only the first gate.)
 */
export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  const { pathname } = request.nextUrl;
  const isDashboard = pathname.startsWith("/admin/dashboard");

  if (!env) {
    if (isDashboard) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "?error=config";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: getUser() revalidates the JWT with Supabase Auth — never trust getSession() here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isDashboard && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname === "/admin" || pathname === "/admin/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/admin/dashboard" : "/admin/login";
    return NextResponse.redirect(url);
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
