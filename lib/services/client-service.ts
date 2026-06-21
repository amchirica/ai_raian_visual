import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ActivityLog,
  BusinessProfile,
  Client,
  ClientWithProfile,
  CreateClientInput,
  UpdateBusinessProfileInput,
  UpdateClientInput,
} from "@/types";
import { slugify, toJson } from "@/lib/utils";

export class ClientService {
  private get supabase() {
    return createAdminClient();
  }

  async listClients(): Promise<Client[]> {
    const { data, error } = await this.supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as Client[];
  }

  async getClientById(id: string): Promise<ClientWithProfile | null> {
    const { data, error } = await this.supabase
      .from("clients")
      .select("*, business_profiles(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as ClientWithProfile | null;
  }

  async getClientBySlug(slug: string): Promise<ClientWithProfile | null> {
    const { data, error } = await this.supabase
      .from("clients")
      .select("*, business_profiles(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as ClientWithProfile | null;
  }

  async createClient(input: CreateClientInput): Promise<Client> {
    const slug = input.slug ?? slugify(input.name);

    const { data: client, error } = await this.supabase
      .from("clients")
      .insert({
        name: input.name,
        slug,
        domain: input.domain ?? null,
        is_active: input.is_active ?? true,
        settings: toJson(input.settings ?? {}),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const created = client as Client;

    const profile = input.profile ?? {};
    const { error: profileError } = await this.supabase.from("business_profiles").insert({
      client_id: created.id,
      company_name: profile.company_name ?? input.name,
      tagline: profile.tagline ?? null,
      description: profile.description ?? null,
      logo_url: profile.logo_url ?? null,
      primary_color: profile.primary_color ?? "#2563eb",
      secondary_color: profile.secondary_color ?? "#1e40af",
      contact_email: profile.contact_email ?? null,
      contact_phone: profile.contact_phone ?? null,
      address: profile.address ?? null,
      website: profile.website ?? null,
      social_links: toJson(profile.social_links ?? {}),
      metadata: toJson(profile.metadata ?? {}),
    });

    if (profileError) throw new Error(profileError.message);

    await this.logActivity({
      client_id: created.id,
      action: "client.created",
      entity_type: "client",
      entity_id: created.id,
      details: toJson({ name: created.name, slug: created.slug }),
    });

    return created;
  }

  async updateClient(id: string, input: UpdateClientInput): Promise<Client> {
    const { data, error } = await this.supabase
      .from("clients")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await this.logActivity({
      client_id: id,
      action: "client.updated",
      entity_type: "client",
      entity_id: id,
      details: toJson(input),
    });

    return data as Client;
  }

  async deleteClient(id: string): Promise<void> {
    const client = await this.getClientById(id);
    if (!client) throw new Error("Client not found");

    const { error } = await this.supabase.from("clients").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await this.supabase.from("activity_logs").insert({
      client_id: null,
      actor_type: "admin",
      action: "client.deleted",
      entity_type: "client",
      entity_id: id,
      details: toJson({ name: client.name, slug: client.slug }),
    });
  }

  async getBusinessProfile(clientId: string): Promise<BusinessProfile | null> {
    const { data, error } = await this.supabase
      .from("business_profiles")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as BusinessProfile | null;
  }

  async updateBusinessProfile(
    clientId: string,
    input: UpdateBusinessProfileInput,
  ): Promise<BusinessProfile> {
    const { data, error } = await this.supabase
      .from("business_profiles")
      .update(input)
      .eq("client_id", clientId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as BusinessProfile;
  }

  async listRecentActivity(clientId: string, limit = 15): Promise<ActivityLog[]> {
    const { data, error } = await this.supabase
      .from("activity_logs")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as ActivityLog[];
  }

  async getDashboardStats(clientId?: string) {
    const clientsQuery = this.supabase.from("clients").select("id", { count: "exact", head: true });
    const leadsQuery = this.supabase.from("leads").select("id", { count: "exact", head: true });
    const offersQuery = this.supabase.from("offers").select("id", { count: "exact", head: true });

    if (clientId) {
      leadsQuery.eq("client_id", clientId);
      offersQuery.eq("client_id", clientId);
    }

    const [clients, leads, offers] = await Promise.all([clientsQuery, leadsQuery, offersQuery]);

    return {
      clients: clients.count ?? 0,
      leads: leads.count ?? 0,
      offers: offers.count ?? 0,
    };
  }

  private async logActivity(
    payload: Pick<ActivityLog, "client_id" | "action" | "entity_type" | "entity_id" | "details">,
  ) {
    await this.supabase.from("activity_logs").insert({
      client_id: payload.client_id,
      actor_type: "admin",
      action: payload.action,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      details: payload.details,
    });
  }
}

function createClientService(): ClientService {
  return new ClientService();
}

export const clientService: ClientService = new Proxy({} as ClientService, {
  get(_target, prop) {
    const instance = createClientService();
    const value = Reflect.get(instance, prop, instance) as unknown;
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
});
