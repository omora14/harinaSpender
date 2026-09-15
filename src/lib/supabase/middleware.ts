import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveMfaDestination } from "@/lib/auth/mfa";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLogin = pathname.startsWith("/login");
  const isMfa = pathname.startsWith("/mfa");
  const isApp =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname === "/";

  if (!user && (isApp || isMfa)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!user) {
    return supabaseResponse;
  }

  const destination = await resolveMfaDestination(supabase);

  if (isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    return NextResponse.redirect(url);
  }

  // Force MFA completion before app pages
  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/settings")) &&
    destination !== "/dashboard"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    return NextResponse.redirect(url);
  }

  // If already verified, keep them out of MFA pages
  if (isMfa && destination === "/dashboard") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Enroll vs verify routing
  if (pathname.startsWith("/mfa/enroll") && destination === "/mfa/verify") {
    const url = request.nextUrl.clone();
    url.pathname = "/mfa/verify";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/mfa/verify") && destination === "/mfa/enroll") {
    const url = request.nextUrl.clone();
    url.pathname = "/mfa/enroll";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
