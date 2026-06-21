"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/input";
import type { AssistantSettings } from "@/types";

interface AssistantSettingsFormProps {
  clientId: string;
  clientSlug: string;
  initial: AssistantSettings | null;
}

export function AssistantSettingsForm({ clientId, clientSlug, initial }: AssistantSettingsFormProps) {
  const [form, setForm] = useState({
    is_enabled: initial?.is_enabled ?? true,
    greeting_message: initial?.greeting_message ?? "Bună! Sunt asistentul virtual. Cu ce te pot ajuta?",
    fallback_message: initial?.fallback_message ?? "Nu am această informație. Pot să te pun în legătură cu echipa.",
    handoff_message: initial?.handoff_message ?? "Lasă-ne datele de contact și revenim.",
    tone: initial?.tone ?? "professional",
    lead_capture_prompt: initial?.lead_capture_prompt ?? "Vrei o ofertă? Lasă-ne numele și emailul.",
    lead_form_url: initial?.lead_form_url ?? `/embed/lead-form/${clientSlug}`,
    system_instructions: initial?.system_instructions ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function save() {
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/assistant`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <h3 className="mb-4 font-semibold">Assistant Settings</h3>
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_enabled}
          onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
        />
        Assistant enabled
      </label>
      <div className="space-y-4">
        <FormField label="Greeting message">
          <Textarea rows={2} value={form.greeting_message} onChange={(e) => setForm({ ...form, greeting_message: e.target.value })} />
        </FormField>
        <FormField label="Fallback message (when answer unknown)">
          <Textarea rows={2} value={form.fallback_message} onChange={(e) => setForm({ ...form, fallback_message: e.target.value })} />
        </FormField>
        <FormField label="Handoff message">
          <Textarea rows={2} value={form.handoff_message} onChange={(e) => setForm({ ...form, handoff_message: e.target.value })} />
        </FormField>
        <FormField label="Lead capture prompt">
          <Textarea rows={2} value={form.lead_capture_prompt} onChange={(e) => setForm({ ...form, lead_capture_prompt: e.target.value })} />
        </FormField>
        <FormField label="Tone">
          <Input value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} placeholder="professional, friendly, formal" />
        </FormField>
        <FormField label="Lead form URL">
          <Input value={form.lead_form_url ?? ""} onChange={(e) => setForm({ ...form, lead_form_url: e.target.value })} />
        </FormField>
        <FormField label="Extra system instructions">
          <Textarea rows={3} value={form.system_instructions ?? ""} onChange={(e) => setForm({ ...form, system_instructions: e.target.value })} />
        </FormField>
      </div>
      {success ? <p className="mt-2 text-sm text-green-600">Saved.</p> : null}
      <Button type="button" className="mt-4" disabled={loading} onClick={save}>
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </Card>
  );
}
