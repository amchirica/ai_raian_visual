import { createAdminClient } from "@/lib/supabase/admin";
import { clientService } from "@/lib/services/client-service";
import { contentService } from "@/lib/services/content-service";
import { assistantService } from "@/lib/services/assistant-service";
import type {
  BusinessProfile,
  ChatConversation,
  Client,
  ContentSettings,
  AssistantSettings,
} from "@/types";

export interface SharedBusinessConfig {
  client: Client;
  profile: BusinessProfile | null;
  contentSettings: ContentSettings | null;
  assistantSettings: AssistantSettings | null;
}

export interface ClientOverviewStats {
  totalLeads: number;
  hotLeads: number;
  offersGenerated: number;
  offersSent: number;
  leadsWon: number;
  leadsLost: number;
  pendingFollowups: number;
  recentConversations: ChatConversation[];
}

export interface PlatformDashboardStats {
  clients: number;
  leads: number;
  hotLeads: number;
  offers: number;
  offersSent: number;
  pendingFollowups: number;
  conversations: number;
}

export class PlatformService {
  private get supabase() {
    return createAdminClient();
  }

  async getSharedBusinessConfig(clientId: string): Promise<SharedBusinessConfig | null> {
    const client = await clientService.getClientById(clientId);
    if (!client) return null;

    const [profile, contentSettings, assistantSettings] = await Promise.all([
      clientService.getBusinessProfile(clientId),
      contentService.getSettings(clientId),
      assistantService.getSettings(clientId),
    ]);

    return { client, profile, contentSettings, assistantSettings };
  }

  async getClientOverviewStats(clientId: string): Promise<ClientOverviewStats> {
    const sb = this.supabase;

    const [
      totalLeadsRes,
      hotLeadsRes,
      offersGeneratedRes,
      offersSentRes,
      leadsWonRes,
      leadsLostRes,
      pendingFollowupsRes,
      recentConversations,
    ] = await Promise.all([
      sb.from("leads").select("id", { count: "exact", head: true }).eq("client_id", clientId),
      sb.from("leads").select("id", { count: "exact", head: true }).eq("client_id", clientId).or("score_category.eq.hot,status.eq.hot"),
      sb.from("offers").select("id", { count: "exact", head: true }).eq("client_id", clientId),
      sb.from("offers").select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("status", "sent"),
      sb.from("leads").select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("status", "won"),
      sb.from("leads").select("id", { count: "exact", head: true }).eq("client_id", clientId).eq("status", "lost"),
      sb.from("scheduled_followups").select("id", { count: "exact", head: true }).eq("client_id", clientId).in("status", ["scheduled", "pending_approval", "approved"]),
      this.getRecentConversations(clientId),
    ]);

    return {
      totalLeads: totalLeadsRes.count ?? 0,
      hotLeads: hotLeadsRes.count ?? 0,
      offersGenerated: offersGeneratedRes.count ?? 0,
      offersSent: offersSentRes.count ?? 0,
      leadsWon: leadsWonRes.count ?? 0,
      leadsLost: leadsLostRes.count ?? 0,
      pendingFollowups: pendingFollowupsRes.count ?? 0,
      recentConversations,
    };
  }

  async getPlatformDashboardStats(): Promise<PlatformDashboardStats> {
    const sb = this.supabase;

    const [clients, leads, hotLeads, offers, offersSent, pendingFollowups, conversations] =
      await Promise.all([
        sb.from("clients").select("id", { count: "exact", head: true }),
        sb.from("leads").select("id", { count: "exact", head: true }),
        sb.from("leads").select("id", { count: "exact", head: true }).or("score_category.eq.hot,status.eq.hot"),
        sb.from("offers").select("id", { count: "exact", head: true }),
        sb.from("offers").select("id", { count: "exact", head: true }).eq("status", "sent"),
        sb.from("scheduled_followups").select("id", { count: "exact", head: true }).in("status", ["scheduled", "pending_approval", "approved"]),
        sb.from("chat_conversations").select("id", { count: "exact", head: true }),
      ]);

    return {
      clients: clients.count ?? 0,
      leads: leads.count ?? 0,
      hotLeads: hotLeads.count ?? 0,
      offers: offers.count ?? 0,
      offersSent: offersSent.count ?? 0,
      pendingFollowups: pendingFollowups.count ?? 0,
      conversations: conversations.count ?? 0,
    };
  }

  async listAllOffers(limit = 50) {
    const { data } = await this.supabase
      .from("offers")
      .select(
        "*, clients(name, slug), offer_items(id, name, description, item_type, quantity, unit_price, total_price)",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  }

  async listPendingFollowups(limit = 50) {
    const { data } = await this.supabase
      .from("scheduled_followups")
      .select("*, clients(name, slug)")
      .in("status", ["scheduled", "pending_approval", "approved"])
      .order("scheduled_for")
      .limit(limit);
    return data ?? [];
  }

  async listAllFollowups(limit = 100, clientId?: string) {
    let query = this.supabase
      .from("scheduled_followups")
      .select("*, clients(name, slug)")
      .order("scheduled_for", { ascending: false })
      .limit(limit);
    if (clientId) query = query.eq("client_id", clientId);
    const { data } = await query;
    return data ?? [];
  }

  async listRecentConversations(limit = 20) {
    const { data } = await this.supabase
      .from("chat_conversations")
      .select("*, clients(name, slug)")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as Array<ChatConversation & { clients?: { name: string; slug: string } }>;
  }

  private async getRecentConversations(clientId: string): Promise<ChatConversation[]> {
    const { data } = await this.supabase
      .from("chat_conversations")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(5);
    return (data ?? []) as ChatConversation[];
  }
}

export const platformService = new PlatformService();
