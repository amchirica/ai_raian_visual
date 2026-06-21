"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/input";
import type { LeadField, LeadFieldType } from "@/types";

const FIELD_TYPES: LeadFieldType[] = [
  "text", "email", "phone", "date", "select", "multi_select",
  "textarea", "number", "budget_range", "checkbox",
];

interface LeadFieldsManagerProps {
  clientId: string;
  initialFields: LeadField[];
}

export function LeadFieldsManager({ clientId, initialFields }: LeadFieldsManagerProps) {
  const router = useRouter();
  const [fields, setFields] = useState(initialFields);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editField, setEditField] = useState({
    label: "",
    field_type: "text" as LeadFieldType,
    options: "",
    placeholder: "",
    help_text: "",
  });
  const [newField, setNewField] = useState({
    field_key: "",
    label: "",
    field_type: "text" as LeadFieldType,
    is_required: false,
    options: "",
  });

  async function createField() {
    setLoading(true);
    setError(null);
    try {
      const options = newField.options
        ? newField.options.split("\n").map((l) => l.trim()).filter(Boolean)
        : [];

      const res = await fetch(`/api/admin/clients/${clientId}/lead-fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field_key: newField.field_key,
          label: newField.label,
          field_type: newField.field_type,
          is_required: newField.is_required,
          options,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? data.error ?? "Failed");
      setFields((prev) => [...prev, data]);
      setNewField({ field_key: "", label: "", field_type: "text", is_required: false, options: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create field");
    } finally {
      setLoading(false);
    }
  }

  async function toggleField(field: LeadField, key: "is_required" | "is_active") {
    const res = await fetch(`/api/admin/clients/${clientId}/lead-fields/${field.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: !field[key] }),
    });
    const data = await res.json();
    if (res.ok) {
      setFields((prev) => prev.map((f) => (f.id === field.id ? data : f)));
    }
  }

  function startEdit(field: LeadField) {
    const opts = Array.isArray(field.options) ? (field.options as string[]).join("\n") : "";
    const meta = (field.metadata ?? {}) as Record<string, unknown>;
    setEditingId(field.id);
    setEditField({
      label: field.label,
      field_type: field.field_type,
      options: opts,
      placeholder: field.placeholder ?? "",
      help_text: typeof meta.help_text === "string" ? meta.help_text : "",
    });
  }

  async function saveEdit(fieldId: string) {
    setLoading(true);
    setError(null);
    try {
      const options = editField.options
        ? editField.options.split("\n").map((l) => l.trim()).filter(Boolean)
        : [];
      const field = fields.find((f) => f.id === fieldId);
      const meta = { ...((field?.metadata ?? {}) as Record<string, unknown>), help_text: editField.help_text || undefined };
      const res = await fetch(`/api/admin/clients/${clientId}/lead-fields/${fieldId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editField.label,
          field_type: editField.field_type,
          options,
          placeholder: editField.placeholder || null,
          metadata: meta,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setFields((prev) => prev.map((f) => (f.id === fieldId ? data : f)));
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function deleteField(fieldId: string) {
    if (!confirm("Delete this field?")) return;
    await fetch(`/api/admin/clients/${clientId}/lead-fields/${fieldId}`, { method: "DELETE" });
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    router.refresh();
  }

  async function moveField(index: number, direction: -1 | 1) {
    const next = [...fields].sort((a, b) => a.sort_order - b.sort_order);
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const field_ids = next.map((f) => f.id);
    const res = await fetch(`/api/admin/clients/${clientId}/lead-fields`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field_ids }),
    });
    const data = await res.json();
    if (res.ok) setFields(data.fields);
  }

  const sorted = [...fields].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 font-semibold">Form Fields ({sorted.length})</h3>
        <div className="space-y-3">
          {sorted.map((field, index) => (
            <div key={field.id} className="rounded-lg border border-border px-4 py-3">
              {editingId === field.id ? (
                <div className="space-y-3">
                  <FormField label="Label"><Input value={editField.label} onChange={(e) => setEditField({ ...editField, label: e.target.value })} /></FormField>
                  <FormField label="Type">
                    <select value={editField.field_type} onChange={(e) => setEditField({ ...editField, field_type: e.target.value as LeadFieldType })} className="w-full rounded-lg border border-border px-3 py-2 text-sm">
                      {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Placeholder"><Input value={editField.placeholder} onChange={(e) => setEditField({ ...editField, placeholder: e.target.value })} /></FormField>
                  <FormField label="Help text"><Input value={editField.help_text} onChange={(e) => setEditField({ ...editField, help_text: e.target.value })} /></FormField>
                  {["select", "multi_select", "budget_range"].includes(editField.field_type) ? (
                    <FormField label="Options (one per line)">
                      <textarea value={editField.options} onChange={(e) => setEditField({ ...editField, options: e.target.value })} className="w-full rounded-lg border border-border px-3 py-2 text-sm" rows={3} />
                    </FormField>
                  ) : null}
                  <div className="flex gap-2">
                    <Button type="button" size="sm" disabled={loading} onClick={() => saveEdit(field.id)}>Save</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
              <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{field.label}</p>
                <p className="text-xs text-muted">
                  {field.field_key} · {field.field_type}
                  {field.is_required ? " · required" : ""}
                  {!field.is_active ? " · inactive" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(field)}>Edit</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => moveField(index, -1)}>↑</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => moveField(index, 1)}>↓</Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => toggleField(field, "is_required")}>
                  {field.is_required ? "Optional" : "Required"}
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => toggleField(field, "is_active")}>
                  {field.is_active ? "Disable" : "Enable"}
                </Button>
                <Button type="button" variant="danger" size="sm" onClick={() => deleteField(field.id)}>Delete</Button>
              </div>
              </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Add Field</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Field Key" htmlFor="field_key" required>
            <Input
              id="field_key"
              value={newField.field_key}
              onChange={(e) => setNewField({ ...newField, field_key: e.target.value })}
              placeholder="wedding_date"
            />
          </FormField>
          <FormField label="Label" htmlFor="label" required>
            <Input
              id="label"
              value={newField.label}
              onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              placeholder="Wedding Date"
            />
          </FormField>
          <FormField label="Type" htmlFor="field_type">
            <select
              id="field_type"
              value={newField.field_type}
              onChange={(e) => setNewField({ ...newField, field_type: e.target.value as LeadFieldType })}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </FormField>
          <label className="flex items-center gap-2 self-end text-sm">
            <input
              type="checkbox"
              checked={newField.is_required}
              onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })}
            />
            Required
          </label>
        </div>
        {["select", "multi_select", "budget_range"].includes(newField.field_type) ? (
          <FormField label="Options (one per line)" htmlFor="options" hint="e.g. photo, video, photo+video">
            <textarea
              id="options"
              value={newField.options}
              onChange={(e) => setNewField({ ...newField, options: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              rows={4}
            />
          </FormField>
        ) : null}
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
        <Button type="button" className="mt-4" disabled={loading} onClick={createField}>
          {loading ? "Adding..." : "Add Field"}
        </Button>
      </Card>
    </div>
  );
}
