import type { OfferContentData } from "@/types";

export type OfferItemSummary = {
  name: string;
  description?: string | null;
  item_type?: string;
  total_price?: number;
};

export type OfferContentsSource = {
  offer_items?: OfferItemSummary[];
  content_json?: unknown;
  text_summary?: string | null;
};

/** Human-readable lines describing what an offer includes. */
export function formatOfferContents(offer: OfferContentsSource): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  function add(line: string) {
    const key = line.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    lines.push(line.trim());
  }

  for (const item of offer.offer_items ?? []) {
    if (item.description?.trim()) {
      add(`${item.name} — ${item.description.trim()}`);
    } else {
      add(item.name);
    }
  }

  const json = offer.content_json as Partial<OfferContentData> | null | undefined;
  if (json?.package_features?.length) {
    for (const feature of json.package_features) {
      if (typeof feature === "string") add(feature);
    }
  }
  if (json?.extras?.length) {
    const currency = json.currency ?? "EUR";
    for (const extra of json.extras) {
      add(`${extra.name} (+${extra.price} ${currency})`);
    }
  }

  if (lines.length === 0 && offer.text_summary?.trim()) {
    add(offer.text_summary.trim());
  }

  return lines;
}

export function contentsToTextareaValue(lines: string[]): string {
  return lines.join("\n");
}

export function parseContentsTextarea(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function applyContentsToContentData(
  data: OfferContentData,
  contents: string[],
): OfferContentData {
  return {
    ...data,
    package_features: contents,
  };
}
