"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/input";
import type { BusinessProfile, Client } from "@/types";

interface ClientConfigFormProps {
  client: Client;
  profile: BusinessProfile | null;
}

export function ClientConfigForm({ client, profile }: ClientConfigFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);

    const payload = {
      client: {
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        domain: String(formData.get("domain") ?? "") || null,
        is_active: formData.get("is_active") === "on",
      },
      profile: {
        company_name: String(formData.get("company_name") ?? ""),
        tagline: String(formData.get("tagline") ?? "") || null,
        description: String(formData.get("description") ?? "") || null,
        contact_email: String(formData.get("contact_email") ?? "") || null,
        contact_phone: String(formData.get("contact_phone") ?? "") || null,
        website: String(formData.get("website") ?? "") || null,
        primary_color: String(formData.get("primary_color") ?? "#2563eb"),
        secondary_color: String(formData.get("secondary_color") ?? "#1e40af"),
      },
    };

    try {
      const response = await fetch(`/api/admin/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to update client");

      setSuccess(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="mb-4 text-lg font-semibold">Client Configuration</h3>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Client Name" htmlFor="name" required>
            <Input id="name" name="name" defaultValue={client.name} required />
          </FormField>
          <FormField label="Slug" htmlFor="slug" required>
            <Input id="slug" name="slug" defaultValue={client.slug} required />
          </FormField>
        </div>

        <FormField label="Domain" htmlFor="domain">
          <Input id="domain" name="domain" defaultValue={client.domain ?? ""} />
        </FormField>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={client.is_active}
            className="rounded"
          />
          Active client
        </label>

        <hr className="border-border" />

        <h4 className="font-medium">Business Profile</h4>

        <FormField label="Company Name" htmlFor="company_name" required>
          <Input
            id="company_name"
            name="company_name"
            defaultValue={profile?.company_name ?? client.name}
            required
          />
        </FormField>

        <FormField label="Tagline" htmlFor="tagline">
          <Input id="tagline" name="tagline" defaultValue={profile?.tagline ?? ""} />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={profile?.description ?? ""}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Contact Email" htmlFor="contact_email">
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              defaultValue={profile?.contact_email ?? ""}
            />
          </FormField>
          <FormField label="Contact Phone" htmlFor="contact_phone">
            <Input
              id="contact_phone"
              name="contact_phone"
              defaultValue={profile?.contact_phone ?? ""}
            />
          </FormField>
        </div>

        <FormField label="Website" htmlFor="website">
          <Input id="website" name="website" defaultValue={profile?.website ?? ""} />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Primary Color" htmlFor="primary_color">
            <Input
              id="primary_color"
              name="primary_color"
              type="color"
              defaultValue={profile?.primary_color ?? "#2563eb"}
            />
          </FormField>
          <FormField label="Secondary Color" htmlFor="secondary_color">
            <Input
              id="secondary_color"
              name="secondary_color"
              type="color"
              defaultValue={profile?.secondary_color ?? "#1e40af"}
            />
          </FormField>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {success ? <p className="text-sm text-success">Configuration saved.</p> : null}

        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Configuration"}
        </Button>
      </form>
    </Card>
  );
}
