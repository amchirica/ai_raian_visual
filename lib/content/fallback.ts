import type { ContentType } from "@/lib/constants";
import { CONTENT_TYPE_LABELS } from "@/lib/constants";
import type { ContentSettings, ContentTemplate } from "@/types";

interface FallbackInput {
  contentType: ContentType;
  companyName: string;
  context: string;
  settings: ContentSettings;
  template?: ContentTemplate | null;
  aiError?: string;
}

export function buildFallbackContent(input: FallbackInput): {
  title: string;
  subject: string | null;
  body: string;
} {
  const cta = input.settings.preferred_cta ?? "Contactează-ne";
  const brief = input.context.trim() || "serviciile noastre";
  const title = CONTENT_TYPE_LABELS[input.contentType];

  if (input.template?.body) {
    const body = applyTemplateVars(input.template.body, {
      company_name: input.companyName,
      preferred_cta: cta,
      context: brief,
      lead_name: "client",
    });
    return {
      title: input.template.name ?? title,
      subject: input.template.subject ?? null,
      body: input.aiError
        ? `[Draft — AI indisponibil: ${summarizeAiError(input.aiError)}]\n\n${body}`
        : body,
    };
  }

  const body = buildDraftBody(input.contentType, input.companyName, brief, cta, input.aiError);
  return { title, subject: null, body };
}

function summarizeAiError(error: string): string {
  if (error.includes("429") || error.toLowerCase().includes("quota")) {
    return "limită OpenAI depășită — editează draftul de mai jos";
  }
  if (error.includes("401") || error.toLowerCase().includes("api key")) {
    return "cheie OpenAI invalidă";
  }
  return "serviciu AI temporar indisponibil";
}

function buildDraftBody(
  contentType: ContentType,
  companyName: string,
  brief: string,
  cta: string,
  aiError?: string,
): string {
  const prefix = aiError
    ? `[Draft generat local — ${summarizeAiError(aiError)}]\n\n`
    : "[Draft — configurează OPENAI_API_KEY pentru generare AI]\n\n";

  const drafts: Record<ContentType, string> = {
    follow_up_email: `Subject: Re: ${brief} — ${companyName}\n\nBună,\n\nRevenim cu un follow-up legat de ${brief}.\n\n${cta}.\n\nCu drag,\n${companyName}`,
    whatsapp_message: `Bună! Suntem ${companyName}. Revenim legat de ${brief}. ${cta}.`,
    sms_short: `${companyName}: follow-up ${brief}. ${cta}.`,
    meta_ads_primary: `${companyName} — ${brief}. Calitate premium, echipă dedicată. ${cta}.`,
    meta_ads_headline: `${companyName} — ${brief}`.slice(0, 40),
    instagram_caption: `${brief} ✨\n\nExperiență premium cu ${companyName}.\n\n${cta}.\n\n#${companyName.replace(/\s+/g, "").toLowerCase()}`,
    facebook_post: `La ${companyName}, ${brief}.\n\nSuntem aici să te ajutăm cu o experiență clară și profesională.\n\n${cta}.`,
    blog_outline: `H1: ${brief}\nH2: De ce ${companyName}\nH2: Servicii și pachete\nH2: Proces\nH2: Întrebări frecvente\nH2: ${cta}`,
    seo_title: `${brief} | ${companyName}`.slice(0, 60),
    seo_meta_description: `${companyName} — ${brief}. ${cta}.`.slice(0, 155),
    portfolio_description: `Proiect ${brief} realizat de ${companyName}. Abordare premium, livrabile clare, experiență personalizată.`,
    proposal_intro: `Bună,\n\nÎți mulțumim pentru interesul acordat ${companyName}. Am pregătit această propunere legată de ${brief}.\n\n${cta}.`,
  };

  const draft = drafts[contentType] ?? `${companyName} — ${brief}\n\n${cta}.`;
  return prefix + draft;
}

function applyTemplateVars(
  template: string,
  vars: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

export function isAiQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("429") || message.toLowerCase().includes("quota");
}
