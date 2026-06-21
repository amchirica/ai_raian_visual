import { createAdminClient } from "@/lib/supabase/admin";
import { clientService } from "@/lib/services/client-service";
import { leadService } from "@/lib/services/lead-service";
import { aiService } from "@/lib/ai";
import { buildApprovedKnowledgeBase } from "@/lib/assistant/knowledge";
import { buildSystemPrompt, detectHandoffIntent, detectLeadIntent } from "@/lib/assistant/prompts";
import type {
  AssistantConfig,
  AssistantSettings,
  ChatConversation,
  ChatMessage,
  FaqItem,
} from "@/types";
import { toJson } from "@/lib/utils";

export interface ChatReplyResult {
  reply: string;
  conversation_id: string;
  handoff_requested: boolean;
  lead_capture_suggested: boolean;
  used_fallback: boolean;
}

export class AssistantService {
  private get supabase() {
    return createAdminClient();
  }

  async getSettings(clientId: string): Promise<AssistantSettings | null> {
    const { data } = await this.supabase
      .from("assistant_settings")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();
    return data as AssistantSettings | null;
  }

  async upsertSettings(
    clientId: string,
    input: Partial<AssistantSettings>,
  ): Promise<AssistantSettings> {
    const existing = await this.getSettings(clientId);
    if (existing) {
      const { data, error } = await this.supabase
        .from("assistant_settings")
        .update(input)
        .eq("client_id", clientId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as AssistantSettings;
    }

    const { data, error } = await this.supabase
      .from("assistant_settings")
      .insert({
        client_id: clientId,
        ...input,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as AssistantSettings;
  }

  async getPublicConfig(clientSlug: string): Promise<AssistantConfig | null> {
    const client = await clientService.getClientBySlug(clientSlug);
    if (!client) return null;

    const profile = client.business_profiles?.[0] ?? (await clientService.getBusinessProfile(client.id));
    const settings = await this.getSettings(client.id);
    const theme = (settings?.theme ?? {}) as Record<string, string>;
    const config = (settings?.config ?? {}) as Record<string, string>;

    if (profile?.primary_color && !theme.primaryColor) {
      theme.primaryColor = profile.primary_color;
    }

    return {
      client_id: client.id,
      client_slug: client.slug,
      company_name: profile?.company_name ?? client.name,
      is_enabled: settings?.is_enabled ?? true,
      greeting_message: settings?.greeting_message ?? "Bună! Cu ce te pot ajuta?",
      fallback_message: settings?.fallback_message ?? "Nu am această informație. Pot să te pun în legătură cu echipa.",
      handoff_message: settings?.handoff_message ?? "Lasă-ne datele de contact și revenim.",
      tone: settings?.tone ?? "professional",
      lead_capture_prompt: settings?.lead_capture_prompt ?? "Vrei o ofertă? Lasă-ne numele și emailul.",
      lead_form_url: settings?.lead_form_url ?? `/embed/lead-form/${client.slug}`,
      theme,
      config,
    };
  }

  async getOrCreateConversation(
    clientId: string,
    conversationId?: string,
    visitorId?: string,
  ): Promise<ChatConversation> {
    if (conversationId) {
      const { data } = await this.supabase
        .from("chat_conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("client_id", clientId)
        .maybeSingle();
      if (data) return data as ChatConversation;
    }

    const { data, error } = await this.supabase
      .from("chat_conversations")
      .insert({
        client_id: clientId,
        visitor_id: visitorId ?? `visitor-${Date.now()}`,
        status: "active",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ChatConversation;
  }

  async saveMessage(
    clientId: string,
    conversationId: string,
    role: string,
    content: string,
    metadata: Record<string, unknown> = {},
  ): Promise<ChatMessage> {
    const { data, error } = await this.supabase
      .from("chat_messages")
      .insert({
        client_id: clientId,
        conversation_id: conversationId,
        role,
        content,
        metadata: toJson(metadata),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ChatMessage;
  }

  async chat(
    clientSlug: string,
    message: string,
    conversationId?: string,
    visitorId?: string,
    history: Array<{ role: string; content: string }> = [],
  ): Promise<ChatReplyResult> {
    const config = await this.getPublicConfig(clientSlug);
    if (!config || !config.is_enabled) {
      throw new Error("Assistant is not available");
    }

    const settings = await this.getSettings(config.client_id);
    const conversation = await this.getOrCreateConversation(
      config.client_id,
      conversationId,
      visitorId,
    );

    await this.saveMessage(config.client_id, conversation.id, "user", message);

    const handoff = detectHandoffIntent(message);
    const leadIntent = detectLeadIntent(message);

    if (handoff) {
      await this.supabase
        .from("chat_conversations")
        .update({ handoff_requested: true, status: "handoff" })
        .eq("id", conversation.id);

      const reply = settings?.handoff_message ?? config.handoff_message;
      await this.saveMessage(config.client_id, conversation.id, "assistant", reply, { handoff: true });
      return {
        reply,
        conversation_id: conversation.id,
        handoff_requested: true,
        lead_capture_suggested: true,
        used_fallback: false,
      };
    }

    let reply: string;
    let usedFallback = false;

    if (!process.env.OPENAI_API_KEY) {
      reply = settings?.fallback_message ?? config.fallback_message;
      usedFallback = true;
    } else {
      try {
        const approvedData = await buildApprovedKnowledgeBase(config.client_id);
        const systemPrompt = buildSystemPrompt(approvedData, {
          tone: settings?.tone ?? config.tone,
          greeting_message: settings?.greeting_message ?? config.greeting_message,
          fallback_message: settings?.fallback_message ?? config.fallback_message,
          handoff_message: settings?.handoff_message ?? config.handoff_message,
          lead_capture_prompt: settings?.lead_capture_prompt ?? config.lead_capture_prompt,
          system_instructions: settings?.system_instructions,
        });

        const historyMessages = history.slice(-10).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        reply = await aiService.chatWithSystemPrompt(systemPrompt, message, historyMessages);

        if (
          reply.toLowerCase().includes("nu am") ||
          reply.toLowerCase().includes("don't have") ||
          reply.toLowerCase().includes("not in")
        ) {
          usedFallback = true;
        }
      } catch {
        reply = settings?.fallback_message ?? config.fallback_message;
        usedFallback = true;
      }
    }

    if (leadIntent && !handoff) {
      reply += `\n\n${settings?.lead_capture_prompt ?? config.lead_capture_prompt}`;
    }

    await this.saveMessage(config.client_id, conversation.id, "assistant", reply, {
      used_fallback: usedFallback,
      lead_intent: leadIntent,
    });

    return {
      reply,
      conversation_id: conversation.id,
      handoff_requested: false,
      lead_capture_suggested: leadIntent,
      used_fallback: usedFallback,
    };
  }

  async createLeadFromChat(
    clientSlug: string,
    conversationId: string,
    data: { name?: string; email?: string; phone?: string; message?: string },
  ) {
    const config = await this.getPublicConfig(clientSlug);
    if (!config) throw new Error("Client not found");

    const { data: messages } = await this.supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at");

    const chatSummary = (messages ?? [])
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")
      .slice(0, 3000);

    const lead = await leadService.createLead({
      client_id: config.client_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message ?? `Chat conversation:\n${chatSummary}`,
      source: "assistant-chat",
      form_data: { conversation_id: conversationId, ...data },
    });

    await this.supabase
      .from("chat_conversations")
      .update({ lead_id: lead.id, status: "converted" })
      .eq("id", conversationId);

    await this.supabase.from("activity_logs").insert({
      client_id: config.client_id,
      actor_type: "assistant",
      action: "lead.created_from_chat",
      entity_type: "lead",
      entity_id: lead.id,
      details: toJson({ conversation_id: conversationId }),
    });

    return lead;
  }

  async listConversations(clientId: string): Promise<ChatConversation[]> {
    const { data, error } = await this.supabase
      .from("chat_conversations")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as ChatConversation[];
  }

  async getConversationWithMessages(conversationId: string) {
    const { data: conversation } = await this.supabase
      .from("chat_conversations")
      .select("*")
      .eq("id", conversationId)
      .maybeSingle();

    const { data: messages } = await this.supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at");

    return {
      conversation: conversation as ChatConversation | null,
      messages: (messages ?? []) as ChatMessage[],
    };
  }

  async resolveConversation(conversationId: string): Promise<void> {
    await this.supabase
      .from("chat_conversations")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", conversationId);
  }

  async updateConversation(
    conversationId: string,
    input: { status?: string; handoff_requested?: boolean },
  ): Promise<ChatConversation> {
    const payload: Record<string, unknown> = { ...input };
    if (input.status === "resolved") payload.resolved_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("chat_conversations")
      .update(payload)
      .eq("id", conversationId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ChatConversation;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await this.supabase.from("chat_conversations").delete().eq("id", conversationId);
    if (error) throw new Error(error.message);
  }

  async listFaqItems(clientId: string): Promise<FaqItem[]> {
    const { data } = await this.supabase
      .from("faq_items")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order");
    return (data ?? []) as FaqItem[];
  }

  async upsertFaqItem(
    clientId: string,
    input: { id?: string; question: string; answer: string; category?: string; sort_order?: number; is_active?: boolean },
  ): Promise<FaqItem> {
    if (input.id) {
      const { data, error } = await this.supabase
        .from("faq_items")
        .update({
          question: input.question,
          answer: input.answer,
          category: input.category,
          sort_order: input.sort_order,
          is_active: input.is_active,
        })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as FaqItem;
    }

    const { data, error } = await this.supabase
      .from("faq_items")
      .insert({
        client_id: clientId,
        question: input.question,
        answer: input.answer,
        category: input.category ?? null,
        sort_order: input.sort_order ?? 0,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as FaqItem;
  }

  async deleteFaqItem(faqId: string): Promise<void> {
    await this.supabase.from("faq_items").delete().eq("id", faqId);
  }
}

export const assistantService = new AssistantService();
