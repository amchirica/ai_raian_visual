import { NextResponse } from "next/server";
import { z } from "zod";
import { clientService } from "@/lib/services/client-service";
import { toJson } from "@/lib/utils";

const updateSchema = z.object({
  client: z
    .object({
      name: z.string().min(2).optional(),
      slug: z.string().min(2).optional(),
      domain: z.string().nullable().optional(),
      is_active: z.boolean().optional(),
      settings: z.record(z.unknown()).optional(),
    })
    .optional(),
  profile: z
    .object({
      company_name: z.string().optional(),
      tagline: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      contact_email: z.string().nullable().optional(),
      contact_phone: z.string().nullable().optional(),
      website: z.string().nullable().optional(),
      primary_color: z.string().optional(),
      secondary_color: z.string().optional(),
    })
    .optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const client = await clientService.getClientById(id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get client" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    let client = null;
    if (parsed.client) {
      client = await clientService.updateClient(id, {
        ...parsed.client,
        settings: parsed.client.settings ? toJson(parsed.client.settings) : undefined,
      });
    }
    if (parsed.profile) {
      await clientService.updateBusinessProfile(id, parsed.profile);
    }

    const updated = await clientService.getClientById(id);
    return NextResponse.json(updated ?? client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update client" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await clientService.deleteClient(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete client" },
      { status: 500 },
    );
  }
}
