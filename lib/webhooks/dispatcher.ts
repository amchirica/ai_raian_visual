import { createAdminClient } from "@/lib/supabase/admin";
import { signWebhookPayload, WEBHOOK_SIGNATURE_HEADER } from "@/lib/security/webhook-signature";
import type { WebhookEvent } from "@/lib/constants";
import type { Json } from "@/types";
import { toJson } from "@/lib/utils";
import { webhookConfigService } from "@/lib/services/webhook-config-service";

export interface WebhookPayload {
  event: WebhookEvent;
  client_id: string;
  timestamp: string;
  data: Json;
}

export class WebhookDispatcher {
  private get supabase() {
    return createAdminClient();
  }

  async dispatch(clientId: string, event: WebhookEvent, data: Json): Promise<void> {
    const payload: WebhookPayload = {
      event,
      client_id: clientId,
      timestamp: new Date().toISOString(),
      data,
    };

    const body = JSON.stringify(payload);
    const signature = signWebhookPayload(body);
    const headers = {
      "Content-Type": "application/json",
      "X-Webhook-Event": event,
      "X-Client-Id": clientId,
      [WEBHOOK_SIGNATURE_HEADER]: signature,
    };

    const dbWebhooks = await webhookConfigService
      .listActiveForEvent(clientId, event)
      .catch(() => [] as Awaited<ReturnType<typeof webhookConfigService.listActiveForEvent>>);
    const dbTargets = dbWebhooks.map((w) => ({ id: w.id, url: w.target_url }));

    const { data: client } = await this.supabase
      .from("clients")
      .select("settings")
      .eq("id", clientId)
      .single();

    const settings = ((client as { settings?: Json } | null)?.settings ?? {}) as Record<string, unknown>;
    const legacyWebhooks = (settings.webhooks ?? {}) as Record<string, string>;

    const envTargets = [
      legacyWebhooks[event],
      legacyWebhooks.default,
      process.env.N8N_WEBHOOK_URL,
      process.env.MAKE_WEBHOOK_URL,
      process.env.ZAPIER_WEBHOOK_URL,
    ].filter((url): url is string => typeof url === "string" && url.length > 0);

    const legacyTargets = envTargets.map((url) => ({ id: null as string | null, url }));
    const allTargets = [...dbTargets, ...legacyTargets];
    const uniqueUrls = [...new Set(allTargets.map((t) => t.url))];

    await Promise.allSettled(
      allTargets.map(async (target) => {
        try {
          const res = await fetch(target.url, { method: "POST", headers, body });
          if (target.id) {
            await webhookConfigService.recordDelivery(
              target.id,
              res.ok ? "success" : "error",
              res.ok ? undefined : `HTTP ${res.status}`,
            );
          }
        } catch (e) {
          if (target.id) {
            await webhookConfigService.recordDelivery(
              target.id,
              "error",
              e instanceof Error ? e.message : "Request failed",
            );
          }
        }
      }),
    );

    await this.supabase.from("activity_logs").insert({
      client_id: clientId,
      actor_type: "system",
      action: "webhook.dispatched",
      entity_type: "webhook",
      details: toJson({ event, targets: uniqueUrls.length }),
    });
  }
}

export const webhookDispatcher = new WebhookDispatcher();
