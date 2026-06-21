export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Client extends BaseEntity {
  name: string;
  slug: string;
  domain: string | null;
  is_active: boolean;
  settings: Json;
}

export interface BusinessProfile extends BaseEntity {
  client_id: string;
  company_name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  website: string | null;
  social_links: Json;
  metadata: Json;
}

export interface Service extends BaseEntity {
  client_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  base_price: number | null;
  currency: string;
  is_active: boolean;
  sort_order: number;
  metadata: Json;
}

export interface Package extends BaseEntity {
  client_id: string;
  service_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  currency: string;
  features: Json;
  is_active: boolean;
  sort_order: number;
  metadata: Json;
}

export type LeadFieldType =
  | "text"
  | "email"
  | "phone"
  | "date"
  | "select"
  | "multi_select"
  | "textarea"
  | "number"
  | "budget_range"
  | "checkbox";

export interface LeadField extends BaseEntity {
  client_id: string;
  field_key: string;
  label: string;
  field_type: LeadFieldType;
  placeholder: string | null;
  options: Json;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  metadata: Json;
}

export interface Lead extends BaseEntity {
  client_id: string;
  status: string;
  score: number;
  score_category: string | null;
  score_explanation: string | null;
  recommended_action: string | null;
  source: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  form_data: Json;
  ai_summary: string | null;
  ai_recommendation: string | null;
  metadata: Json;
}

export interface Offer extends BaseEntity {
  client_id: string;
  lead_id: string | null;
  package_id: string | null;
  title: string;
  status: string;
  content_html: string | null;
  content_json: Json;
  total_amount: number | null;
  subtotal: number | null;
  extras_total: number | null;
  currency: string;
  valid_until: string | null;
  pdf_url: string | null;
  sent_at: string | null;
  email_body: string | null;
  text_summary: string | null;
  delivery_terms: string | null;
  next_steps: string | null;
  cta_text: string | null;
  cta_url: string | null;
  offer_number: string | null;
  metadata: Json;
}

export interface PackageFeature extends BaseEntity {
  client_id: string;
  package_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: Json;
}

export interface PackageExtra extends BaseEntity {
  client_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  is_active: boolean;
  sort_order: number;
  metadata: Json;
}

export interface PricingRule extends BaseEntity {
  client_id: string;
  name: string;
  rule_type: string;
  conditions: Json;
  action: Json;
  priority: number;
  is_active: boolean;
  metadata: Json;
}

export interface OfferItem extends BaseEntity {
  client_id: string;
  offer_id: string;
  item_type: string;
  item_id: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  metadata: Json;
}

export interface OfferContentData {
  lead_name: string;
  lead_email: string | null;
  requested_service: string | null;
  package_name: string;
  package_description: string | null;
  package_price: number;
  package_features: string[];
  extras: Array<{ name: string; price: number; quantity: number }>;
  subtotal: number;
  extras_total: number;
  total_amount: number;
  currency: string;
  delivery_terms: string;
  next_steps: string;
  cta_text: string;
  cta_url: string | null;
  valid_until: string;
  recommendation_reason: string | null;
  company_name: string;
  logo_url: string | null;
  primary_color: string;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
}

export interface GenerateOfferInput {
  client_id: string;
  lead_id: string;
  package_id?: string;
  extra_ids?: string[];
  regenerate_wording_only?: boolean;
  use_ai_copy?: boolean;
}

export interface FollowupSequence extends BaseEntity {
  client_id: string;
  name: string;
  trigger_event: string;
  is_active: boolean;
  lead_id: string | null;
  offer_id: string | null;
  require_approval: boolean;
  description: string | null;
  metadata: Json;
}

export interface FollowupMessage extends BaseEntity {
  client_id: string;
  sequence_id: string;
  delay_hours: number;
  channel: string;
  subject: string | null;
  body_template: string;
  is_active: boolean;
  sort_order: number;
  require_approval: boolean;
  name: string | null;
  metadata: Json;
}

export interface FaqItem extends BaseEntity {
  client_id: string;
  question: string;
  answer: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: Json;
}

export interface ContentTemplate extends BaseEntity {
  client_id: string;
  template_key: string;
  name: string;
  template_type: string;
  subject: string | null;
  body: string;
  variables: Json;
  is_active: boolean;
  metadata: Json;
}

export interface ActivityLog extends BaseEntity {
  client_id: string | null;
  actor_type: string;
  actor_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Json;
  ip_address: string | null;
}

export interface ApiKey extends BaseEntity {
  client_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  scopes: Json;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
}

