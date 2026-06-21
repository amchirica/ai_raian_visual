import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ClientOverviewPanel } from "@/components/admin/client-overview-panel";
import { ClientActivityLog } from "@/components/admin/client-activity-log";
import { ClientConfigForm } from "@/components/admin/client-config-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clientService } from "@/lib/services/client-service";
import { platformService } from "@/lib/services/platform-service";
import { WIDGET_TYPES } from "@/lib/constants";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientOverviewPage({ params }: PageProps) {
  const { id } = await params;
  const client = await clientService.getClientById(id).catch(() => null);
  if (!client) notFound();

  const [profile, stats, activities] = await Promise.all([
    clientService.getBusinessProfile(id),
    platformService.getClientOverviewStats(id),
    clientService.listRecentActivity(id, 12),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <>
      <AdminHeader
        title={client.name}
        description={`/${client.slug} · ${client.id}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={client.is_active ? "success" : "warning"}>
              {client.is_active ? "Active" : "Inactive"}
            </Badge>
            <Link href={`/admin/clients/${id}/leads`}>
              <Button variant="secondary">Leads</Button>
            </Link>
          </div>
        }
      />

      <ClientOverviewPanel client={client} stats={stats} />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <h3 className="mb-4 font-semibold">Business Configuration</h3>
            <ClientConfigForm client={client} profile={profile} />
          </Card>
        </div>

        <div className="space-y-6">
          <ClientActivityLog activities={activities} />
          <Card>
            <h3 className="mb-3 font-semibold">Embed Widgets</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`${baseUrl}/embed/lead-form/${client.slug}`} target="_blank" className="text-primary hover:underline">
                  Lead form iframe
                </Link>
              </li>
              <li>
                <Link href={`${baseUrl}/embed/chat/${client.slug}`} target="_blank" className="text-primary hover:underline">
                  Chat assistant iframe
                </Link>
              </li>
              {WIDGET_TYPES.map((type) => (
                <li key={type}>
                  <Link href={`${baseUrl}/embed/${client.slug}/${type}`} target="_blank" className="text-primary hover:underline">
                    /embed/{client.slug}/{type}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold">Quick Embed Code</h3>
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{`<!-- Lead form -->
<script src="${baseUrl}/widget/lead-form.js" data-client="${client.slug}" async></script>

<!-- Chat assistant -->
<script src="${baseUrl}/widget/chat.js" data-client="${client.slug}" async></script>`}</pre>
          </Card>
        </div>
      </div>
    </>
  );
}
