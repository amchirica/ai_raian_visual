import { createAdminClient } from "@/lib/supabase/admin";
import { aiService } from "@/lib/ai";
import { contentService } from "@/lib/services/content-service";
import {
  buildFollowupSystemPrompt,
  buildFollowupUserPrompt,
  parseContentResponse,
} from "@/lib/content/prompts";
import { buildFallbackContent } from "@/lib/content/fallback";
import type { ContentType } from "@/lib/constants";
import type {
  ContentSettings,
  CreateFollowupSequenceInput,
  FollowupMessage,
  FollowupSequence,
  ScheduledFollowup,
} from "@/types";
import { toJson } from "@/lib/utils";

export class FollowupService {
  private get supabase() {
    return createAdminClient();
  }

  async createSequence(input: CreateFollowupSequenceInput): Promise<{
    sequence: FollowupSequence;
    messages: FollowupMessage[];
    scheduled: ScheduledFollowup[];
  }> {
    const { data: sequence, error: seqError } = await this.supabase
      .from("followup_sequences")
      .insert({
        client_id: input.client_id,
        name: input.name,
        trigger_event: input.trigger_event ?? "manual",
        lead_id: input.lead_id ?? null,
        offer_id: input.offer_id ?? null,
        require_approval: input.require_approval ?? true,
        is_active: true,
      })
      .select()
      .single();
    if (seqError) throw new Error(seqError.message);

    const seq = sequence as FollowupSequence;
    const messages: FollowupMessage[] = [];
    const scheduled: ScheduledFollowup[] = [];
    const baseTime = Date.now();

    for (let i = 0; i < input.steps.length; i++) {
      const step = input.steps[i];
      const { data: msg, error: msgError } = await this.supabase
        .from("followup_messages")
        .insert({
          client_id: input.client_id,
          sequence_id: seq.id,
          delay_hours: step.delay_hours,
          channel: step.channel,
          name: step.name ?? `Step ${i + 1}`,
          subject: step.subject ?? null,
          body_template: step.body_template ?? "{{lead_name}}, revenim cu un reminder.",
          require_approval: input.require_approval ?? true,
          sort_order: i + 1,
        })
        .select()
        .single();
      if (msgError) throw new Error(msgError.message);
      messages.push(msg as FollowupMessage);

      const scheduledFor = new Date(baseTime + step.delay_hours * 60 * 60 * 1000).toISOString();
      const { data: sched, error: schedError } = await this.supabase
        .from("scheduled_followups")
        .insert({
          client_id: input.client_id,
          sequence_id: seq.id,
          followup_message_id: (msg as FollowupMessage).id,
          lead_id: input.lead_id ?? null,
          offer_id: input.offer_id ?? null,
          channel: step.channel,
          subject: step.subject ?? null,
          body: step.body_template ?? "Pending AI generation",
          status: "pending_approval",
          scheduled_for: scheduledFor,
          metadata: toJson({ step_name: step.name }),
        })
        .select()
        .single();
      if (schedError) throw new Error(schedError.message);
      scheduled.push(sched as ScheduledFollowup);
    }

    return { sequence: seq, messages, scheduled };
  }

