import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function toJson(value: unknown): import("@/types").Json {
  return value as import("@/types").Json;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateEmbedCode(clientSlug: string, widgetType: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `<!-- Iframe embed -->
<iframe
  src="${baseUrl}/embed/${clientSlug}/${widgetType}"
  width="100%"
  height="600"
  frameborder="0"
  style="border:0;border-radius:12px;"
></iframe>

<!-- Script tag embed -->
<script
  src="${baseUrl}/embed/widget.js"
  data-client="${clientSlug}"
  data-widget="${widgetType}"
  async
></script>`;
}
