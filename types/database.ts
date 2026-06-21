import type {
  ActivityLog,
  ApiKey,
  BusinessProfile,
  Client,
  ContentTemplate,
  FaqItem,
  FollowupMessage,
  FollowupSequence,
  Json,
  Lead,
  LeadField,
  Offer,
  Package,
  PlatformAdmin,
  Service,
  WidgetSettings,
} from "./index";

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          domain?: string | null;
          is_active?: boolean;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: Relationship[];
      };
      business_profiles: {
        Row: BusinessProfile;
        Insert: {
          id?: string;
          client_id: string;
          company_name: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["business_profiles"]["Insert"]>;
        Relationships: Relationship[];
      };
      services: {
        Row: Service;
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          slug: string;
          description?: string | null;
          category?: string | null;
          base_price?: number | null;
          currency?: string;
          is_active?: boolean;
          sort_order?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: Relationship[];
      };
      packages: {
        Row: Package;
        Insert: {
          id?: string;
          client_id: string;
          service_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          price?: number | null;
          currency?: string;
          features?: Json;
          is_active?: boolean;
          sort_order?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["packages"]["Insert"]>;
        Relationships: Relationship[];
      };
      lead_fields: {
        Row: LeadField;
        Insert: {
          id?: string;
          client_id: string;
          field_key: string;
          label: string;
          field_type?: LeadField["field_type"];
          placeholder?: string | null;
          options?: Json;
          is_required?: boolean;
          sort_order?: number;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_fields"]["Insert"]>;
        Relationships: Relationship[];
      };
      leads: {
        Row: Lead;
        Insert: {
          id?: string;
          client_id: string;
          status?: string;
          score?: number;
          score_category?: string | null;
          score_explanation?: string | null;
          recommended_action?: string | null;
          source?: string | null;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          message?: string | null;
          form_data?: Json;
          ai_summary?: string | null;
          ai_recommendation?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: Relationship[];
      };
      offers: {
        Row: Offer;
        Insert: {
          id?: string;
          client_id: string;
          lead_id?: string | null;
          package_id?: string | null;
          title: string;
          status?: string;
          content_html?: string | null;
          content_json?: Json;
          total_amount?: number | null;
          currency?: string;
          valid_until?: string | null;
          pdf_url?: string | null;
          sent_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["offers"]["Insert"]>;
        Relationships: Relationship[];
      };
      followup_sequences: {
        Row: FollowupSequence;
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          trigger_event?: string;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["followup_sequences"]["Insert"]>;
        Relationships: Relationship[];
      };
      followup_messages: {
        Row: FollowupMessage;
        Insert: {
          id?: string;
          client_id: string;
          sequence_id: string;
          delay_hours?: number;
          channel?: string;
          subject?: string | null;
          body_template: string;
          is_active?: boolean;
          sort_order?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["followup_messages"]["Insert"]>;
        Relationships: Relationship[];
      };
      faq_items: {
        Row: FaqItem;
        Insert: {
          id?: string;
          client_id: string;
          question: string;
          answer: string;
          category?: string | null;
          sort_order?: number;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["faq_items"]["Insert"]>;
        Relationships: Relationship[];
      };
      content_templates: {
        Row: ContentTemplate;
        Insert: {
          id?: string;
          client_id: string;
          template_key: string;
          name: string;
          template_type?: string;
          subject?: string | null;
          body: string;
          variables?: Json;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_templates"]["Insert"]>;
        Relationships: Relationship[];
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: {
          id?: string;
          client_id?: string | null;
          actor_type?: string;
          actor_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          details?: Json;
          ip_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Insert"]>;
        Relationships: Relationship[];
      };
      api_keys: {
        Row: ApiKey;
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          scopes?: Json;
          is_active?: boolean;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>;
        Relationships: Relationship[];
      };
      widget_settings: {
        Row: WidgetSettings;
        Insert: {
          id?: string;
          client_id: string;
          widget_type: string;
          title?: string | null;
          subtitle?: string | null;
          theme?: Json;
          config?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["widget_settings"]["Insert"]>;
        Relationships: Relationship[];
      };
      platform_admins: {
        Row: PlatformAdmin;
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "super_admin" | "admin";
          is_active?: boolean;
          last_login_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["platform_admins"]["Insert"]>;
        Relationships: Relationship[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type { Json };
