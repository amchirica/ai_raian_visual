const HTML_TAG_REGEX = /<[^>]*>/g;
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function sanitizeString(value: unknown, maxLength = 5000): string {
  if (value === null || value === undefined) return "";
  const str = String(value)
    .replace(HTML_TAG_REGEX, "")
    .replace(CONTROL_CHARS_REGEX, "")
    .trim();
  return str.slice(0, maxLength);
}

export function sanitizeFormData(
  data: Record<string, unknown>,
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(data)) {
    const safeKey = sanitizeString(key, 100);
    if (!safeKey) continue;
    if (Array.isArray(value)) {
      result[safeKey] = value.map((v) => sanitizeString(v, 2000)).filter(Boolean);
    } else {
      result[safeKey] = sanitizeString(value, 2000);
    }
  }
  return result;
}
