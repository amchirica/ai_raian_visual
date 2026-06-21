import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { PackagesManager } from "@/components/admin/packages-manager";
import { Button } from "@/components/ui/button";
import { clientService } from "@/lib/services/client-service";
import { packageService } from "@/lib/services/package-service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientPackagesPage({ params }: PageProps) {
  const { id } = await params;
  const client = await clientService.getClientById(id).catch(() => null);
  if (!client) notFound();

  const [packages, extras, rules, features] = await Promise.all([
    packageService.listPackages(id),
    packageService.listExtras(id, { activeOnly: false }),
    packageService.listPricingRules(id),
    packageService.listAllFeatures(id),
  ]);

  return (
    <>
      <AdminHeader
        title={`Packages — ${client.name}`}
        description="Manage packages, extras, and pricing recommendation rules."
        actions={
          <div className="flex gap-2">
            <Link href={`/admin/clients/${id}/offer-template`}>
              <Button variant="secondary">Offer Template</Button>
            </Link>
            <Link href={`/admin/clients/${id}`}>
              <Button variant="secondary">Back</Button>
            </Link>
          </div>
        }
      />
      <PackagesManager
        clientId={id}
        initialPackages={packages}
        initialExtras={extras}
        initialRules={rules}
        initialFeatures={features}
      />
    </>
  );
}
