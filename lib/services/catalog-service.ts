import { createAdminClient } from "@/lib/supabase/admin";
import type { Service } from "@/types";
import { toJson } from "@/lib/utils";

export class CatalogService {
  private get supabase() {
    return createAdminClient();
  }

  async listServices(clientId: string): Promise<Service[]> {
    const { data, error } = await this.supabase
      .from("services")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as Service[];
  }

  async createService(
    clientId: string,
    input: {
      name: string;
      slug: string;
      description?: string;
      category?: string;
      base_price?: number;
      currency?: string;
      sort_order?: number;
    },
  ): Promise<Service> {
    const { data, error } = await this.supabase
      .from("services")
      .insert({
        client_id: clientId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        category: input.category ?? null,
        base_price: input.base_price ?? null,
        currency: input.currency ?? "EUR",
        sort_order: input.sort_order ?? 0,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Service;
  }

  async updateService(serviceId: string, input: Partial<Service>): Promise<Service> {
    const payload: Record<string, unknown> = { ...input };
    if (input.metadata !== undefined) payload.metadata = toJson(input.metadata);
    delete payload.id;
    delete payload.client_id;
    delete payload.created_at;
    delete payload.updated_at;

    const { data, error } = await this.supabase
      .from("services")
      .update(payload)
      .eq("id", serviceId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Service;
  }

  async deleteService(serviceId: string): Promise<void> {
    const { error } = await this.supabase.from("services").delete().eq("id", serviceId);
    if (error) throw new Error(error.message);
  }
}

export const catalogService = new CatalogService();
