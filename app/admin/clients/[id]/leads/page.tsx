import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { LeadsTable } from "@/components/admin/leads-table";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";
import { leadService } from "@/lib/services/lead-service";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string; status?: string }>;
}

export default async function ClientLeadsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const filters = await searchParams;
  const client = await clientService.getClientById(id).catch(() => null);
  if (!client) notFound();

  const leads = await leadService.listLeads(id, {
    category: filters.category,
    status: filters.status,
  });

  return (
    <>
      <AdminHeader
        title={`Leads — ${client.name}`}
        description={`${leads.length} leads captured via embed and API.`}
        actions={
          <div className="flex gap-2">
            <Link href={`/admin/clients/${id}/lead-fields`}>
              <Button variant="secondary">Form Fields</Button>
            </Link>
            <Link href={`/embed/lead-form/${client.slug}`} target="_blank">
              <Button variant="secondary">Preview Form</Button>
            </Link>
          </div>
        }
      />
      <Suspense fallback={<p className="text-sm text-muted">Loading...</p>}>
        <LeadsTable clientId={id} leads={leads} />
      </Suspense>
    </>
  );
}
