import { NextResponse } from "next/server";
import { z } from "zod";
import { assistantService } from "@/lib/services/assistant-service";
import { sanitizeString } from "@/lib/validation/sanitize";

const schema = z.object({
  client_slug: z.string().min(2),
  conversation_id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(50).optional(),
  message: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);

    const lead = await assistantService.createLeadFromChat(
      parsed.client_slug,
      parsed.conversation_id,
      {
        name: parsed.name ? sanitizeString(parsed.name) : undefined,
        email: parsed.email ? sanitizeString(parsed.email) : undefined,
        phone: parsed.phone ? sanitizeString(parsed.phone) : undefined,
        message: parsed.message ? sanitizeString(parsed.message) : undefined,
      },
    );

    return NextResponse.json({ success: true, lead: { id: lead.id } }, { status: 201 });
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
