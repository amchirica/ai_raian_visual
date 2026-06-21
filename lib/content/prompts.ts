import type { ContentType } from "@/lib/constants";
import type { ContentSettings } from "@/types";

const CONTENT_TYPE_INSTRUCTIONS: Record<ContentType, string> = {
  follow_up_email: "Write a follow-up email. Include subject line on first line as 'Subject: ...' then body.",
  whatsapp_message: "Write a short WhatsApp message. Casual but professional. Max 300 characters preferred.",
  sms_short: "Write a very short SMS. Max 160 characters. No emojis unless tone allows.",
  meta_ads_primary: "Write Meta/Facebook Ads primary text. Max 125 characters ideal, max 250.",
  meta_ads_headline: "Write Meta Ads headline. Max 40 characters.",
  instagram_caption: "Write Instagram caption with line breaks. Include 3-5 relevant hashtags at end.",
  facebook_post: "Write a Facebook post. Engaging, 2-4 short paragraphs.",
  blog_outline: "Write a blog article outline with H2/H3 headings and bullet points under each.",
  seo_title: "Write SEO page title. Max 60 characters.",
  seo_meta_description: "Write SEO meta description. Max 155 characters.",
  portfolio_description: "Write portfolio/project description. Highlight results and style.",
  proposal_intro: "Write proposal introduction paragraph. Warm, confident, personalized.",
};

export function buildContentSystemPrompt(settings: ContentSettings, companyName: string): string {
  const forbidden = Array.isArray(settings.forbidden_claims)
    ? (settings.forbidden_claims as string[]).join(", ")
    : String(settings.forbidden_claims ?? "");

  return `You are a professional copywriter for ${companyName}.

STRICT RULES:
- Do NOT make false promises or guarantees unless explicitly in the provided data.
- Do NOT invent prices, discounts, or availability.
- Do NOT claim limited availability or fake scarcity unless provided in context.
- Do NOT use aggressive spammy language.
- For regulated industries (medical, legal, financial), avoid claims that require professional licensing.
- Keep content aligned with the brand tone and configuration below.
- Use ONLY factual data from the APPROVED_DATA and CONTEXT sections.
- Content is for admin review — never imply it was already sent.

BRAND CONFIGURATION:
- Industry: ${settings.industry}
- Tone of voice: ${settings.tone_of_voice}
- Target audience: ${settings.target_audience ?? "general audience"}
- Brand positioning: ${settings.brand_positioning ?? "professional service provider"}
- Preferred CTA: ${settings.preferred_cta ?? "Contact us"}
- Forbidden claims: ${forbidden || "none specified"}
- Language/locale: ${settings.default_locale}`;
}

export function buildContentUserPrompt(
  contentType: ContentType,
  approvedData: string,
  context: string,
  extraInstructions?: string,
): string {
  const typeInstruction = CONTENT_TYPE_INSTRUCTIONS[contentType];

  return `Generate content type: ${contentType}
${typeInstruction}

APPROVED_DATA (business facts — do not invent beyond this):
${approvedData}

CONTEXT (specific request):
${context || "General marketing content for this business."}

${extraInstructions ? `EXTRA INSTRUCTIONS:\n${extraInstructions}` : ""}

Respond in JSON with keys:
- title (optional short label)
- subject (for email types, otherwise null)
- body (the main content)`;
}

export function buildFollowupSystemPrompt(settings: ContentSettings, companyName: string): string {
  return `${buildContentSystemPrompt(settings, companyName)}

You are generating a personalized follow-up message for a lead or offer.
Personalize using lead name, service requested, offer details, package, and event date when available.
Keep it concise and action-oriented with the preferred CTA.`;
}

export function buildFollowupUserPrompt(
  channel: string,
  approvedData: string,
  leadContext: string,
  stepName?: string,
): string {
  return `Generate a ${channel} follow-up message.
Step: ${stepName ?? "follow-up"}

LEAD/OFFER DATA:
${leadContext}

APPROVED_DATA:
${approvedData}

Respond in JSON with keys:
- subject (for email, null otherwise)
- body (personalized message)`;
}

export function parseContentResponse(raw: string): {
  title?: string;
  subject?: string;
  body: string;
} {
  try {
    const parsed = JSON.parse(raw) as { title?: string; subject?: string; body?: string };
    return {
      title: parsed.title,
      subject: parsed.subject ?? undefined,
      body: parsed.body ?? raw,
    };
  } catch {
    const subjectMatch = raw.match(/^Subject:\s*(.+)$/m);
    if (subjectMatch) {
      return {
        subject: subjectMatch[1].trim(),
        body: raw.replace(/^Subject:\s*.+\n?/m, "").trim(),
      };
    }
    return { body: raw };
  }
}
