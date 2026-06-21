import { NextResponse } from "next/server";
import { z } from "zod";
import { CONTENT_TYPES } from "@/lib/constants";
import { contentService } from "@/lib/services/content-service";
import { optionalUuid } from "@/lib/validation/uuid";

const schema = z.object({
  client_id: z.string().uuid(),
  content_type: z.enum(CONTENT_TYPES),
  context: z.string().max(5000).optional(),
  lead_id: optionalUuid,
  offer_id: optionalUuid,
  extra_instructions: z.string().max(2000).optional(),
});
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const content = await contentService.generateContent({
      client_id: parsed.client_id,
      content_type: parsed.content_type,
      context: parsed.context,
      lead_id: parsed.lead_id ?? undefined,
      offer_id: parsed.offer_id ?? undefined,
      extra_instructions: parsed.extra_instructions,
    });
    return NextResponse.json({ content }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 },
    );
  }
}
