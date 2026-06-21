import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { Card, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";
import { platformService } from "@/lib/services/platform-service";
import { formatDate } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActivityLog } from "@/types";

async function getRecentActivity(): Promise<ActivityLog[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    return (data ?? []) as ActivityLog[];
  } catch {
    return [];
  }
}

export default async function AdminDashboardPage() {
  let clients: Awaited<ReturnType<typeof clientService.listClients>> = [];
  let stats = {
    clients: 0,
    leads: 0,
    hotLeads: 0,
    offers: 0,
    offersSent: 0,
    pendingFollowups: 0,
    conversations: 0,
  };
  let activity: Awaited<ReturnType<typeof getRecentActivity>> = [];
  let dbError: string | null = null;

  try {
    [clients, stats, activity] = await Promise.all([
      clientService.listClients(),
      platformService.getPlatformDashboardStats(),
      getRecentActivity(),
    ]);
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Database connection failed";
  }

  return (
    <>
      <AdminHeader
        title="Dashboard"
        description="Unified platform — Lead Engine, Offers, Assistant, Content & Follow-ups."
        actions={
          <Link href="/admin/clients/new">
            <Button>Create Client</Button>
          </Link>
        }
      />

      {dbError ? (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <p className="font-medium text-amber-900">Database not connected</p>
          <p className="mt-1 text-sm text-amber-800">{dbError}</p>
          <p className="mt-2 text-sm text-amber-800">
            Configure Supabase in <code>.env.local</code> and run migrations from{" "}
            <code>supabase/migrations/</code>.
          </p>
        </Card>
      ) : null}

      <Card className="mb-6">
        <h3 className="mb-3 font-semibold">Unified Workflow</h3>
        <p className="text-sm text-muted">
          Visitor / Meta / Manual → Lead capture & scoring → Admin review → Offer generation →
          Send/copy offer → Follow-up sequence (24h / 72h / 7d) → Content engine → AI Assistant (parallel)
        </p>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/clients"><StatCard label="Clients" value={stats.clients} /></Link>
        <Link href="/admin/leads"><StatCard label="Leads" value={stats.leads} /></Link>
        <Link href="/admin/leads"><StatCard label="Hot Leads" value={stats.hotLeads} /></Link>
        <Link href="/admin/offers"><StatCard label="Offers" value={stats.offers} /></Link>
        <Link href="/admin/offers"><StatCard label="Offers Sent" value={stats.offersSent} /></Link>
        <Link href="/admin/follow-ups"><StatCard label="Pending Follow-ups" value={stats.pendingFollowups} /></Link>
        <Link href="/admin/assistant"><StatCard label="Chat Conversations" value={stats.conversations} /></Link>
        <Link href="/admin/content-generator"><StatCard label="Content" value="→" /></Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Clients</h2>
            <Link href="/admin/clients" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          {clients.length === 0 ? (
            <p className="text-sm text-muted">No clients yet.</p>
          ) : (
            <div className="space-y-3">
              {clients.slice(0, 5).map((client) => (
                <Link
                  key={client.id}
                  href={`/admin/clients/${client.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-accent"
                >
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-muted">/{client.slug}</p>
                  </div>
                  <Badge variant={client.is_active ? "success" : "warning"}>
                    {client.is_active ? "Active" : "Inactive"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-muted">No activity logged yet.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="rounded-lg border border-border px-4 py-3">
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted">{formatDate(item.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
