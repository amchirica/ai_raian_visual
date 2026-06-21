import { createAdminClient } from "@/lib/supabase/admin";
import { aiService } from "@/lib/ai";
import { notifyLeadCreated } from "@/lib/notifications/email";
import { getScoringConfigFromClient, scoreLeadWithConfig } from "@/lib/scoring";
import { webhookDispatcher } from "@/lib/webhooks";
import { clientService } from "@/lib/services/client-service";
import { workflowService } from "@/lib/services/workflow-service";
import { sanitizeFormData, sanitizeString } from "@/lib/validation/sanitize";
import type { Client, Lead, LeadField, LeadFormConfig } from "@/types";
import { toJson } from "@/lib/utils";

export interface CreateLeadInput {
  client_id: string;
  source?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  form_data?: Record<string, unknown>;
  ip_address?: string;
}

export interface ListLeadsFilters {
  category?: string;
  status?: string;
  search?: string;
}

export class LeadService {
  private get supabase() {
    return createAdminClient();
  }

  async getLeadFields(clientId: string): Promise<LeadField[]> {
    const { data, error } = await this.supabase
      .from("lead_fields")
      .select("*")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw new Error(error.message);
    return (data ?? []) as LeadField[];
  }

  async getLeadFormConfig(clientSlug: string): Promise<LeadFormConfig | null> {
    const client = await clientService.getClientBySlug(clientSlug);
    if (!client) return null;

    const profile = client.business_profiles?.[0] ?? (await clientService.getBusinessProfile(client.id));
    const fields = await this.getLeadFields(client.id);

    const { data: widget } = await this.supabase
      .from("widget_settings")
      .select("*")
      .eq("client_id", client.id)
      .eq("widget_type", "lead-form")
      .maybeSingle();

    const theme = ((widget as { theme?: Record<string, string> } | null)?.theme ?? {}) as Record<string, string>;
    const config = ((widget as { config?: Record<string, string> } | null)?.config ?? {}) as Record<string, string>;

    if (profile?.primary_color && !theme.primaryColor) {
      theme.primaryColor = profile.primary_color;
    }

    return {
      client_id: client.id,
      client_slug: client.slug,
      company_name: profile?.company_name ?? client.name,
      fields,
      theme,
      config,
    };
  }

  async getLeadById(leadId: string): Promise<Lead | null> {
    const { data, error } = await this.supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as Lead | null;
  }

  async createLead(input: CreateLeadInput): Promise<Lead> {
    const fields = await this.getLeadFields(input.client_id);
    const client = await clientService.getClientById(input.client_id);
    if (!client) throw new Error("Client not found");

    const sanitizedForm = sanitizeFormData(input.form_data ?? {});
    const name = sanitizeString(input.name ?? sanitizedForm.name, 200) || null;
    const email = sanitizeString(input.email ?? sanitizedForm.email, 200) || null;
    const phone = sanitizeString(input.phone ?? sanitizedForm.phone, 50) || null;
    const company = sanitizeString(input.company ?? sanitizedForm.company, 200) || null;
    const message = sanitizeString(input.message ?? sanitizedForm.message, 5000) || null;

    const draft: Lead = {
      id: "",
      client_id: input.client_id,
      status: "new",
      score: 0,
      score_category: null,
      score_explanation: null,
      recommended_action: null,
      source: input.source ?? "widget",
      name,
      email,
      phone,
      company,
      message,
      form_data: toJson(sanitizedForm),
      ai_summary: null,
      ai_recommendation: null,
      metadata: {},
      created_at: "",
      updated_at: "",
    };

    const scoringConfig = getScoringConfigFromClient(client);
    const scoring = scoreLeadWithConfig(draft, fields, scoringConfig);

    const { data, error } = await this.supabase
      .from("leads")
      .insert({
        client_id: input.client_id,
        source: input.source ?? "widget",
        name,
        email,
        phone,
        company,
        message,
        form_data: toJson(sanitizedForm),
        score: scoring.score,
        score_category: scoring.category,
        score_explanation: scoring.explanation,
        recommended_action: scoring.recommended_action,
        status: "new",
        metadata: toJson({ scoring_breakdown: scoring.breakdown }),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const lead = data as Lead;
    const profile = client.business_profiles?.[0] ?? (await clientService.getBusinessProfile(input.client_id));

    await this.supabase.from("activity_logs").insert({
      client_id: input.client_id,
      actor_type: "visitor",
      action: "lead.created",
      entity_type: "lead",
      entity_id: lead.id,
      ip_address: input.ip_address ?? null,
      details: toJson({
        score: scoring.score,
        score_category: scoring.category,
        source: lead.source,
        explanation: scoring.explanation,
      }),
    });

    void webhookDispatcher.dispatch(input.client_id, "lead.created", toJson({
      ...lead,
      scoring_breakdown: scoring.breakdown,
    }));

    void notifyLeadCreated({
      client: client as Client,
      profile: profile ?? null,
      lead,
    });

    if (process.env.OPENAI_API_KEY) {
      void aiService.analyzeLead(input.client_id, lead).catch(() => undefined);
    }

    void workflowService.onLeadCreated(lead).catch(() => undefined);

    return lead;
  }

  async listLeads(clientId: string, filters: ListLeadsFilters = {}): Promise<Lead[]> {
    let query = this.supabase
      .from("leads")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (filters.category) {
      query = query.eq("score_category", filters.category);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    let leads = (data ?? []) as Lead[];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.name?.toLowerCase().includes(q) ||
          l.email?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q),
      );
    }

    return leads;
  }

  async updateLead(leadId: string, input: Partial<Lead>): Promise<Lead> {
    const { data, error } = await this.supabase
      .from("leads")
      .update(input)
      .eq("id", leadId)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const lead = data as Lead;

    await this.supabase.from("activity_logs").insert({
      client_id: lead.client_id,
      actor_type: "admin",
      action: "lead.updated",
      entity_type: "lead",
      entity_id: lead.id,
      details: toJson(input),
    });

    void webhookDispatcher.dispatch(lead.client_id, "lead.updated", toJson(lead));

    return lead;
  }

  async deleteLead(leadId: string): Promise<void> {
    const lead = await this.getLeadById(leadId);
    if (!lead) throw new Error("Lead not found");

    const { error } = await this.supabase.from("leads").delete().eq("id", leadId);
    if (error) throw new Error(error.message);

    await this.supabase.from("activity_logs").insert({
      client_id: lead.client_id,
      actor_type: "admin",
      action: "lead.deleted",
      entity_type: "lead",
      entity_id: leadId,
      details: toJson({ name: lead.name, email: lead.email }),
    });
  }
}

function createLeadService(): LeadService {
  return new LeadService();
}

export const leadService: LeadService = new Proxy({} as LeadService, {
  get(_target, prop) {
    const instance = createLeadService();
    const value = Reflect.get(instance, prop, instance) as unknown;
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
});