export interface WidgetSettings extends BaseEntity {
  client_id: string;
  widget_type: string;
  title: string | null;
  subtitle: string | null;
  theme: Json;
  config: Json;
  is_active: boolean;
}

export interface PlatformAdmin extends BaseEntity {
  email: string;
  full_name: string | null;
  role: "super_admin" | "admin";
  is_active: boolean;
  last_login_at: string | null;
  metadata: Json;
}

export interface WebhookConfig extends BaseEntity {
  client_id: string;
  name: string;
  event_type: string;
  target_url: string;
  secret_placeholder: string | null;
  is_active: boolean;
  metadata: Json;
  last_status: string | null;
  last_error: string | null;
  last_triggered_at: string | null;
}

export interface ClientWithProfile extends Client {
  business_profiles?: BusinessProfile[];
}

export interface CreateClientInput {
  name: string;
  slug?: string;
  domain?: string;
  is_active?: boolean;
  settings?: Json;
  profile?: Partial<Omit<BusinessProfile, keyof BaseEntity | "client_id">>;
}

export interface UpdateClientInput {
  name?: string;
  slug?: string;
  domain?: string | null;
  is_active?: boolean;
  settings?: Json;
}

export interface UpdateBusinessProfileInput {
  company_name?: string;
  tagline?: string | null;
  description?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  website?: string | null;
  social_links?: Json;
  metadata?: Json;
}

export interface CreateLeadFieldInput {
  field_key: string;
  label: string;
  field_type: LeadFieldType;
  placeholder?: string | null;
  options?: Json;
  is_required?: boolean;
  sort_order?: number;
  is_active?: boolean;
  metadata?: Json;
}

export interface UpdateLeadFieldInput extends Partial<CreateLeadFieldInput> {}

export interface LeadFormConfig {
  client_id: string;
  client_slug: string;
  company_name: string;
  fields: LeadField[];
  theme: Record<string, string>;
  config: Record<string, string>;
}

export interface AssistantSettings extends BaseEntity {
  client_id: string;
  is_enabled: boolean;
  greeting_message: string;
  fallback_message: string;
  handoff_message: string;
  tone: string;
  lead_capture_prompt: string;
  lead_form_url: string | null;
  system_instructions: string | null;
  theme: Json;
  config: Json;
  metadata: Json;
}

export interface ChatConversation extends BaseEntity {
  client_id: string;
  lead_id: string | null;
  visitor_id: string | null;
  status: string;
  handoff_requested: boolean;
  resolved_at: string | null;
  metadata: Json;
}

export interface ChatMessage extends BaseEntity {
  client_id: string;
  conversation_id: string;
  role: string;
  content: string;
  metadata: Json;
}

export interface AssistantConfig {
  client_id: string;
  client_slug: string;
  company_name: string;
  is_enabled: boolean;
  greeting_message: string;
  fallback_message: string;
  handoff_message: string;
  tone: string;
  lead_capture_prompt: string;
  lead_form_url: string | null;
  theme: Record<string, string>;
  config: Record<string, string>;
}

export interface ContentSettings extends BaseEntity {
  client_id: string;
  industry: string;
  tone_of_voice: string;
  target_audience: string | null;
  brand_positioning: string | null;
  forbidden_claims: Json;
  preferred_cta: string | null;
  default_locale: string;
  metadata: Json;
}

export interface GeneratedContent extends BaseEntity {
  client_id: string;
  content_type: string;
  title: string | null;
  subject: string | null;
  body: string;
  status: string;
  context: Json;
  lead_id: string | null;
  offer_id: string | null;
  template_id: string | null;
  generated_by: string;
  approved_at: string | null;
  sent_at: string | null;
  metadata: Json;
}

export interface ScheduledFollowup extends BaseEntity {
  client_id: string;
  sequence_id: string | null;
  followup_message_id: string | null;
  lead_id: string | null;
  offer_id: string | null;
  generated_content_id: string | null;
  channel: string;
  subject: string | null;
  body: string;
  status: string;
  scheduled_for: string;
  sent_at: string | null;
  metadata: Json;
}

export interface GenerateContentInput {
  client_id: string;
  content_type: string;
  context?: string;
  lead_id?: string;
  offer_id?: string;
  extra_instructions?: string;
}

export interface CreateFollowupSequenceInput {
  client_id: string;
  lead_id?: string;
  offer_id?: string;
  name: string;
  trigger_event?: string;
  require_approval?: boolean;
  steps: Array<{
    delay_hours: number;
    channel: string;
    name?: string;
    subject?: string;
    body_template?: string;
  }>;
}
