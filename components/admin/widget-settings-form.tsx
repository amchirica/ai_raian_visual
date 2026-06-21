"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/input";
import type { Client, WidgetSettings } from "@/types";

interface WidgetSettingsFormProps {
  client: Client;
  widgets: WidgetSettings[];
  baseUrl: string;
}

const WIDGET_TYPES = [
  { type: "lead-form", label: "Lead Form" },
  { type: "chat", label: "Chat Assistant" },
] as const;

export function WidgetSettingsForm({ client, widgets, baseUrl }: WidgetSettingsFormProps) {
  const byType = Object.fromEntries(widgets.map((w) => [w.widget_type, w]));
  const [activeType, setActiveType] = useState<(typeof WIDGET_TYPES)[number]["type"]>("lead-form");
  const current = byType[activeType];
  const [form, setForm] = useState({
    title: current?.title ?? "",
    subtitle: current?.subtitle ?? "",
    primaryColor: (current?.theme as Record<string, string>)?.primaryColor ?? "#7c3aed",
    submitLabel: (current?.config as Record<string, string>)?.submitLabel ?? "Trimite solicitarea",
    successMessage: (current?.config as Record<string, string>)?.successMessage ?? "Mulțumim! Te contactăm curând.",
    is_active: current?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectType(type: (typeof WIDGET_TYPES)[number]["type"]) {
    setActiveType(type);
    const w = byType[type];
    setForm({
      title: w?.title ?? "",
      subtitle: w?.subtitle ?? "",
      primaryColor: (w?.theme as Record<string, string>)?.primaryColor ?? "#7c3aed",
      submitLabel: (w?.config as Record<string, string>)?.submitLabel ?? "Trimite solicitarea",
      successMessage: (w?.config as Record<string, string>)?.successMessage ?? "Mulțumim! Te contactăm curând.",
      is_active: w?.is_active ?? true,
    });
    setSuccess(false);
  }

  async function save() {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/widget-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widget_type: activeType,
          title: form.title,
          subtitle: form.subtitle,
          is_active: form.is_active,
          theme: { primaryColor: form.primaryColor },
          config:
            activeType === "lead-form"
              ? { submitLabel: form.submitLabel, successMessage: form.successMessage }
              : {},
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  const embedUrl =
    activeType === "lead-form"
      ? `${baseUrl}/embed/lead-form/${client.slug}`
      : `${baseUrl}/embed/chat/${client.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {WIDGET_TYPES.map((w) => (
          <Button
            key={w.type}
            type="button"
            variant={activeType === w.type ? "primary" : "secondary"}
            size="sm"
            onClick={() => selectType(w.type)}
          >
            {w.label}
          </Button>
        ))}
      </div>

      <Card className="max-w-2xl">
        <h3 className="mb-4 font-semibold">{WIDGET_TYPES.find((w) => w.type === activeType)?.label} Settings</h3>
        <label className="mb-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Widget enabled
        </label>
        <div className="space-y-4">
          <FormField label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </FormField>
          <FormField label="Subtitle">
            <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </FormField>
          <FormField label="Primary color">
            <Input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="h-10 w-20" />
          </FormField>
          {activeType === "lead-form" ? (
            <>
              <FormField label="Submit button label">
                <Input value={form.submitLabel} onChange={(e) => setForm({ ...form, submitLabel: e.target.value })} />
              </FormField>
              <FormField label="Success message">
                <Textarea rows={2} value={form.successMessage} onChange={(e) => setForm({ ...form, successMessage: e.target.value })} />
              </FormField>
            </>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mt-2 text-sm text-green-600">Widget settings saved.</p> : null}
        <Button type="button" className="mt-4" disabled={loading} onClick={save}>
          {loading ? "Saving..." : "Save Widget Settings"}
        </Button>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold">Preview & Embed</h3>
        <p className="mb-2 text-sm text-muted">
          <a href={embedUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            Open iframe preview
          </a>
        </p>
        <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{`<script src="${baseUrl}/widget/${activeType === "lead-form" ? "lead-form.js" : "chat.js"}" data-client="${client.slug}" async></script>`}</pre>
      </Card>
    </div>
  );
}
