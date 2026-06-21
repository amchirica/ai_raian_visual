import { createHmac, timingSafeEqual } from "crypto";

/**
 * Placeholder webhook signature verification.
 * Configure WEBHOOK_SIGNING_SECRET in production.
 */
export function signWebhookPayload(payload: string, secret?: string): string {
  const key = secret ?? process.env.WEBHOOK_SIGNING_SECRET ?? "dev-placeholder-secret";
  return createHmac("sha256", key).update(payload).digest("hex");
}

export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret?: string,
): boolean {
  if (!signature) return false;
  const expected = signWebhookPayload(payload, secret);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const WEBHOOK_SIGNATURE_HEADER = "x-webhook-signature";
