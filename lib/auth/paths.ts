const PUBLIC_ADMIN_PATHS = ["/admin/login"];

const PUBLIC_API_PREFIXES = [
  "/api/assistant",
  "/api/clients/",
  "/api/webhooks/",
  "/widget/",
  "/embed/",
];

export function isPublicAdminPath(pathname: string): boolean {
  return PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isAdminUiPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function requiresAuth(pathname: string, method: string): boolean {
  if (isPublicAdminPath(pathname)) return false;

  if (isAdminUiPath(pathname)) return true;

  if (pathname.startsWith("/api/admin")) return true;

  if (pathname.startsWith("/api/offers")) return true;
  if (pathname.startsWith("/api/followups")) return true;
  if (pathname.startsWith("/api/content")) return true;

  if (pathname.startsWith("/api/leads")) {
    if (method === "POST" && pathname === "/api/leads") return false;
    return true;
  }

  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (pathname.startsWith("/api/clients/") && pathname.includes("/leads") && method === "POST") {
      return false;
    }
    if (pathname.includes("lead-form-config") && method === "GET") return false;
    if (pathname.includes("/chat") && method === "POST") return false;
    if (pathname.includes("/offers/") && pathname.endsWith("/pdf") && method === "GET") return false;
    return false;
  }

  return false;
}

export function isWidgetCorsPath(pathname: string): boolean {
  return (
    pathname.startsWith("/widget/") ||
    pathname.startsWith("/embed/") ||
    pathname === "/api/leads" ||
    pathname.startsWith("/api/assistant/") ||
    !!pathname.match(/^\/api\/clients\/[^/]+\/(lead-form-config|leads)$/)
  );
}
