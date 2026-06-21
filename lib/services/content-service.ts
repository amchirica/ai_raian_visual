import { createAdminClient } from "@/lib/supabase/admin";
import { aiService } from "@/lib/ai";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import type { ContentType } from "@/lib/constants";
import {
  buildContentSystemPrompt,
  buildContentUserPrompt,
  parseContentResponse,
} from "@/lib/content/prompts";
import { buildFallbackContent } from "@/lib/content/fallback";
import type {
  ContentSettings,
  ContentTemplate,
  GeneratedContent,
  GenerateContentInput,
} from "@/types";
import { toJson } from "@/lib/utils";

export class ContentService {
  private get supabase() {
    return createAdminClient();
  }

  async getSettings(clientId: string): Promise<ContentSettings | null> {
    const { data } = await this.supabase
      .from("content_settings")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();
    return data as ContentSettings | null;
  }

  async upsertSettings(
    clientId: string,
    input: Partial<ContentSettings>,
  ): Promise<ContentSettings> {
    const existing = await this.getSettings(clientId);
    if (existing) {
      const { data, error } = await this.supabase
        .from("content_settings")
        .update(input)
        .eq("client_id", clientId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as ContentSettings;
    }

    const { data, error } = await this.supabase
      .from("content_settings")
      .insert({ client_id: clientId, ...input })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ContentSettings;
  }

  async listTemplates(clientId?: string): Promise<ContentTemplate[]> {
    let query = this.supabase.from("content_templates").select("*").eq("is_active", true);
    if (clientId) query = query.eq("client_id", clientId);
    const { data } = await query.order("name");
    return (data ?? []) as ContentTemplate[];
  }

  async buildApprovedData(clientId: string): Promise<string> {
    const [profileRes, servicesRes, packagesRes, settings] = await Promise.all([
      this.supabase.from("business_profiles").select("*").eq("client_id", clientId).maybeSingle(),
      this.supabase.from("services").select("name, description, base_price, currency, category").eq("client_id", clientId).eq("is_active", true),
      this.supabase.from("packages").select("name, description, price, currency").eq("client_id", clientId).eq("is_active", true),
      this.getSettings(clientId),
    ]);

    return JSON.stringify(
      {
        profile: profileRes.data,
        services: servicesRes.data ?? [],
        packages: packagesRes.data ?? [],
        content_settings: settings,
      },
      null,
      2,
    );
  }

  async buildLeadOfferContext(leadId?: string, offerId?: string): Promise<string> {
    const parts: Record<string, unknown> = {};

    if (leadId) {
      const { data: lead } = await this.supabase.from("leads").select("*").eq("id", leadId).maybeSingle();
      if (lead) {
        parts.lead = {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          message: lead.message,
          form_data: lead.form_data,
          status: lead.status,
        };
      }
    }

    if (offerId) {
      const { data: offer } = await this.supabase.from("offers").select("*").eq("id", offerId).maybeSingle();
      if (offer) {
        let pkg = null;
        if (offer.package_id) {
          const { data } = await this.supabase.from("packages").select("name, price, currency").eq("id", offer.package_id).maybeSingle();
          pkg = data;
        }
        parts.offer = {
          title: offer.title,
          total_amount: offer.total_amount,
          currency: offer.currency,
          delivery_terms: offer.delivery_terms,
          next_steps: offer.next_steps,
          text_summary: offer.text_summary,
          package: pkg,
        };
      }
    }

    return JSON.stringify(parts, null, 2);
  }

  async generateContent(input: GenerateContentInput): Promise<GeneratedContent> {
    const settings = await this.getSettings(input.client_id);
    const { data: profile } = await this.supabase
      .from("business_profiles")
      .select("company_name")
      .eq("client_id", input.client_id)
      .maybeSingle();

    const companyName = profile?.company_name ?? "Business";
    const contentSettings: ContentSettings = settings ?? {
      id: "",
      client_id: input.client_id,
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

    const approvedData = await this.buildApprovedData(input.client_id);
    const leadOfferContext = await this.buildLeadOfferContext(input.lead_id, input.offer_id);
    const fullContext = [input.context ?? "", leadOfferContext].filter(Boolean).join("\n\n");

    let title: string | null = CONTENT_TYPE_LABELS[input.content_type as ContentType] ?? input.content_type;
    let subject: string | null = null;
    let body: string;
    let generatedBy = "ai";
    let aiError: string | undefined;

    const matchingTemplate = await this.findTemplateForType(input.client_id, input.content_type);

    if (!process.env.OPENAI_API_KEY) {
      const fallback = buildFallbackContent({
        contentType: input.content_type as ContentType,
        companyName,
        context: fullContext,
        settings: contentSettings,
        template: matchingTemplate,
      });
      title = fallback.title;
      subject = fallback.subject;
      body = fallback.body;
      generatedBy = "fallback";
    } else {
      try {
        const raw = await aiService.complete({
          clientId: input.client_id,
          systemPrompt: buildContentSystemPrompt(contentSettings, companyName),
          userPrompt: buildContentUserPrompt(
            input.content_type as ContentType,
            approvedData,
            fullContext,
            input.extra_instructions,
          ),
          temperature: 0.6,
          maxTokens: 1200,
        });
        const parsed = parseContentResponse(raw);
        title = parsed.title ?? title;
        subject = parsed.subject ?? null;
        body = parsed.body;
      } catch (error) {
        aiError = error instanceof Error ? error.message : "AI unavailable";
        const fallback = buildFallbackContent({
          contentType: input.content_type as ContentType,
          companyName,
          context: input.context ?? fullContext,
          settings: contentSettings,
          template: matchingTemplate,
          aiError,
        });
        title = fallback.title;
        subject = fallback.subject;
        body = fallback.body;
        generatedBy = "fallback";
      }
    }

    return this.saveContent({
      client_id: input.client_id,
      content_type: input.content_type,
      title,
      subject,
      body,
      status: "draft",
      context: toJson({
        user_context: input.context,
        extra_instructions: input.extra_instructions,
      }),
      lead_id: input.lead_id ?? null,
      offer_id: input.offer_id ?? null,
      generated_by: generatedBy,
      metadata: toJson({
        ai_fallback: generatedBy === "fallback",
        ai_error: aiError ?? null,
      }),
    });
  }

  async findTemplateForType(clientId: string, contentType: string): Promise<ContentTemplate | null> {
    const { data } = await this.supabase
      .from("content_templates")
      .select("*")
      .eq("client_id", clientId)
      .eq("template_type", contentType)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    return data as ContentTemplate | null;
  }

  async saveContent(
    input: Partial<GeneratedContent> & { client_id: string; content_type: string; body: string; id?: string },
  ): Promise<GeneratedContent> {
    if (input.id) {
      const { data, error } = await this.supabase
        .from("generated_content")
        .update({
          title: input.title,
          subject: input.subject,
          body: input.body,
          status: input.status,
          context: input.context ? toJson(input.context) : undefined,
          metadata: input.metadata ? toJson(input.metadata) : undefined,
        })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as GeneratedContent;
    }

    const { data, error } = await this.supabase
      .from("generated_content")
      .insert({
        client_id: input.client_id,
        content_type: input.content_type,
        title: input.title ?? null,
        subject: input.subject ?? null,
        body: input.body,
        status: input.status ?? "draft",
        context: toJson(input.context ?? {}),
        lead_id: input.lead_id ?? null,
        offer_id: input.offer_id ?? null,
        template_id: input.template_id ?? null,
        generated_by: input.generated_by ?? "manual",
        metadata: toJson(input.metadata ?? {}),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as GeneratedContent;
  }

  async getContentById(id: string): Promise<GeneratedContent | null> {
    const { data } = await this.supabase.from("generated_content").select("*").eq("id", id).maybeSingle();
    return data as GeneratedContent | null;
  }

  async listContent(filters?: {
    clientId?: string;
    status?: string;
    leadId?: string;
    offerId?: string;
    limit?: number;
  }): Promise<GeneratedContent[]> {
    let query = this.supabase.from("generated_content").select("*");
    if (filters?.clientId) query = query.eq("client_id", filters.clientId);
    if (filters?.status) query = query.eq("status", filters.status);
    if (filters?.leadId) query = query.eq("lead_id", filters.leadId);
    if (filters?.offerId) query = query.eq("offer_id", filters.offerId);
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(filters?.limit ?? 100);
    if (error) throw new Error(error.message);
    return (data ?? []) as GeneratedContent[];
  }

  async updateContentStatus(
    id: string,
    status: string,
  ): Promise<GeneratedContent> {
    const updates: Record<string, unknown> = { status };
    if (status === "approved") updates.approved_at = new Date().toISOString();
    if (status === "sent") updates.sent_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("generated_content")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    await this.supabase.from("activity_logs").insert({
      client_id: (data as GeneratedContent).client_id,
      actor_type: "admin",
      action: `content.${status}`,
      entity_type: "generated_content",
      entity_id: id,
      details: toJson({ status }),
    });

    return data as GeneratedContent;
  }

  async deleteContent(id: string): Promise<void> {
    const existing = await this.getContentById(id);
    if (!existing) throw new Error("Content not found");
    const { error } = await this.supabase.from("generated_content").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await this.supabase.from("activity_logs").insert({
      client_id: existing.client_id,
      actor_type: "admin",
      action: "content.deleted",
      entity_type: "generated_content",
      entity_id: id,
      details: toJson({ title: existing.title }),
    });
  }
}

export const contentService = new ContentService();
