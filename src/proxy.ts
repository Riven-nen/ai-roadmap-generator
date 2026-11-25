import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const publicAuthPages = new Set(["/login", "/forgot-password", "/reset-password"]);
  const isAuthPage = publicAuthPages.has(pathname);
  const isLoginPage = pathname === "/login";
  const isPublicApi = pathname === "/api/auth/login";
  const isPublicAsset =
    pathname.startsWith("/_next") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|csv)$/);

  if (isPublicAsset || isPublicApi) return response;

  if (!user && pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user && !isAuthPage) {
    return redirectTo("/login");
  }

  if (!user) return response;

  if (!pathname.startsWith("/api/")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("must_change_password")
      .eq("id", user.id)
      .single();

    const mustChangePassword = profile?.must_change_password === true;

    if (mustChangePassword && pathname !== "/set-password") {
      return redirectTo("/set-password");
    }

    if (!mustChangePassword && pathname === "/set-password") {
      return redirectTo("/");
    }
  }

  if (isLoginPage || pathname === "/forgot-password") {
    return redirectTo("/");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
