import type { Lead, Package, PricingRule } from "@/types";

export interface RecommendationResult {
  package: Package;
  reason: string;
  matched_rule: string | null;
}

type ConditionOperator =
  | "equals"
  | "contains"
  | "in"
  | "gte"
  | "lte"
  | "budget_min"
  | "budget_max"
  | "budget_between";

interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

function getLeadFieldValue(lead: Lead, field: string): string {
  const form = lead.form_data as Record<string, unknown>;
  const direct = lead[field as keyof Lead];
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const fromForm = form[field];
  if (fromForm === null || fromForm === undefined) return "";
  if (Array.isArray(fromForm)) return fromForm.join(", ");
  return String(fromForm).trim();
}

function parseBudget(value: string): { min: number; max: number } | null {
  const numbers = value.match(/[\d.,]+/g);
  if (!numbers?.length) return null;
  const parsed = numbers.map((n) => Number(n.replace(",", "."))).filter((n) => !Number.isNaN(n));
  if (!parsed.length) return null;
  if (value.includes("+")) return { min: parsed[0], max: Infinity };
  if (parsed.length >= 2) return { min: Math.min(...parsed), max: Math.max(...parsed) };
  return { min: parsed[0], max: parsed[0] };
}

function evaluateCondition(lead: Lead, condition: RuleCondition): boolean {
  const raw = getLeadFieldValue(lead, condition.field);
  const val = raw.toLowerCase();
  const op = condition.operator;
  const target = condition.value;

  switch (op) {
    case "equals":
      return val === String(target).toLowerCase();
    case "contains":
      return val.includes(String(target).toLowerCase());
    case "in": {
      const list = Array.isArray(target) ? target.map(String) : [String(target)];
      return list.some((item) => val.includes(item.toLowerCase()));
    }
    case "gte": {
      const num = Number(raw);
      return !Number.isNaN(num) && num >= Number(target);
    }
    case "lte": {
      const num = Number(raw);
      return !Number.isNaN(num) && num <= Number(target);
    }
    case "budget_min": {
      const budget = parseBudget(raw);
      return budget !== null && budget.min >= Number(target);
    }
    case "budget_max": {
      const budget = parseBudget(raw);
      return budget !== null && budget.max <= Number(target);
    }
    case "budget_between": {
      const budget = parseBudget(raw);
      const range = target as { min: number; max: number };
      if (!budget || !range) return false;
      return budget.min >= range.min && budget.max <= range.max;
    }
    default:
      return false;
  }
}

function evaluateRule(lead: Lead, rule: PricingRule): boolean {
  const conditions = (rule.conditions ?? []) as unknown as RuleCondition[];
  if (!conditions.length) return false;
  return conditions.every((c) => evaluateCondition(lead, c));
}

export function recommendPackage(
  lead: Lead,
  packages: Package[],
  rules: PricingRule[],
): RecommendationResult | null {
  if (!packages.length) return null;

  const activeRules = rules
    .filter((r) => r.is_active && r.rule_type === "recommend_package")
    .sort((a, b) => b.priority - a.priority);

  for (const rule of activeRules) {
    if (!evaluateRule(lead, rule)) continue;
    const action = rule.action as { package_slug?: string; reason?: string };
    const pkg = packages.find((p) => p.slug === action.package_slug && p.is_active);
    if (pkg) {
      return { package: pkg, reason: action.reason ?? rule.name, matched_rule: rule.name };
    }
  }

  const sorted = [...packages].filter((p) => p.is_active).sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  const mid = sorted[Math.floor(sorted.length / 2)] ?? sorted[0];
  return mid
    ? { package: mid, reason: "Pachet standard recomandat", matched_rule: null }
    : null;
}
