import { NextResponse } from "next/server";
import { z } from "zod";
import { webhookConfigService } from "@/lib/services/webhook-config-service";
import { WEBHOOK_EVENTS } from "@/lib/constants";
import { signWebhookPayload, WEBHOOK_SIGNATURE_HEADER } from "@/lib/security/webhook-signature";

interface RouteContext {
  params: Promise<{ id: string; webhookId: string }>;
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  event_type: z.enum(WEBHOOK_EVENTS).optional(),
  target_url: z.string().url().optional(),
  secret_placeholder: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  action: z.enum(["test"]).optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { webhookId } = await context.params;
    const body = await request.json();
    const parsed = updateSchema.parse(body);

    if (parsed.action === "test") {
      const webhook = await webhookConfigService.getWebhook(webhookId);
      if (!webhook) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });

      const samplePayload = {
        event: webhook.event_type,
        client_id: webhook.client_id,
        timestamp: new Date().toISOString(),
        data: { test: true, message: "Sample webhook test from admin" },
      };
      const bodyStr = JSON.stringify(samplePayload);
      const signature = signWebhookPayload(bodyStr);

      try {
        const res = await fetch(webhook.target_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Event": webhook.event_type,
            "X-Client-Id": webhook.client_id,
            [WEBHOOK_SIGNATURE_HEADER]: signature,
          },
          body: bodyStr,
        });
        const status = res.ok ? "success" : "error";
        await webhookConfigService.recordDelivery(
          webhookId,
          status,
          res.ok ? undefined : `HTTP ${res.status}`,
        );
        return NextResponse.json({ success: res.ok, status: res.status });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed";
        await webhookConfigService.recordDelivery(webhookId, "error", msg);
        return NextResponse.json({ success: false, error: msg }, { status: 502 });
      }
    }

    const { action: _action, ...updates } = parsed;
    const webhook = await webhookConfigService.updateWebhook(webhookId, updates);
    return NextResponse.json(webhook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update webhook" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { webhookId } = await context.params;
    await webhookConfigService.deleteWebhook(webhookId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete webhook" },
      { status: 500 },
    );
  }
}
