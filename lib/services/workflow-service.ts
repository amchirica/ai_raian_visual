import { DEFAULT_FOLLOWUP_DELAYS } from "@/lib/constants";
import { followupService } from "@/lib/services/followup-service";
import { webhookDispatcher } from "@/lib/webhooks/dispatcher";
import { createAdminClient } from "@/lib/supabase/admin";
import { toJson } from "@/lib/utils";
import type { Lead, Offer } from "@/types";

/**
 * Orchestrates cross-module workflow steps.
 * MVP: manual approval still required for sends; this creates drafts and schedules.
 */
export class WorkflowService {
  private get supabase() {
    return createAdminClient();
  }

  async onLeadCreated(lead: Lead): Promise<void> {
    await this.logStep(lead.client_id, "workflow.lead_captured", "lead", lead.id, {
      source: lead.source,
      score: lead.score,
      score_category: lead.score_category,
    });
  }

  async onOfferGenerated(offer: Offer): Promise<void> {
    await this.logStep(offer.client_id, "workflow.offer_generated", "offer", offer.id, {
      lead_id: offer.lead_id,
      total_amount: offer.total_amount,
    });
  }

  async onOfferSent(offer: Offer): Promise<void> {
    await this.logStep(offer.client_id, "workflow.offer_sent", "offer", offer.id, {
      lead_id: offer.lead_id,
    });

    await webhookDispatcher.dispatch(offer.client_id, "offer.sent", toJson({
      offer_id: offer.id,
      lead_id: offer.lead_id,
      title: offer.title,
    }));

    if (!offer.lead_id) return;

    const existing = await this.supabase
      .from("scheduled_followups")
      .select("id")
      .eq("offer_id", offer.id)
      .limit(1);

    if ((existing.data ?? []).length > 0) return;

    await followupService.createSequence({
      client_id: offer.client_id,
      lead_id: offer.lead_id,
      offer_id: offer.id,
      name: `Post-offer follow-up — ${offer.title}`,
      trigger_event: "offer.sent",
      require_approval: true,
      steps: DEFAULT_FOLLOWUP_DELAYS.map((d, i) => ({
        delay_hours: d.hours,
        channel: i === 2 ? "whatsapp" : "email",
        name: d.label,
      })),
    });

    await this.logStep(offer.client_id, "workflow.followups_scheduled", "offer", offer.id, {
      lead_id: offer.lead_id,
      steps: DEFAULT_FOLLOWUP_DELAYS.length,
    });
  }

  private async logStep(
    clientId: string,
    action: string,
    entityType: string,
    entityId: string,
    details: Record<string, unknown>,
  ) {
    await this.supabase.from("activity_logs").insert({
      client_id: clientId,
      actor_type: "system",
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: toJson(details),
    });
  }
}

export const workflowService = new WorkflowService();
