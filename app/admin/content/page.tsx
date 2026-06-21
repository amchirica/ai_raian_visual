import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ContentHubPage() {
  return (
    <>
      <AdminHeader
        title="Content"
        description="Generate marketing copy and manage saved drafts per client."
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="mb-2 font-semibold">Content Generator</h3>
          <p className="mb-4 text-sm text-muted">
            Generate follow-up emails, social posts, Meta Ads text, SEO outlines, and more using client-specific settings.
          </p>
          <Link href="/admin/content-generator">
            <Button>Open Generator</Button>
          </Link>
        </Card>
        <Card>
          <h3 className="mb-2 font-semibold">Generated Content</h3>
          <p className="mb-4 text-sm text-muted">
            Review, edit, approve, and archive all saved content drafts across clients.
          </p>
          <Link href="/admin/generated-content">
            <Button variant="secondary">View Library</Button>
          </Link>
        </Card>
      </div>
    </>
  );
}
