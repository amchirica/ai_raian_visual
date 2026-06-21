import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ContentTemplate,
  Package,
  PackageExtra,
  PackageFeature,
  PricingRule,
} from "@/types";
import { toJson } from "@/lib/utils";

export class PackageService {
  private get supabase() {
    return createAdminClient();
  }

  async listPackages(clientId: string): Promise<Package[]> {
    const { data, error } = await this.supabase
      .from("packages")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as Package[];
  }

  async getPackage(packageId: string): Promise<Package | null> {
    const { data, error } = await this.supabase
      .from("packages")
      .select("*")
      .eq("id", packageId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Package | null;
  }

  async createPackage(
    clientId: string,
    input: Partial<Package> & { name: string; slug: string },
  ): Promise<Package> {
    const { data, error } = await this.supabase
      .from("packages")
      .insert({
        client_id: clientId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        price: input.price ?? null,
        currency: input.currency ?? "EUR",
        service_id: input.service_id ?? null,
        is_active: input.is_active ?? true,
        sort_order: input.sort_order ?? 0,
        features: toJson(input.features ?? []),
        metadata: toJson(input.metadata ?? {}),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Package;
  }

  async updatePackage(packageId: string, input: Partial<Package>): Promise<Package> {
    const payload: Record<string, unknown> = { ...input };
    if (input.features !== undefined) payload.features = toJson(input.features);
    if (input.metadata !== undefined) payload.metadata = toJson(input.metadata);
    delete payload.id;
    delete payload.client_id;
    delete payload.created_at;
    delete payload.updated_at;

    const { data, error } = await this.supabase
      .from("packages")
      .update(payload)
      .eq("id", packageId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Package;
  }

  async listFeatures(packageId: string): Promise<PackageFeature[]> {
    const { data, error } = await this.supabase
      .from("package_features")
      .select("*")
      .eq("package_id", packageId)
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as PackageFeature[];
  }

  async createFeature(
    clientId: string,
    packageId: string,
    input: { name: string; description?: string; sort_order?: number },
  ): Promise<PackageFeature> {
    const { data, error } = await this.supabase
      .from("package_features")
      .insert({
        client_id: clientId,
        package_id: packageId,
        name: input.name,
        description: input.description ?? null,
        sort_order: input.sort_order ?? 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as PackageFeature;
  }

  async deleteFeature(featureId: string): Promise<void> {
    const { error } = await this.supabase.from("package_features").delete().eq("id", featureId);
    if (error) throw new Error(error.message);
  }

  async listExtras(clientId: string, options?: { activeOnly?: boolean }): Promise<PackageExtra[]> {
    let query = this.supabase.from("package_extras").select("*").eq("client_id", clientId);
    if (options?.activeOnly !== false) query = query.eq("is_active", true);
    const { data, error } = await query.order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as PackageExtra[];
  }

  async createExtra(
    clientId: string,
    input: { name: string; slug: string; price: number; description?: string; currency?: string },
  ): Promise<PackageExtra> {
    const { data, error } = await this.supabase
      .from("package_extras")
      .insert({
        client_id: clientId,
        name: input.name,
        slug: input.slug,
        price: input.price,
        description: input.description ?? null,
        currency: input.currency ?? "EUR",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as PackageExtra;
  }

  async updateExtra(extraId: string, input: Partial<PackageExtra>): Promise<PackageExtra> {
    const { data, error } = await this.supabase
      .from("package_extras")
      .update(input)
      .eq("id", extraId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as PackageExtra;
  }

  async listPricingRules(clientId: string): Promise<PricingRule[]> {
    const { data, error } = await this.supabase
      .from("pricing_rules")
      .select("*")
      .eq("client_id", clientId)
      .order("priority", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as PricingRule[];
  }

  async createPricingRule(
    clientId: string,
    input: { name: string; conditions: unknown; action: unknown; priority?: number },
  ): Promise<PricingRule> {
    const { data, error } = await this.supabase
      .from("pricing_rules")
      .insert({
        client_id: clientId,
        name: input.name,
        rule_type: "recommend_package",
        conditions: toJson(input.conditions),
        action: toJson(input.action),
        priority: input.priority ?? 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as PricingRule;
  }

  async listAllFeatures(clientId: string): Promise<PackageFeature[]> {
    const { data, error } = await this.supabase
      .from("package_features")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as PackageFeature[];
  }

  async updateFeature(featureId: string, input: Partial<PackageFeature>): Promise<PackageFeature> {
    const { data, error } = await this.supabase
      .from("package_features")
      .update(input)
      .eq("id", featureId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as PackageFeature;
  }

  async deletePackage(packageId: string): Promise<void> {
    const { error } = await this.supabase.from("packages").delete().eq("id", packageId);
    if (error) throw new Error(error.message);
  }

  async deleteExtra(extraId: string): Promise<void> {
    const { error } = await this.supabase.from("package_extras").delete().eq("id", extraId);
    if (error) throw new Error(error.message);
  }

  async deletePricingRule(ruleId: string): Promise<void> {
    const { error } = await this.supabase.from("pricing_rules").delete().eq("id", ruleId);
    if (error) throw new Error(error.message);
  }

  async updatePricingRule(ruleId: string, input: Partial<PricingRule>): Promise<PricingRule> {
    const payload: Record<string, unknown> = { ...input };
    if (input.conditions !== undefined) payload.conditions = toJson(input.conditions);
    if (input.action !== undefined) payload.action = toJson(input.action);
    delete payload.id;
    delete payload.client_id;
    delete payload.created_at;
    delete payload.updated_at;
    const { data, error } = await this.supabase
      .from("pricing_rules")
      .update(payload)
      .eq("id", ruleId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as PricingRule;
  }

  async duplicatePackage(clientId: string, packageId: string): Promise<Package> {
    const pkg = await this.getPackage(packageId);
    if (!pkg) throw new Error("Package not found");
    const features = await this.listFeatures(packageId);
    const copy = await this.createPackage(clientId, {
      name: `${pkg.name} (copy)`,
      slug: `${pkg.slug}-copy-${Date.now().toString(36)}`,
      description: pkg.description ?? undefined,
      price: pkg.price ?? undefined,
      currency: pkg.currency,
      service_id: pkg.service_id ?? undefined,
    });
    for (const f of features) {
      await this.createFeature(clientId, copy.id, {
        name: f.name,
        description: f.description ?? undefined,
        sort_order: f.sort_order,
      });
    }
    return copy;
  }

  async getOfferTemplate(clientId: string): Promise<ContentTemplate | null> {
    const { data, error } = await this.supabase
      .from("content_templates")
      .select("*")
      .eq("client_id", clientId)
      .eq("template_key", "offer_default")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as ContentTemplate | null;
  }

  async upsertOfferTemplate(
    clientId: string,
    input: { subject?: string; body: string; metadata?: unknown },
  ): Promise<ContentTemplate> {
    const existing = await this.getOfferTemplate(clientId);
    if (existing) {
      const { data, error } = await this.supabase
        .from("content_templates")
        .update({
          body: input.body,
          subject: input.subject ?? existing.subject,
          metadata: toJson(input.metadata ?? existing.metadata),
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as ContentTemplate;
    }

    const { data, error } = await this.supabase
      .from("content_templates")
      .insert({
        client_id: clientId,
        template_key: "offer_default",
        name: "Default Offer Template",
        template_type: "offer",
        subject: input.subject ?? "Ofertă {{package_name}}",
        body: input.body,
        metadata: toJson(input.metadata ?? {}),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as ContentTemplate;
  }
}

export const packageService = new PackageService();
