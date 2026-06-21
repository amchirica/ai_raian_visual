import { NextResponse } from "next/server";
import { z } from "zod";
import { webhookConfigService } from "@/lib/services/webhook-config-service";
import { WEBHOOK_EVENTS } from "@/lib/constants";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const webhookSchema = z.object({
  name: z.string().min(1),
  event_type: z.enum(WEBHOOK_EVENTS),
  target_url: z.string().url(),
  secret_placeholder: z.string().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const webhooks = await webhookConfigService.listWebhooks(id);
    return NextResponse.json({ webhooks });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load webhooks" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = webhookSchema.parse(body);
    const webhook = await webhookConfigService.createWebhook(id, parsed);
    return NextResponse.json(webhook, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create webhook" },
      { status: 500 },
    );
  }
}
