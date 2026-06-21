import type { Lead } from "@/types";
import type { Client, BusinessProfile } from "@/types";

export interface LeadEmailPayload {
  client: Client;
  profile: BusinessProfile | null;
  lead: Lead;
}

export interface EmailProvider {
  send(payload: LeadEmailPayload): Promise<void>;
}

/** Provider-agnostic webhook-style email dispatch */
class WebhookEmailProvider implements EmailProvider {
  async send({ client, profile, lead }: LeadEmailPayload): Promise<void> {
    const settings = (client.settings ?? {}) as Record<string, unknown>;
    const notifications = (settings.notifications ?? {}) as Record<string, unknown>;
    const emailWebhook = notifications.email_webhook as string | undefined;
    const url = emailWebhook ?? process.env.LEAD_EMAIL_WEBHOOK_URL;

    if (!url) return;

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "lead.created",
        to: profile?.contact_email ?? notifications.notify_email,
        subject: `New lead: ${lead.name ?? lead.email ?? "Unknown"}`,
        lead: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          score: lead.score,
          score_category: lead.score_category,
          status: lead.status,
          form_data: lead.form_data,
          recommended_action: lead.recommended_action,
        },
        client: { id: client.id, name: client.name, slug: client.slug },
      }),
    });
  }
}

/** Log-only fallback for development */
class ConsoleEmailProvider implements EmailProvider {
  async send(payload: LeadEmailPayload): Promise<void> {
    if (process.env.NODE_ENV === "production") return;
    console.info("[email:lead.created]", {
      to: payload.profile?.contact_email,
      leadId: payload.lead.id,
      score: payload.lead.score,
      category: payload.lead.score_category,
    });
  }
}

const providers: EmailProvider[] = [new WebhookEmailProvider(), new ConsoleEmailProvider()];

export async function notifyLeadCreated(payload: LeadEmailPayload): Promise<void> {
  await Promise.allSettled(providers.map((p) => p.send(payload)));
}
