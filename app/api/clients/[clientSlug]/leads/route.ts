import { NextResponse } from "next/server";
import { z } from "zod";
import { clientService } from "@/lib/services/client-service";
import { leadService } from "@/lib/services/lead-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { submitLeadSchema } from "@/lib/validation/lead";

interface RouteContext {
  params: Promise<{ clientSlug: string }>;
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { clientSlug } = await context.params;
    const ip = getClientIp(request);
    const rate = checkRateLimit(`leads:${clientSlug}:${ip}`, 15, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const client = await clientService.getClientBySlug(clientSlug);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = submitLeadSchema.parse(body);

    const lead = await leadService.createLead({
      client_id: client.id,
      ...parsed,
      email: parsed.email || undefined,
      form_data: parsed.form_data as Record<string, unknown>,
      source: parsed.source ?? "embed-lead-form",
      ip_address: ip,
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create lead" },
      { status: 500 },
    );
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { clientSlug } = await context.params;
    const config = await leadService.getLeadFormConfig(clientSlug);
    if (!config) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json({ client_id: config.client_id, fields: config.fields });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load lead fields" },
      { status: 500 },
    );
  }
}
