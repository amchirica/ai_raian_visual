import { createAdminClient } from "@/lib/supabase/admin";
import type { WebhookConfig } from "@/types";
import { toJson } from "@/lib/utils";

export interface CreateWebhookInput {
  name: string;
  event_type: string;
  target_url: string;
  secret_placeholder?: string | null;
  is_active?: boolean;
}

export class WebhookConfigService {
  private get supabase() {
    return createAdminClient();
  }

  async listWebhooks(clientId: string): Promise<WebhookConfig[]> {
    const { data, error } = await this.supabase
      .from("webhooks")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as WebhookConfig[];
  }

  async getWebhook(webhookId: string): Promise<WebhookConfig | null> {
    const { data, error } = await this.supabase
      .from("webhooks")
      .select("*")
      .eq("id", webhookId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as WebhookConfig | null;
  }

  async listActiveForEvent(clientId: string, eventType: string): Promise<WebhookConfig[]> {
    const { data, error } = await this.supabase
      .from("webhooks")
      .select("*")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .eq("event_type", eventType);
    if (error) throw new Error(error.message);
    return (data ?? []) as WebhookConfig[];
  }

  async createWebhook(clientId: string, input: CreateWebhookInput): Promise<WebhookConfig> {
    const { data, error } = await this.supabase
      .from("webhooks")
      .insert({
        client_id: clientId,
        name: input.name,
        event_type: input.event_type,
        target_url: input.target_url,
        secret_placeholder: input.secret_placeholder ?? null,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await this.supabase.from("activity_logs").insert({
      client_id: clientId,
      actor_type: "admin",
      action: "webhook.created",
      entity_type: "webhook",
      entity_id: (data as WebhookConfig).id,
      details: toJson({ name: input.name, event_type: input.event_type }),
    });

    return data as WebhookConfig;
  }

  async updateWebhook(webhookId: string, input: Partial<CreateWebhookInput>): Promise<WebhookConfig> {
    const { data, error } = await this.supabase
      .from("webhooks")
      .update(input)
      .eq("id", webhookId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as WebhookConfig;
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    const { error } = await this.supabase.from("webhooks").delete().eq("id", webhookId);
    if (error) throw new Error(error.message);
  }

  async recordDelivery(
    webhookId: string,
    status: "success" | "error",
    errorMessage?: string,
  ): Promise<void> {
    await this.supabase
      .from("webhooks")
      .update({
        last_status: status,
        last_error: errorMessage ?? null,
        last_triggered_at: new Date().toISOString(),
      })
      .eq("id", webhookId);
  }
}

export const webhookConfigService = new WebhookConfigService();
