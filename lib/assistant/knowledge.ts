import { createAdminClient } from "@/lib/supabase/admin";
import type { AssistantSettings, BusinessProfile } from "@/types";

export async function buildApprovedKnowledgeBase(clientId: string): Promise<string> {
  const supabase = createAdminClient();

  const [
    profileRes,
    servicesRes,
    packagesRes,
    featuresRes,
    extrasRes,
    faqsRes,
    settingsRes,
    assistantRes,
  ] = await Promise.all([
    supabase.from("business_profiles").select("*").eq("client_id", clientId).maybeSingle(),
    supabase.from("services").select("name, description, base_price, currency, category").eq("client_id", clientId).eq("is_active", true),
    supabase.from("packages").select("id, name, slug, description, price, currency, metadata").eq("client_id", clientId).eq("is_active", true).order("sort_order"),
    supabase.from("package_features").select("name, description, package_id").eq("client_id", clientId).eq("is_active", true),
    supabase.from("package_extras").select("name, slug, description, price, currency").eq("client_id", clientId).eq("is_active", true),
    supabase.from("faq_items").select("question, answer, category").eq("client_id", clientId).eq("is_active", true).order("sort_order"),
    supabase.from("clients").select("settings").eq("id", clientId).single(),
    supabase.from("assistant_settings").select("*").eq("client_id", clientId).maybeSingle(),
  ]);

  const profile = profileRes.data as BusinessProfile | null;
  const clientSettings = (settingsRes.data?.settings ?? {}) as Record<string, unknown>;
  const offerDefaults = clientSettings.offer_defaults ?? {};
  const assistant = assistantRes.data as AssistantSettings | null;

  const packages = packagesRes.data ?? [];
  const features = featuresRes.data ?? [];

  const packagesWithFeatures = packages.map((pkg) => ({
    ...pkg,
    features: features.filter((f) => f.package_id === pkg.id).map((f) => f.name),
  }));

  return JSON.stringify(
    {
      business: {
        name: profile?.company_name,
        tagline: profile?.tagline,
        description: profile?.description,
        email: profile?.contact_email,
        phone: profile?.contact_phone,
        website: profile?.website,
        address: profile?.address,
      },
      services: servicesRes.data ?? [],
      packages: packagesWithFeatures,
      extras: extrasRes.data ?? [],
      faq: faqsRes.data ?? [],
      offer_rules: {
        delivery_terms: (offerDefaults as Record<string, string>).delivery_terms,
        validity_days: (offerDefaults as Record<string, string>).validity_days,
      },
      lead_form_url: assistant?.lead_form_url,
      areas_covered: (assistant?.metadata as Record<string, unknown>)?.areas_covered,
      booking_process: (assistant?.metadata as Record<string, unknown>)?.booking_process,
    },
    null,
    2,
  );
}
