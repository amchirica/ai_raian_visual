export type LeadScoreCategory = "hot" | "warm" | "cold";

export type ScoringRuleType =
  | "field_equals"
  | "field_contains"
  | "field_in_list"
  | "budget_range_min"
  | "date_within_months"
  | "date_after_today"
  | "completeness"
  | "required_fields_complete";

export interface ClientScoringRule {
  type: ScoringRuleType;
  field?: string;
  value?: string | number | string[];
  points: number;
  label?: string;
  months?: number;
  min?: number;
}

export interface ClientScoringConfig {
  rules: ClientScoringRule[];
  thresholds: { hot: number; warm: number };
  recommended_actions?: Partial<Record<LeadScoreCategory, string>>;
}

export interface ScoringBreakdownItem {
  label: string;
  points: number;
  matched: boolean;
}

export interface LeadScoringResult {
  score: number;
  category: LeadScoreCategory;
  explanation: string;
  recommended_action: string;
  breakdown: ScoringBreakdownItem[];
}

export const DEFAULT_SCORING_CONFIG: ClientScoringConfig = {
  rules: [
    { type: "required_fields_complete", points: 20, label: "Required fields complete" },
    { type: "completeness", points: 20, label: "Form completeness" },
    { type: "field_equals", field: "email", value: "@", points: 0, label: "Email provided" },
  ],
  thresholds: { hot: 70, warm: 40 },
  recommended_actions: {
    hot: "Contact immediately and prioritize follow-up",
    warm: "Follow up within 24 hours",
    cold: "Add to nurture sequence",
  },
};
