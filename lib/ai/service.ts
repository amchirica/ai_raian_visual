import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BusinessProfile, Json, Lead } from "@/types";

export interface AICompletionOptions {
  clientId: string;
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LeadAnalysisResult {
  summary: string;
  recommendation: string;
  suggestedPackage: string | null;
  priority: "low" | "medium" | "high";
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return new OpenAI({ apiKey });
}

export class AIService {
  private get supabase() {
    return createAdminClient();
  }

  async complete(options: AICompletionOptions): Promise<string> {
    const openai = getOpenAIClient();
    const context = await this.buildClientContext(options.clientId);

    const response = await openai.chat.completions.create({
      model: options.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      messages: [
        {
          role: "system",
          content:
            options.systemPrompt ??
            `You are a helpful business assistant. Use the following client context:\n${context}`,
        },
        { role: "user", content: options.userPrompt },
      ],
    });

    return response.choices[0]?.message?.content?.trim() ?? "";
  }

  async analyzeLead(clientId: string, lead: Lead): Promise<LeadAnalysisResult> {
    const openai = getOpenAIClient();
    const context = await this.buildClientContext(clientId);

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Analyze leads for a business. Context:\n${context}\nRespond in JSON with keys: summary, recommendation, suggestedPackage, priority (low|medium|high).`,
        },
        {
          role: "user",
          content: JSON.stringify({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            message: lead.message,
            form_data: lead.form_data,
          }),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as LeadAnalysisResult;

    await this.supabase
      .from("leads")
      .update({
        ai_summary: parsed.summary,
        ai_recommendation: parsed.recommendation,
      })
      .eq("id", lead.id);

    return parsed;
  }

  async chatReply(clientId: string, message: string, history: Json = []): Promise<string> {
    const approvedData = await this.buildClientContext(clientId);
    const systemPrompt = `You are a helpful assistant for a business. Be concise and professional. Only use this data:\n${approvedData}`;
    const historyMessages = this.parseHistory(history);
    return this.chatWithSystemPrompt(systemPrompt, message, historyMessages);
  }

  async chatWithSystemPrompt(
    systemPrompt: string,
    message: string,
    history: Array<{ role: "user" | "assistant"; content: string }> = [],
  ): Promise<string> {
    const openai = getOpenAIClient();

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: message },
      ],
    });

    return response.choices[0]?.message?.content?.trim() ?? "";
  }

  private parseHistory(history: Json): Array<{ role: "user" | "assistant"; content: string }> {
    if (!Array.isArray(history)) return [];
    return history
      .filter((item): item is { role: string; content: string } =>
        typeof item === "object" && item !== null && "role" in item && "content" in item,
      )
      .map((item) => ({
        role: item.role as "user" | "assistant",
        content: String(item.content),
      }));
  }

  async buildClientContext(clientId: string): Promise<string> {
    const { data: profile } = await this.supabase
      .from("business_profiles")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();

    const { data: services } = await this.supabase
      .from("services")
      .select("name, description, base_price, currency")
      .eq("client_id", clientId)
      .eq("is_active", true);

    const { data: packages } = await this.supabase
      .from("packages")
      .select("name, description, price, currency, features")
      .eq("client_id", clientId)
      .eq("is_active", true);

    const { data: faqs } = await this.supabase
      .from("faq_items")
      .select("question, answer")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .limit(10);

    return JSON.stringify(
      {
        profile: profile as BusinessProfile | null,
        services: services ?? [],
        packages: packages ?? [],
        faqs: faqs ?? [],
      },
      null,
      2,
    );
  }
}

export const aiService = new AIService();
