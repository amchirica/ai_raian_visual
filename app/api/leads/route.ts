import { NextResponse } from "next/server";
import { z } from "zod";
import { clientService } from "@/lib/services/client-service";
import { leadService } from "@/lib/services/lead-service";
import { checkRateLimit } from "@/lib/rate-limit";
import { createLeadSchema } from "@/lib/validation/lead";

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const search = searchParams.get("search") ?? undefined;

    if (!clientId) {
      return NextResponse.json({ error: "client_id query param required" }, { status: 400 });
    }

    const leads = await leadService.listLeads(clientId, { category, status, search });
    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list leads" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`leads:${ip}`, 15, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "X-RateLimit-Reset": String(rate.resetAt) } },
      );
    }

    const body = await request.json();
    const parsed = createLeadSchema.parse(body);

    let clientId = parsed.client_id;
    if (!clientId && parsed.client_slug) {
      const client = await clientService.getClientBySlug(parsed.client_slug);
      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
      clientId = client.id;
    }

    if (!clientId) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const lead = await leadService.createLead({
      client_id: clientId,
      source: parsed.source ?? "api",
      name: parsed.name,
      email: parsed.email || undefined,
      phone: parsed.phone,
      company: parsed.company,
      message: parsed.message,
      form_data: parsed.form_data as Record<string, unknown>,
      ip_address: ip,
    });

    return NextResponse.json(
      {
        success: true,
        lead: {
          id: lead.id,
          score: lead.score,
          score_category: lead.score_category,
          recommended_action: lead.recommended_action,
        },
      },
      { status: 201 },
    );
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
