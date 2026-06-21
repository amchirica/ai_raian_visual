import { createAdminClient } from "@/lib/supabase/admin";
import { clientService } from "@/lib/services/client-service";
import { leadService } from "@/lib/services/lead-service";
import { packageService } from "@/lib/services/package-service";
import { workflowService } from "@/lib/services/workflow-service";
import {
  recommendPackage,
  buildOfferHtml,
  buildOfferEmailBody,
  buildOfferTextSummary,
  enhanceOfferCopy,
  interpolateTemplate,
} from "@/lib/offers";
import { applyContentsToContentData } from "@/lib/offers/offer-contents";
import type {
  GenerateOfferInput,
  Lead,
  Offer,
  OfferContentData,
  OfferItem,
  Package,
  PackageExtra,
} from "@/types";
import { toJson } from "@/lib/utils";

export class OfferService {
  private get supabase() {
    return createAdminClient();
  }

  async getOffer(offerId: string): Promise<(Offer & { items?: OfferItem[] }) | null> {
    const { data, error } = await this.supabase
      .from("offers")
      .select("*")
      .eq("id", offerId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;

    const { data: items } = await this.supabase
      .from("offer_items")
      .select("*")
      .eq("offer_id", offerId)
      .order("created_at");

    return { ...(data as Offer), items: (items ?? []) as OfferItem[] };
  }

  async generateOffer(input: GenerateOfferInput): Promise<Offer> {
    const client = await clientService.getClientById(input.client_id);
    if (!client) throw new Error("Client not found");

    const lead = await leadService.getLeadById(input.lead_id);
    if (!lead || lead.client_id !== input.client_id) throw new Error("Lead not found");

    const profile = client.business_profiles?.[0] ?? (await clientService.getBusinessProfile(input.client_id));
    const packages = await packageService.listPackages(input.client_id);
    const rules = await packageService.listPricingRules(input.client_id);
    const allExtras = await packageService.listExtras(input.client_id);
    const template = await packageService.getOfferTemplate(input.client_id);

    const settings = (client.settings ?? {}) as Record<string, unknown>;
    const offerDefaults = (settings.offer_defaults ?? {}) as Record<string, string | number>;
    const validityDays = Number(offerDefaults.validity_days ?? 14);
    const currency = String(offerDefaults.currency ?? "EUR");

    let selectedPackage: Package | null = null;
    let recommendationReason: string | null = null;

    if (input.package_id) {
      selectedPackage = packages.find((p) => p.id === input.package_id) ?? null;
    } else {
      const rec = recommendPackage(lead, packages, rules);
      if (rec) {
        selectedPackage = rec.package;
        recommendationReason = rec.reason;
      }
    }

    if (!selectedPackage) throw new Error("No package available for offer");

    const features = await packageService.listFeatures(selectedPackage.id);
    const featureNames = features.map((f) => f.name);

    const selectedExtras: PackageExtra[] = (input.extra_ids ?? [])
      .map((id) => allExtras.find((e) => e.id === id))
      .filter((e): e is PackageExtra => !!e);

    const packagePrice = Number(selectedPackage.price ?? 0);
    const extrasTotal = selectedExtras.reduce((sum, e) => sum + Number(e.price), 0);
    const totalAmount = packagePrice + extrasTotal;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    const formData = lead.form_data as Record<string, unknown>;
    const requestedService = String(formData.desired_services ?? formData.service ?? lead.message ?? "");

    const contentData: OfferContentData = {
      lead_name: lead.name ?? "Client",
      lead_email: lead.email,
      requested_service: requestedService || null,
      package_name: selectedPackage.name,
      package_description: selectedPackage.description,
      package_price: packagePrice,
      package_features: featureNames,
      extras: selectedExtras.map((e) => ({ name: e.name, price: Number(e.price), quantity: 1 })),
      subtotal: packagePrice,
      extras_total: extrasTotal,
      total_amount: totalAmount,
      currency: selectedPackage.currency || currency,
      delivery_terms: String(offerDefaults.delivery_terms ?? (template?.metadata as Record<string, string>)?.delivery_terms ?? "Conform termenilor agreați."),
      next_steps: String(offerDefaults.next_steps ?? (template?.metadata as Record<string, string>)?.next_steps ?? "Contactați-ne pentru confirmare."),
      cta_text: String(offerDefaults.cta_text ?? "Confirmă oferta"),
      cta_url: profile?.website ?? null,
      valid_until: validUntil.toLocaleDateString("ro-RO"),
      recommendation_reason: recommendationReason,
      company_name: profile?.company_name ?? client.name,
      logo_url: profile?.logo_url ?? null,
      primary_color: profile?.primary_color ?? "#2563eb",
      contact_email: profile?.contact_email ?? null,
      contact_phone: profile?.contact_phone ?? null,
      website: profile?.website ?? null,
    };

    if (input.use_ai_copy !== false && !input.regenerate_wording_only) {
      const enhanced = await enhanceOfferCopy(input.client_id, contentData);
      if (enhanced.delivery_terms) contentData.delivery_terms = enhanced.delivery_terms;
      if (enhanced.next_steps) contentData.next_steps = enhanced.next_steps;
    }

    if (input.regenerate_wording_only && input.package_id) {
      const existing = await this.getLatestOfferForLead(input.lead_id);
      if (existing) {
        contentData.package_price = Number(existing.subtotal ?? contentData.package_price);
        contentData.total_amount = Number(existing.total_amount ?? contentData.total_amount);
        contentData.extras_total = Number(existing.extras_total ?? 0);
        const enhanced = await enhanceOfferCopy(input.client_id, contentData);
        if (enhanced.delivery_terms) contentData.delivery_terms = enhanced.delivery_terms;
        if (enhanced.next_steps) contentData.next_steps = enhanced.next_steps;
      }
    }

    const html = buildOfferHtml(contentData);
    const emailBody = template
      ? interpolateTemplate(template.body, {
          lead_name: contentData.lead_name,
          company_name: contentData.company_name,
          package_name: contentData.package_name,
          package_price: String(contentData.package_price),
          currency: contentData.currency,
          requested_service: contentData.requested_service ?? "",
          valid_until: contentData.valid_until,
          next_steps: contentData.next_steps,
        })
      : buildOfferEmailBody(contentData);

    const textSummary = buildOfferTextSummary(contentData);
    const offerNumber = `OFF-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await this.supabase
      .from("offers")
      .insert({
        client_id: input.client_id,
        lead_id: input.lead_id,
        package_id: selectedPackage.id,
        title: `Ofertă ${selectedPackage.name} — ${contentData.lead_name}`,
        status: "draft",
        content_html: html,
        content_json: toJson(contentData),
        subtotal: packagePrice,
        extras_total: extrasTotal,
        total_amount: totalAmount,
        currency: contentData.currency,
        valid_until: validUntil.toISOString(),
        email_body: emailBody,
        text_summary: textSummary,
        delivery_terms: contentData.delivery_terms,
        next_steps: contentData.next_steps,
        cta_text: contentData.cta_text,
        cta_url: contentData.cta_url,
        offer_number: offerNumber,
        metadata: toJson({ recommendation_reason: recommendationReason }),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    const offer = data as Offer;

    await this.supabase.from("offer_items").insert({
      client_id: input.client_id,
      offer_id: offer.id,
      item_type: "package",
      item_id: selectedPackage.id,
      name: selectedPackage.name,
      description: selectedPackage.description,
      quantity: 1,
      unit_price: packagePrice,
      total_price: packagePrice,
    });

    for (const extra of selectedExtras) {
      await this.supabase.from("offer_items").insert({
        client_id: input.client_id,
        offer_id: offer.id,
        item_type: "extra",
        item_id: extra.id,
        name: extra.name,
        description: extra.description,
        quantity: 1,
        unit_price: Number(extra.price),
        total_price: Number(extra.price),
      });
    }

    await this.supabase.from("activity_logs").insert({
      client_id: input.client_id,
      actor_type: "admin",
      action: "offer.generated",
      entity_type: "offer",
      entity_id: offer.id,
      details: toJson({ lead_id: input.lead_id, package_id: selectedPackage.id, total: totalAmount }),
    });

    if (!input.regenerate_wording_only) {
      await leadService.updateLead(input.lead_id, { status: "offer_sent" } as Partial<Lead>).catch(() => undefined);
    }

    void workflowService.onOfferGenerated(offer).catch(() => undefined);

    return offer;
  }

  async duplicateOffer(offerId: string): Promise<Offer> {
    const original = await this.getOffer(offerId);
    if (!original || !original.lead_id) throw new Error("Offer not found");

    return this.generateOffer({
      client_id: original.client_id,
      lead_id: original.lead_id!,
      package_id: original.package_id ?? undefined,
      extra_ids: original.items?.filter((i) => i.item_type === "extra").map((i) => i.item_id!).filter(Boolean),
      use_ai_copy: false,
    });
  }

  async markSent(offerId: string): Promise<Offer> {
    const { data, error } = await this.supabase
      .from("offers")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", offerId)
      .select()
      .single();
    if (error) throw new Error(error.message);

    const offer = data as Offer;
    await this.supabase.from("activity_logs").insert({
      client_id: offer.client_id,
      actor_type: "admin",
      action: "offer.sent",
      entity_type: "offer",
      entity_id: offer.id,
      details: toJson({}),
    });

    void workflowService.onOfferSent(offer).catch(() => undefined);

    return offer;
  }

  async regenerateWording(offerId: string): Promise<Offer> {
    const offer = await this.getOffer(offerId);
    if (!offer) throw new Error("Offer not found");

    const content = offer.content_json as unknown as OfferContentData;
    const enhanced = await enhanceOfferCopy(offer.client_id, content);

    const updatedContent = {
      ...content,
      delivery_terms: enhanced.delivery_terms ?? content.delivery_terms,
      next_steps: enhanced.next_steps ?? content.next_steps,
    };

    const html = buildOfferHtml(updatedContent);
    const emailBody = buildOfferEmailBody(updatedContent);

    const { data, error } = await this.supabase
      .from("offers")
      .update({
        content_html: html,
        content_json: toJson(updatedContent),
        email_body: emailBody,
        delivery_terms: updatedContent.delivery_terms,
        next_steps: updatedContent.next_steps,
      })
      .eq("id", offerId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Offer;
  }

  async updateOffer(
    offerId: string,
    input: {
      title?: string;
      status?: string;
      total_amount?: number;
      currency?: string;
      contents?: string[];
    },
  ): Promise<Offer> {
    const existing = await this.getOffer(offerId);
    if (!existing) throw new Error("Offer not found");

    const patch: Record<string, unknown> = { ...input };
    delete patch.contents;

    if (input.contents) {
      const base =
        (existing.content_json as OfferContentData | null) ??
        ({
          lead_name: "Client",
          lead_email: null,
          requested_service: null,
          package_name: existing.title,
          package_description: null,
          package_price: Number(existing.total_amount ?? 0),
          package_features: [],
          extras: [],
          subtotal: Number(existing.subtotal ?? existing.total_amount ?? 0),
          extras_total: Number(existing.extras_total ?? 0),
          total_amount: Number(existing.total_amount ?? 0),
          currency: existing.currency,
          delivery_terms: existing.delivery_terms ?? "",
          next_steps: existing.next_steps ?? "",
          cta_text: existing.cta_text ?? "Confirmă oferta",
          cta_url: existing.cta_url ?? null,
          valid_until: existing.valid_until ?? new Date().toLocaleDateString("ro-RO"),
          recommendation_reason: null,
          company_name: "",
          logo_url: null,
          primary_color: "#2563eb",
          contact_email: null,
          contact_phone: null,
          website: null,
        } satisfies OfferContentData);

      if (input.title) {
        base.package_name = input.title;
      }
      if (input.total_amount != null) {
        base.package_price = input.total_amount;
        base.subtotal = input.total_amount;
        base.total_amount = input.total_amount + Number(base.extras_total ?? 0);
      }
      if (input.currency) {
        base.currency = input.currency;
      }

      const contentData = applyContentsToContentData(base, input.contents);
      patch.content_json = toJson(contentData);
      patch.content_html = buildOfferHtml(contentData);
      patch.email_body = buildOfferEmailBody(contentData);
      patch.text_summary = buildOfferTextSummary(contentData);

      await this.syncOfferPackageItem(existing, contentData, input.contents);
    }

    const { data, error } = await this.supabase
      .from("offers")
      .update(patch)
      .eq("id", offerId)
      .select()
      .single();
    if (error) throw new Error(error.message);

    const offer = data as Offer;
    await this.supabase.from("activity_logs").insert({
      client_id: offer.client_id,
      actor_type: "admin",
      action: "offer.updated",
      entity_type: "offer",
      entity_id: offerId,
      details: toJson({ ...input, contents_count: input.contents?.length }),
    });
    return offer;
  }

  private async syncOfferPackageItem(
    offer: Offer & { items?: OfferItem[] },
    contentData: OfferContentData,
    contents: string[],
  ) {
    const description = contents.length ? contents.join(" · ") : null;
    const packageItem = offer.items?.find((item) => item.item_type === "package");

    if (packageItem) {
      await this.supabase
        .from("offer_items")
        .update({
          name: contentData.package_name,
          description,
        })
        .eq("id", packageItem.id);
      return;
    }

    if (contents.length === 0) return;

    await this.supabase.from("offer_items").insert({
      client_id: offer.client_id,
      offer_id: offer.id,
      item_type: "package",
      item_id: offer.package_id,
      name: contentData.package_name,
      description,
      quantity: 1,
      unit_price: Number(offer.total_amount ?? 0),
      total_price: Number(offer.total_amount ?? 0),
    });
  }

  async deleteOffer(offerId: string): Promise<void> {
    const offer = await this.getOffer(offerId);
    if (!offer) throw new Error("Offer not found");

    const { error } = await this.supabase.from("offers").delete().eq("id", offerId);
    if (error) throw new Error(error.message);

    await this.supabase.from("activity_logs").insert({
      client_id: offer.client_id,
      actor_type: "admin",
      action: "offer.deleted",
      entity_type: "offer",
      entity_id: offerId,
      details: toJson({ title: offer.title }),
    });
  }

  private async getLatestOfferForLead(leadId: string): Promise<Offer | null> {
    const { data } = await this.supabase
      .from("offers")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data as Offer | null;
  }

  async createDraftOffer(input: {
    client_id: string;
    title: string;
    total_amount: number;
    currency?: string;
    lead_id?: string;
    package_id?: string;
    contents?: string[];
  }): Promise<Offer> {
    const client = await clientService.getClientById(input.client_id);
    if (!client) throw new Error("Client not found");

    const profile = client.business_profiles?.[0] ?? (await clientService.getBusinessProfile(input.client_id));
    const currency = input.currency ?? "EUR";
    const offerNumber = `OFF-${Date.now().toString(36).toUpperCase()}`;

    const contents = (input.contents ?? []).filter(Boolean);

    const contentData: OfferContentData = {
      lead_name: "Client",
      lead_email: null,
      requested_service: null,
      package_name: input.title,
      package_description: null,
      package_price: input.total_amount,
      package_features: contents,
      extras: [],
      subtotal: input.total_amount,
      extras_total: 0,
      total_amount: input.total_amount,
      currency,
      delivery_terms: "Conform termenilor agreați.",
      next_steps: "Contactați-ne pentru confirmare.",
      cta_text: "Confirmă oferta",
      cta_url: profile?.website ?? null,
      valid_until: new Date(Date.now() + 14 * 86400000).toLocaleDateString("ro-RO"),
      recommendation_reason: null,
      company_name: profile?.company_name ?? client.name,
      logo_url: profile?.logo_url ?? null,
      primary_color: profile?.primary_color ?? "#2563eb",
      contact_email: profile?.contact_email ?? null,
      contact_phone: profile?.contact_phone ?? null,
      website: profile?.website ?? null,
    };

    if (input.lead_id) {
      const lead = await leadService.getLeadById(input.lead_id);
      if (lead) {
        contentData.lead_name = lead.name ?? "Client";
        contentData.lead_email = lead.email;
      }
    }

    const html = buildOfferHtml(contentData);
    const emailBody = buildOfferEmailBody(contentData);
    const textSummary = buildOfferTextSummary(contentData);

    const { data, error } = await this.supabase
      .from("offers")
      .insert({
        client_id: input.client_id,
        lead_id: input.lead_id ?? null,
        package_id: input.package_id ?? null,
        title: input.title,
        status: "draft",
        content_html: html,
        content_json: toJson(contentData),
        subtotal: input.total_amount,
        extras_total: 0,
        total_amount: input.total_amount,
        currency,
        email_body: emailBody,
        text_summary: textSummary,
        offer_number: offerNumber,
        metadata: toJson({ manual: true }),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const offer = data as Offer;

    if (contents.length > 0) {
      await this.supabase.from("offer_items").insert({
        client_id: input.client_id,
        offer_id: offer.id,
        item_type: "package",
        item_id: input.package_id ?? null,
        name: input.title,
        description: contents.join(" · "),
        quantity: 1,
        unit_price: input.total_amount,
        total_price: input.total_amount,
      });
    }

    await this.supabase.from("activity_logs").insert({
      client_id: input.client_id,
      actor_type: "admin",
      action: "offer.created",
      entity_type: "offer",
      entity_id: offer.id,
      details: toJson({ title: input.title, manual: true, contents_count: contents.length }),
    });
    return offer;
  }

  async listOffersForClient(clientId: string): Promise<Offer[]> {
    const { data, error } = await this.supabase
      .from("offers")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Offer[];
  }
}

function createOfferService(): OfferService {
  return new OfferService();
}

export const offerService: OfferService = new Proxy({} as OfferService, {
  get(_target, prop) {
    const instance = createOfferService();
    const value = Reflect.get(instance, prop, instance) as unknown;
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
});
