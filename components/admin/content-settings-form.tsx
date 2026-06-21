"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/input";
import { INDUSTRIES } from "@/lib/constants";
import type { ContentSettings } from "@/types";

interface ContentSettingsFormProps {
  clientId: string;
  initial: ContentSettings | null;
}

export function ContentSettingsForm({ clientId, initial }: ContentSettingsFormProps) {
  const forbidden = Array.isArray(initial?.forbidden_claims)
    ? (initial!.forbidden_claims as string[]).join("\n")
    : "";

  const [form, setForm] = useState({
    industry: initial?.industry ?? "general",
    tone_of_voice: initial?.tone_of_voice ?? "professional",
    target_audience: initial?.target_audience ?? "",
    brand_positioning: initial?.brand_positioning ?? "",
    forbidden_claims: forbidden,
    preferred_cta: initial?.preferred_cta ?? "",
    default_locale: initial?.default_locale ?? "ro",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function save() {
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/content-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          forbidden_claims: form.forbidden_claims
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <h3 className="mb-4 font-semibold">Content Settings</h3>
      <div className="space-y-4">
        <FormField label="Industry">
          <select
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i.replace(/_/g, " ")}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Tone of voice">
          <Input value={form.tone_of_voice} onChange={(e) => setForm({ ...form, tone_of_voice: e.target.value })} placeholder="premium, warm, confident" />
        </FormField>
        <FormField label="Target audience">
          <Textarea rows={2} value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} />
        </FormField>
        <FormField label="Brand positioning">
          <Textarea rows={2} value={form.brand_positioning} onChange={(e) => setForm({ ...form, brand_positioning: e.target.value })} />
        </FormField>
        <FormField label="Preferred CTA">
          <Input value={form.preferred_cta} onChange={(e) => setForm({ ...form, preferred_cta: e.target.value })} />
        </FormField>
        <FormField label="Forbidden claims (one per line)">
          <Textarea rows={4} value={form.forbidden_claims} onChange={(e) => setForm({ ...form, forbidden_claims: e.target.value })} />
        </FormField>
        <FormField label="Default locale">
          <Input value={form.default_locale} onChange={(e) => setForm({ ...form, default_locale: e.target.value })} />
        </FormField>
      </div>
      {success ? <p className="mt-2 text-sm text-green-600">Saved.</p> : null}
      <Button type="button" className="mt-4" disabled={loading} onClick={save}>
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </Card>
  );
}
