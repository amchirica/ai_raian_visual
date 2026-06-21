import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { ClientsListTable } from "@/components/admin/clients-list-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";

export default async function ClientsListPage() {
  let clients: Awaited<ReturnType<typeof clientService.listClients>> = [];
  let error: string | null = null;

  try {
    clients = await clientService.listClients();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load clients";
  }

  return (
    <>
      <AdminHeader
        title="Clients"
        description="Each client is a separate tenant with its own configuration and embeddable modules."
        actions={
          <Link href="/admin/clients/new">
            <Button>New Client</Button>
          </Link>
        }
      />

      {error ? (
        <Card className="border-amber-200 bg-amber-50 text-amber-900">{error}</Card>
      ) : clients.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No clients found. Create one or run the seed SQL.</p>
        </Card>
      ) : (
        <ClientsListTable initialClients={clients} />
      )}
    </>
  );
}
