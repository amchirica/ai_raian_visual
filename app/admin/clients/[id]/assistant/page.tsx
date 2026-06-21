import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { AssistantSettingsForm } from "@/components/admin/assistant-settings-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clientService } from "@/lib/services/client-service";
import { assistantService } from "@/lib/services/assistant-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssistantConfigPage({ params }: PageProps) {
  const { id } = await params;
  const client = await clientService.getClientById(id).catch(() => null);
  if (!client) notFound();

  const settings = await assistantService.getSettings(id);

  return (
    <>
      <AdminHeader
        title={`AI Assistant — ${client.name}`}
        description="Configure the embeddable virtual assistant."
        actions={
          <div className="flex gap-2">
            <Link href={`/embed/chat/${client.slug}`} target="_blank">
              <Button variant="secondary">Preview</Button>
            </Link>
            <Link href={`/admin/clients/${id}/faq`}>
              <Button variant="secondary">FAQ</Button>
            </Link>
            <Link href={`/admin/clients/${id}/chat-conversations`}>
              <Button variant="secondary">Conversations</Button>
            </Link>
          </div>
        }
      />
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <AssistantSettingsForm clientId={id} clientSlug={client.slug} initial={settings} />
        <Card>
          <h3 className="mb-3 font-semibold">Embed Code</h3>
          <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{`<!-- Iframe -->
<iframe src="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/embed/chat/${client.slug}" width="400" height="560" frameborder="0" style="border:0;border-radius:16px;"></iframe>

<!-- Floating script widget -->
<script src="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/widget/chat.js?client=${client.slug}" async></script>`}</pre>
        </Card>
      </div>
    </>
  );
}
