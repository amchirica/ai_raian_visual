import { NextResponse } from "next/server";
import { z } from "zod";
import { clientService } from "@/lib/services/client-service";
import { toJson } from "@/lib/utils";

const createClientSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  domain: z.string().optional(),
  is_active: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
  profile: z
    .object({
      company_name: z.string().optional(),
      tagline: z.string().optional(),
      description: z.string().optional(),
      logo_url: z.string().optional(),
      primary_color: z.string().optional(),
      secondary_color: z.string().optional(),
      contact_email: z.string().email().optional().or(z.literal("")),
      contact_phone: z.string().optional(),
      address: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
});

export async function GET() {
  try {
    const clients = await clientService.listClients();
    return NextResponse.json({ clients });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list clients" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createClientSchema.parse(body);
    const client = await clientService.createClient({
      ...parsed,
      settings: parsed.settings ? toJson(parsed.settings) : undefined,
    });
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create client" },
      { status: 500 },
    );
  }
}
