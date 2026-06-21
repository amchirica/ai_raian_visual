import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, StatCard } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { ClientOverviewStats } from "@/lib/services/platform-service";
import type { ChatConversation, Client } from "@/types";

interface ClientOverviewPanelProps {
  client: Client;
  stats: ClientOverviewStats;
}

export function ClientOverviewPanel({ client, stats }: ClientOverviewPanelProps) {
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 font-semibold">Unified Workflow</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="rounded-full bg-accent px-3 py-1">Visitor / Meta / Manual</span>
          <span>→</span>
          <span className="rounded-full bg-accent px-3 py-1">Lead Engine</span>
          <span>→</span>
          <span className="rounded-full bg-accent px-3 py-1">Admin Review</span>
          <span>→</span>
          <span className="rounded-full bg-accent px-3 py-1">Offer Generator</span>
          <span>→</span>
          <span className="rounded-full bg-accent px-3 py-1">Send Offer</span>
          <span>→</span>
          <span className="rounded-full bg-accent px-3 py-1">Follow-ups</span>
          <span>→</span>
          <span className="rounded-full bg-accent px-3 py-1">Content Engine</span>
        </div>
        <p className="mt-3 text-sm text-muted">
          AI Assistant runs in parallel — FAQs, lead capture, and chat-to-lead conversion.
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={`/admin/clients/${client.id}/leads`}>
          <StatCard label="Total Leads" value={stats.totalLeads} />
        </Link>
        <Link href={`/admin/clients/${client.id}/leads`}>
          <StatCard label="Hot Leads" value={stats.hotLeads} />
        </Link>
        <Link href={`/admin/offers?client=${client.id}`}>
          <StatCard label="Offers Generated" value={stats.offersGenerated} />
        </Link>
        <Link href={`/admin/offers?client=${client.id}`}>
          <StatCard label="Offers Sent" value={stats.offersSent} />
        </Link>
        <StatCard label="Won" value={stats.leadsWon} />
        <StatCard label="Lost" value={stats.leadsLost} />
        <Link href={`/admin/follow-ups?client=${client.id}`}>
          <StatCard label="Pending Follow-ups" value={stats.pendingFollowups} />
        </Link>
        <Link href={`/admin/clients/${client.id}/chat-conversations`}>
          <StatCard label="Recent Chats" value={stats.recentConversations.length} />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Module Shortcuts</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { href: `/admin/clients/${client.id}/profile`, label: "Business Profile" },
              { href: `/admin/clients/${client.id}/services`, label: "Services" },
              { href: `/admin/clients/${client.id}/leads`, label: "Leads" },
              { href: `/admin/clients/${client.id}/lead-fields`, label: "Lead Form Fields" },
              { href: `/admin/clients/${client.id}/widget-settings`, label: "Widget Settings" },
              { href: `/admin/clients/${client.id}/packages`, label: "Packages & Offers" },
              { href: `/admin/clients/${client.id}/assistant`, label: "AI Assistant" },
              { href: `/admin/clients/${client.id}/content-settings`, label: "Content Settings" },
              { href: `/admin/content-generator?client=${client.id}`, label: "Content Generator" },
              { href: `/admin/follow-ups?client=${client.id}`, label: "Follow-ups" },
              { href: `/admin/clients/${client.id}/faq`, label: "FAQ / Knowledge" },
              { href: `/admin/clients/${client.id}/webhooks`, label: "Webhooks" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:border-primary hover:bg-accent"
              >
                {item.label} →
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Recent Conversations</h3>
            <Link href={`/admin/clients/${client.id}/chat-conversations`} className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {stats.recentConversations.length === 0 ? (
            <p className="text-sm text-muted">No chat conversations yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentConversations.map((c: ChatConversation) => (
                <Link
                  key={c.id}
                  href={`/admin/clients/${client.id}/chat-conversations/${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
                >
                  <span className="font-mono text-xs">{c.id.slice(0, 8)}…</span>
                  <div className="flex items-center gap-2">
                    <Badge>{c.status}</Badge>
                    <span className="text-xs text-muted">{formatDate(c.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
