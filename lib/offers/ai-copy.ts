import { aiService } from "@/lib/ai";
import type { OfferContentData } from "@/types";

const SYSTEM_PROMPT = `You are a professional copywriter for business offers.
STRICT RULES:
- NEVER invent prices, dates, services, guarantees, or package names.
- ONLY use the exact data provided in the JSON payload.
- Improve wording to be warm, professional, and persuasive.
- Keep the same factual content.
- Respond in JSON with keys: intro_paragraph, delivery_terms, next_steps (all strings).
- Write in the language indicated by the locale field.`;

export async function enhanceOfferCopy(
  clientId: string,
  data: OfferContentData,
  locale = "ro",
): Promise<Partial<Pick<OfferContentData, "delivery_terms" | "next_steps">> & { intro?: string }> {
  if (!process.env.OPENAI_API_KEY) return {};

  try {
    const payload = {
      locale,
      company_name: data.company_name,
      lead_name: data.lead_name,
      package_name: data.package_name,
      package_price: data.package_price,
      currency: data.currency,
      total_amount: data.total_amount,
      extras: data.extras,
      features: data.package_features,
      delivery_terms: data.delivery_terms,
      next_steps: data.next_steps,
      recommendation_reason: data.recommendation_reason,
      valid_until: data.valid_until,
    };

    const raw = await aiService.complete({
      clientId,
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: JSON.stringify(payload),
      temperature: 0.4,
      maxTokens: 800,
    });

    const parsed = JSON.parse(raw) as {
      intro_paragraph?: string;
      delivery_terms?: string;
      next_steps?: string;
    };

    return {
      intro: parsed.intro_paragraph,
      delivery_terms: parsed.delivery_terms,
      next_steps: parsed.next_steps,
    };
  } catch {
    return {};
  }
}
