import { NextResponse } from "next/server";
import { z } from "zod";
import { webhookDispatcher } from "@/lib/webhooks";
import { toJson } from "@/lib/utils";

const schema = z.object({
  client_id: z.string().uuid(),
  lead_id: z.string().uuid().optional(),
  data: z.record(z.unknown()).default({}),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);

    await webhookDispatcher.dispatch(
      parsed.client_id,
      "lead.created",
      toJson({ lead_id: parsed.lead_id, ...parsed.data }),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook dispatch failed" },
      { status: 500 },
    );
  }
}
