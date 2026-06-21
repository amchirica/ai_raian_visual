"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/input";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? "") || undefined,
      domain: String(formData.get("domain") ?? "") || undefined,
      profile: {
        company_name: String(formData.get("company_name") ?? "") || undefined,
        tagline: String(formData.get("tagline") ?? "") || undefined,
        description: String(formData.get("description") ?? "") || undefined,
        contact_email: String(formData.get("contact_email") ?? "") || undefined,
        contact_phone: String(formData.get("contact_phone") ?? "") || undefined,
        website: String(formData.get("website") ?? "") || undefined,
        primary_color: String(formData.get("primary_color") ?? "#2563eb"),
      },
    };

    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to create client");

      router.push(`/admin/clients/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AdminHeader
        title="Create Client"
        description="Add a new tenant. All modules will be scoped to this client_id."
      />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Client Name" htmlFor="name" required>
              <Input id="name" name="name" required placeholder="Acme Studio" />
            </FormField>
            <FormField label="Slug" htmlFor="slug" hint="Auto-generated if empty">
              <Input id="slug" name="slug" placeholder="acme-studio" />
            </FormField>
          </div>

          <FormField label="Domain" htmlFor="domain">
            <Input id="domain" name="domain" placeholder="acmestudio.com" />
          </FormField>

          <hr className="border-border" />

          <h3 className="font-medium">Business Profile</h3>

          <FormField label="Company Name" htmlFor="company_name">
            <Input id="company_name" name="company_name" placeholder="Same as client name" />
          </FormField>

          <FormField label="Tagline" htmlFor="tagline">
            <Input id="tagline" name="tagline" />
          </FormField>

          <FormField label="Description" htmlFor="description">
            <Textarea id="description" name="description" rows={3} />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Contact Email" htmlFor="contact_email">
              <Input id="contact_email" name="contact_email" type="email" />
            </FormField>
            <FormField label="Contact Phone" htmlFor="contact_phone">
              <Input id="contact_phone" name="contact_phone" />
            </FormField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Website" htmlFor="website">
              <Input id="website" name="website" placeholder="https://" />
            </FormField>
            <FormField label="Primary Color" htmlFor="primary_color">
              <Input id="primary_color" name="primary_color" type="color" defaultValue="#2563eb" />
            </FormField>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Client"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
