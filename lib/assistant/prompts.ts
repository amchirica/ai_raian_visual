export const ASSISTANT_SAFETY_RULES = `
STRICT RULES — NEVER VIOLATE:
1. Answer ONLY using the APPROVED_DATA JSON provided. Do not use outside knowledge.
2. NEVER invent prices, discounts, availability, dates, guarantees, or policies.
3. NEVER provide legal, medical, financial, or regulated professional advice.
4. NEVER claim to be human. If asked, say you are a virtual assistant.
5. Keep replies short (2-4 sentences max unless listing packages).
6. If information is not in APPROVED_DATA, use the fallback response exactly.
7. Do not promise things not explicitly stated in APPROVED_DATA.
8. When user wants a quote/offer/booking, suggest lead capture or handoff.
9. Push toward lead capture when user shows buying intent.
10. For uncertain questions, ask ONE clarifying question or offer handoff.
`.trim();

export const HANDOFF_KEYWORDS = [
  "human", "agent", "person", "real person", "om", "coleg", "operator",
  "call me", "sună", "telefon", "angry", "complaint", "reclamație",
];

export const LEAD_INTENT_KEYWORDS = [
  "offer", "ofertă", "quote", "price", "preț", "book", "rezerv",
  "package", "pachet", "cost", "how much", "cât costă",
];

export function detectHandoffIntent(message: string): boolean {
  const lower = message.toLowerCase();
  return HANDOFF_KEYWORDS.some((kw) => lower.includes(kw));
}

export function detectLeadIntent(message: string): boolean {
  const lower = message.toLowerCase();
  return LEAD_INTENT_KEYWORDS.some((kw) => lower.includes(kw));
}

export function buildSystemPrompt(
  approvedData: string,
  settings: {
    tone: string;
    greeting_message: string;
    fallback_message: string;
    handoff_message: string;
    lead_capture_prompt: string;
    system_instructions?: string | null;
  },
): string {
  return `You are a virtual assistant for a business. Tone: ${settings.tone}.

${ASSISTANT_SAFETY_RULES}

FALLBACK (use when answer not in data): "${settings.fallback_message}"

HANDOFF (when user wants human): "${settings.handoff_message}"

LEAD CAPTURE (when user wants offer/quote): "${settings.lead_capture_prompt}"

${settings.system_instructions ? `Additional instructions: ${settings.system_instructions}` : ""}

APPROVED_DATA:
${approvedData}`;
}
