import { NextResponse } from "next/server";
import { webhookDispatcher } from "@/lib/webhooks";
import { toJson } from "@/lib/utils";
import type { WebhookEvent } from "@/lib/constants";
import { z } from "zod";

const schema = z.object({
  client_id: z.string().uuid(),
  event: z.enum([
    "lead.created",
    "lead.updated",
    "offer.created",
    "offer.sent",
    "followup.sent",
  ]),
  data: z.record(z.unknown()).default({}),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.parse(body);

    await webhookDispatcher.dispatch(
      parsed.client_id,
      parsed.event as WebhookEvent,
      toJson(parsed.data),
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
