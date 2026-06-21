import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPublicAdminPath, isWidgetCorsPath, requiresAuth } from "@/lib/auth/paths";
import { updateSession } from "@/lib/supabase/middleware";

function applyWidgetCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");

  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Vary", "Origin");
  } else {
    response.headers.set("Access-Control-Allow-Origin", "*");
  }

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  return response;
}

async function isActivePlatformAdmin(
  supabase: Awaited<ReturnType<typeof updateSession>>["supabase"],
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("id", userId)
    .eq("is_active", true)
    .maybeSingle();
  return Boolean(data);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { user, supabase, supabaseResponse } = await updateSession(request);

  if (isWidgetCorsPath(pathname)) {
    return applyWidgetCors(request, supabaseResponse);
  }

  const needsAuth = requiresAuth(pathname, request.method);

  if (needsAuth && !user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (needsAuth && user) {
    const isAdmin = await isActivePlatformAdmin(supabase, user.id);
    if (!isAdmin) {
      await supabase.auth.signOut();
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("error", "not_authorized");
      return NextResponse.redirect(loginUrl);
    }
  }

  if (user && isPublicAdminPath(pathname)) {
    const isAdmin = await isActivePlatformAdmin(supabase, user.id);
    if (isAdmin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/offers/:path*",
    "/api/followups/:path*",
    "/api/content/:path*",
    "/api/leads/:path*",
    "/widget/:path*",
    "/embed/:path*",
    "/api/assistant/:path*",
    "/api/clients/:path*",
  ],
};
