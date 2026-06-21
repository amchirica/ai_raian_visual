import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { FollowupsListTable } from "@/components/admin/followups-list-table";
import { platformService } from "@/lib/services/platform-service";

interface PageProps {
  searchParams: Promise<{ client?: string }>;
}

export default async function FollowUpsIndexPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const items = await platformService.listAllFollowups(100, params.client);

  return (
    <>
      <AdminHeader
        title="Follow-ups"
        description="Edit, delete, approve, or mark follow-ups as sent. Copy text and send manually from your email or WhatsApp."
      />
      <FollowupsListTable initialItems={items as Parameters<typeof FollowupsListTable>[0]["initialItems"]} />
      {params.client ? (
        <p className="mt-4 text-sm text-muted">
          Filtered by client.{" "}
          <Link href="/admin/follow-ups" className="text-primary hover:underline">Show all</Link>
        </p>
      ) : null}
    </>
  );
}
