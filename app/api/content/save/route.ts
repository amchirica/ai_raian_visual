import { NextResponse } from "next/server";
import { z } from "zod";
import { CONTENT_STATUSES } from "@/lib/constants";
import { contentService } from "@/lib/services/content-service";
import { optionalUuidNullable } from "@/lib/validation/uuid";

const schema = z.object({
  id: z.string().uuid().optional(),
  client_id: z.string().uuid(),
  content_type: z.string().min(1),
  title: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  body: z.string().min(1),
  status: z.enum(CONTENT_STATUSES).optional(),
  lead_id: optionalUuidNullable,
  offer_id: optionalUuidNullable,
});
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const content = await contentService.saveContent({
      id: parsed.id,
      client_id: parsed.client_id,
      content_type: parsed.content_type,
      title: parsed.title ?? null,
      subject: parsed.subject ?? null,
      body: parsed.body,
      status: parsed.status ?? "draft",
      lead_id: parsed.lead_id ?? null,
      offer_id: parsed.offer_id ?? null,
    });
    return NextResponse.json({ content });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Save failed" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = z.object({
      id: z.string().uuid(),
      status: z.enum(CONTENT_STATUSES),
    }).parse(body);
    const content = await contentService.updateContentStatus(id, status);
    return NextResponse.json({ content });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 },
    );
  }
}