  async generateMessage(
    clientId: string,
    scheduledId: string,
  ): Promise<ScheduledFollowup> {
    const { data: scheduled } = await this.supabase
      .from("scheduled_followups")
      .select("*")
      .eq("id", scheduledId)
      .maybeSingle();
    if (!scheduled) throw new Error("Scheduled follow-up not found");

    const sched = scheduled as ScheduledFollowup;
    const settings = await contentService.getSettings(clientId);
    const { data: profile } = await this.supabase
      .from("business_profiles")
      .select("company_name")
      .eq("client_id", clientId)
      .maybeSingle();

    const companyName = profile?.company_name ?? "Business";
    const contentSettings: ContentSettings = settings ?? {
      id: "",
      client_id: clientId,
      industry: "general",
      tone_of_voice: "professional",
      target_audience: null,
      brand_positioning: null,
      forbidden_claims: [],
      preferred_cta: null,
      default_locale: "ro",
      metadata: {},
      created_at: "",
      updated_at: "",
    };

    const approvedData = await contentService.buildApprovedData(clientId);
    const leadContext = await contentService.buildLeadOfferContext(
      sched.lead_id ?? undefined,
      sched.offer_id ?? undefined,
    );

    let subject = sched.subject;
    let body = sched.body;
    let generatedBy = "ai";
    let aiError: string | undefined;

    if (process.env.OPENAI_API_KEY) {
      try {
        const raw = await aiService.complete({
          clientId,
          systemPrompt: buildFollowupSystemPrompt(contentSettings, companyName),
          userPrompt: buildFollowupUserPrompt(
            sched.channel,
            approvedData,
            leadContext,
            (sched.metadata as Record<string, string>)?.step_name,
          ),
          temperature: 0.5,
          maxTokens: 600,
        });
        const parsed = parseContentResponse(raw);
        subject = parsed.subject ?? subject;
        body = parsed.body;
      } catch (error) {
        aiError = error instanceof Error ? error.message : "AI unavailable";
        const contentType: ContentType =
          sched.channel === "email" ? "follow_up_email" : sched.channel === "whatsapp" ? "whatsapp_message" : "sms_short";
        const fallback = buildFallbackContent({
          contentType,
          companyName,
          context: leadContext,
          settings: contentSettings,
          aiError,
        });
        subject = fallback.subject;
        body = fallback.body;
        generatedBy = "fallback";
      }
    } else {
      const contentType: ContentType =
        sched.channel === "email" ? "follow_up_email" : sched.channel === "whatsapp" ? "whatsapp_message" : "sms_short";
      const fallback = buildFallbackContent({
        contentType,
        companyName,
        context: leadContext,
        settings: contentSettings,
      });
      subject = fallback.subject;
      body = fallback.body;
      generatedBy = "fallback";
    }

    const saved = await contentService.saveContent({
      client_id: clientId,
      content_type: sched.channel === "email" ? "follow_up_email" : sched.channel === "whatsapp" ? "whatsapp_message" : "sms_short",
      title: `Follow-up — ${sched.channel}`,
      subject,
      body,
      status: "draft",
      lead_id: sched.lead_id,
      offer_id: sched.offer_id,
      generated_by: generatedBy,
      metadata: toJson({ ai_fallback: generatedBy === "fallback", ai_error: aiError ?? null }),
    });

    const { data: updated, error } = await this.supabase
      .from("scheduled_followups")
      .update({
        subject,
        body,
        generated_content_id: saved.id,
        status: "pending_approval",
      })
      .eq("id", scheduledId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated as ScheduledFollowup;
  }

  async markSent(scheduledId: string): Promise<ScheduledFollowup> {
    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from("scheduled_followups")
      .update({ status: "sent", sent_at: now })
      .eq("id", scheduledId)
      .select()
      .single();
    if (error) throw new Error(error.message);

    const sched = data as ScheduledFollowup;
    if (sched.generated_content_id) {
      await contentService.updateContentStatus(sched.generated_content_id, "sent");
    }

    await this.supabase.from("activity_logs").insert({
      client_id: sched.client_id,
      actor_type: "admin",
      action: "followup.sent",
      entity_type: "scheduled_followup",
      entity_id: scheduledId,
      details: toJson({ channel: sched.channel }),
    });

    return sched;
  }

  async approveScheduled(scheduledId: string): Promise<ScheduledFollowup> {
    const { data: sched } = await this.supabase
      .from("scheduled_followups")
      .select("*")
      .eq("id", scheduledId)
      .maybeSingle();
    if (!sched) throw new Error("Not found");

    if ((sched as ScheduledFollowup).generated_content_id) {
      await contentService.updateContentStatus(
        (sched as ScheduledFollowup).generated_content_id!,
        "approved",
      );
    }

    const { data, error } = await this.supabase
      .from("scheduled_followups")
      .update({ status: "approved" })
      .eq("id", scheduledId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ScheduledFollowup;
  }

  async listScheduled(filters: {
    clientId?: string;
    leadId?: string;
    offerId?: string;
    sequenceId?: string;
  }): Promise<ScheduledFollowup[]> {
    let query = this.supabase.from("scheduled_followups").select("*");
    if (filters.clientId) query = query.eq("client_id", filters.clientId);
    if (filters.leadId) query = query.eq("lead_id", filters.leadId);
    if (filters.offerId) query = query.eq("offer_id", filters.offerId);
    if (filters.sequenceId) query = query.eq("sequence_id", filters.sequenceId);
    const { data, error } = await query.order("scheduled_for");
    if (error) throw new Error(error.message);
    return (data ?? []) as ScheduledFollowup[];
  }

  async updateScheduled(
    scheduledId: string,
    input: {
      subject?: string | null;
      body?: string;
      scheduled_for?: string;
      status?: string;
      channel?: string;
    },
  ): Promise<ScheduledFollowup> {
    const payload: Record<string, unknown> = {};
    if (input.subject !== undefined) payload.subject = input.subject;
    if (input.body !== undefined) payload.body = input.body;
    if (input.scheduled_for !== undefined) payload.scheduled_for = input.scheduled_for;
    if (input.status !== undefined) payload.status = input.status;
    if (input.channel !== undefined) payload.channel = input.channel;

    const { data, error } = await this.supabase
      .from("scheduled_followups")
      .update(payload)
      .eq("id", scheduledId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ScheduledFollowup;
  }

  async deleteScheduled(scheduledId: string): Promise<void> {
    const { error } = await this.supabase.from("scheduled_followups").delete().eq("id", scheduledId);
    if (error) throw new Error(error.message);
  }

  async getSequenceWithMessages(sequenceId: string) {
    const { data: sequence } = await this.supabase
      .from("followup_sequences")
      .select("*")
      .eq("id", sequenceId)
      .maybeSingle();
    const { data: messages } = await this.supabase
      .from("followup_messages")
      .select("*")
      .eq("sequence_id", sequenceId)
      .order("sort_order");
    return {
      sequence: sequence as FollowupSequence | null,
      messages: (messages ?? []) as FollowupMessage[],
    };
  }
}

export const followupService = new FollowupService();
