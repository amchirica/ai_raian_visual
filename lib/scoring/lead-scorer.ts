import type { Client, Lead, LeadField } from "@/types";
import type {
  ClientScoringConfig,
  ClientScoringRule,
  LeadScoreCategory,
  LeadScoringResult,
  ScoringBreakdownItem,
} from "./types";
import { DEFAULT_SCORING_CONFIG } from "./types";

function getFieldValue(lead: Lead, fieldKey: string): unknown {
  const formData = lead.form_data as Record<string, unknown>;
  const direct = lead[fieldKey as keyof Lead];
  if (direct !== null && direct !== undefined && direct !== "") return direct;
  return formData[fieldKey];
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value).trim();
}

function parseBudgetMin(value: string): number | null {
  const numbers = value.match(/[\d.,]+/g);
  if (!numbers?.length) return null;
  const parsed = numbers.map((n) => Number(n.replace(",", "."))).filter((n) => !Number.isNaN(n));
  if (!parsed.length) return null;
  if (value.includes("+")) return parsed[0];
  if (parsed.length >= 2) return Math.min(...parsed);
  return parsed[0];
}

function evaluateRule(
  rule: ClientScoringRule,
  lead: Lead,
  fields: LeadField[],
): { matched: boolean; partialPoints?: number } {
  switch (rule.type) {
    case "field_equals": {
      const val = asString(getFieldValue(lead, rule.field ?? ""));
      const target = String(rule.value ?? "");
      if (target === "@" && rule.field === "email") {
        return { matched: val.includes("@") };
      }
      return { matched: val.toLowerCase() === target.toLowerCase() };
    }
    case "field_contains": {
      const val = asString(getFieldValue(lead, rule.field ?? "")).toLowerCase();
      return { matched: val.includes(String(rule.value ?? "").toLowerCase()) };
    }
    case "field_in_list": {
      const val = asString(getFieldValue(lead, rule.field ?? "")).toLowerCase();
      const list = Array.isArray(rule.value)
        ? rule.value.map((v) => String(v).toLowerCase())
        : [String(rule.value ?? "").toLowerCase()];
      return { matched: list.some((item) => val.includes(item) || item.includes(val)) };
    }
    case "budget_range_min": {
      const val = asString(getFieldValue(lead, rule.field ?? "budget_range"));
      const minBudget = parseBudgetMin(val);
      if (minBudget === null || rule.min === undefined) return { matched: false };
      return { matched: minBudget >= rule.min };
    }
    case "date_within_months": {
      const raw = asString(getFieldValue(lead, rule.field ?? ""));
      if (!raw) return { matched: false };
      const date = new Date(raw);
      if (Number.isNaN(date.getTime())) return { matched: false };
      const now = new Date();
      const months = rule.months ?? 12;
      const limit = new Date(now);
      limit.setMonth(limit.getMonth() + months);
      return { matched: date >= now && date <= limit };
    }
    case "date_after_today": {
      const raw = asString(getFieldValue(lead, rule.field ?? ""));
      if (!raw) return { matched: false };
      const date = new Date(raw);
      return { matched: !Number.isNaN(date.getTime()) && date >= new Date() };
    }
    case "completeness": {
      const activeFields = fields.filter((f) => f.is_active);
      if (!activeFields.length) return { matched: false, partialPoints: 0 };
      const filled = activeFields.filter((f) => asString(getFieldValue(lead, f.field_key))).length;
      const ratio = filled / activeFields.length;
      return { matched: ratio >= 0.9, partialPoints: Math.round(rule.points * ratio) };
    }
    case "required_fields_complete": {
      const required = fields.filter((f) => f.is_active && f.is_required);
      if (!required.length) return { matched: true };
      const allFilled = required.every((f) => asString(getFieldValue(lead, f.field_key)));
      return { matched: allFilled };
    }
    default:
      return { matched: false };
  }
}

export function getScoringConfigFromClient(client: Client | { settings: unknown }): ClientScoringConfig {
  const settings = (client.settings ?? {}) as Record<string, unknown>;
  const config = settings.lead_scoring as ClientScoringConfig | undefined;
  if (!config?.rules?.length) return DEFAULT_SCORING_CONFIG;
  return {
    rules: config.rules,
    thresholds: config.thresholds ?? DEFAULT_SCORING_CONFIG.thresholds,
    recommended_actions: {
      ...DEFAULT_SCORING_CONFIG.recommended_actions,
      ...config.recommended_actions,
    },
  };
}

export function scoreLeadWithConfig(
  lead: Lead,
  fields: LeadField[],
  config: ClientScoringConfig = DEFAULT_SCORING_CONFIG,
): LeadScoringResult {
  const breakdown: ScoringBreakdownItem[] = [];
  let score = 0;

  for (const rule of config.rules) {
    const result = evaluateRule(rule, lead, fields);
    const label = rule.label ?? `${rule.type}${rule.field ? `: ${rule.field}` : ""}`;
    let points = 0;

    if (result.partialPoints !== undefined) {
      points = result.partialPoints;
      score += points;
      breakdown.push({ label, points, matched: points > 0 });
    } else if (result.matched) {
      points = rule.points;
      score += points;
      breakdown.push({ label, points, matched: true });
    } else {
      breakdown.push({ label, points: 0, matched: false });
    }
  }

  score = Math.min(Math.max(score, 0), 100);
  const category = getScoreCategory(score, config.thresholds);
  const matchedLabels = breakdown.filter((b) => b.matched).map((b) => b.label);
  const explanation =
    matchedLabels.length > 0
      ? `Score ${score}/100. Matched: ${matchedLabels.join("; ")}.`
      : `Score ${score}/100. No scoring rules matched.`;

  const recommended_action =
    config.recommended_actions?.[category] ??
    DEFAULT_SCORING_CONFIG.recommended_actions?.[category] ??
    "Review lead manually";

  return { score, category, explanation, recommended_action, breakdown };
}

export function getScoreCategory(
  score: number,
  thresholds: { hot: number; warm: number } = DEFAULT_SCORING_CONFIG.thresholds,
): LeadScoreCategory {
  if (score >= thresholds.hot) return "hot";
  if (score >= thresholds.warm) return "warm";
  return "cold";
}

/** @deprecated Use scoreLeadWithConfig */
export function scoreLead(lead: Lead, fields: LeadField[] = []): number {
  return scoreLeadWithConfig(lead, fields).score;
}

/** @deprecated Use getScoreCategory */
export function getLeadPriority(score: number): "low" | "medium" | "high" {
  const cat = getScoreCategory(score);
  if (cat === "hot") return "high";
  if (cat === "warm") return "medium";
  return "low";
}
