export const APP_NAME = "AI Raian Visual";

export const WIDGET_TYPES = [
  "lead-form",
  "chat",
  "faq",
  "offer-request",
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number];

export const LEAD_STATUSES = [
  "new",
  "hot",
  "warm",
  "cold",
  "contacted",
  "offer_sent",
  "won",
  "lost",
  "archived",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_CATEGORIES = ["hot", "warm", "cold"] as const;

export type LeadCategory = (typeof LEAD_CATEGORIES)[number];

export const OFFER_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "archived",
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const WEBHOOK_EVENTS = [
  "lead.created",
  "lead.updated",
  "offer.created",
  "offer.sent",
  "followup.created",
  "followup.sent",
  "content.generated",
  "content.approved",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const CONTENT_TYPES = [
  "follow_up_email",
  "whatsapp_message",
  "sms_short",
  "meta_ads_primary",
  "meta_ads_headline",
  "instagram_caption",
  "facebook_post",
  "blog_outline",
  "seo_title",
  "seo_meta_description",
  "portfolio_description",
  "proposal_intro",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const CONTENT_STATUSES = ["draft", "approved", "sent", "archived"] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const FOLLOWUP_CHANNELS = ["email", "whatsapp", "sms"] as const;

export type FollowupChannel = (typeof FOLLOWUP_CHANNELS)[number];

export const SCHEDULED_FOLLOWUP_STATUSES = [
  "scheduled",
  "pending_approval",
  "approved",
  "sent",
  "cancelled",
  "skipped",
] as const;

export type ScheduledFollowupStatus = (typeof SCHEDULED_FOLLOWUP_STATUSES)[number];

export const DEFAULT_FOLLOWUP_DELAYS = [
  { label: "24h reminder", hours: 24 },
  { label: "72h reminder", hours: 72 },
  { label: "7-day reminder", hours: 168 },
] as const;

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  follow_up_email: "Follow-up Email",
  whatsapp_message: "WhatsApp Message",
  sms_short: "SMS Short Message",
  meta_ads_primary: "Meta Ads Primary Text",
  meta_ads_headline: "Meta Ads Headline",
  instagram_caption: "Instagram Caption",
  facebook_post: "Facebook Post",
  blog_outline: "Blog Article Outline",
  seo_title: "SEO Title",
  seo_meta_description: "SEO Meta Description",
  portfolio_description: "Portfolio / Project Description",
  proposal_intro: "Proposal Intro Text",
};

export const INDUSTRIES = [
  "wedding_photo_video",
  "salon",
  "clinic",
  "local_service",
  "real_estate",
  "auto_service",
  "restaurant",
  "hotel",
  "consultant",
  "agency",
  "general",
] as const;

export type Industry = (typeof INDUSTRIES)[number];
