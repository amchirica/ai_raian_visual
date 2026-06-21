"use client";

import { useEffect, useState } from "react";
import type { LeadField, LeadFieldType } from "@/types";

export interface LeadFormConfigResponse {
  client_id: string;
  client_slug: string;
  company_name: string;
  fields: LeadField[];
  theme: Record<string, string>;
  config: Record<string, string>;
}

interface DynamicLeadFormProps {
  clientSlug: string;
  configEndpoint?: string;
  submitEndpoint?: string;
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  submitLabel?: string;
  successMessage?: string;
}

function normalizeOptions(options: unknown): Array<{ value: string; label: string }> {
  if (!Array.isArray(options)) return [];
  return options.map((opt) => {
    if (typeof opt === "object" && opt !== null && "value" in opt) {
      const o = opt as { value: string; label?: string };
      return { value: String(o.value), label: String(o.label ?? o.value) };
    }
    return { value: String(opt), label: String(opt) };
  });
}

function fieldInputType(fieldType: LeadFieldType): string {
  switch (fieldType) {
    case "email": return "email";
    case "phone": return "tel";
    case "date": return "date";
    case "number": return "number";
    default: return "text";
  }
}

function DynamicField({ field }: { field: LeadField }) {
  const options = normalizeOptions(field.options);
  const baseClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  if (field.field_type === "textarea") {
    return (
      <textarea
        name={field.field_key}
        required={field.is_required}
        placeholder={field.placeholder ?? undefined}
        className={baseClass}
        rows={4}
      />
    );
  }

  if (field.field_type === "select" || field.field_type === "budget_range") {
    return (
      <select name={field.field_key} required={field.is_required} className={baseClass}>
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }

  if (field.field_type === "multi_select") {
    return (
      <select
        name={field.field_key}
        required={field.is_required}
        multiple
        className={`${baseClass} min-h-[100px]`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }

  if (field.field_type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name={field.field_key} className="rounded" />
        {field.placeholder ?? field.label}
      </label>
    );
  }

  return (
    <input
      name={field.field_key}
      type={fieldInputType(field.field_type)}
      required={field.is_required}
      placeholder={field.placeholder ?? undefined}
      className={baseClass}
    />
  );
}

export function DynamicLeadForm({
  clientSlug,
  configEndpoint,
  submitEndpoint,
  title,
  subtitle,
  primaryColor,
  submitLabel,
  successMessage,
}: DynamicLeadFormProps) {
  const [formConfig, setFormConfig] = useState<LeadFormConfigResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score?: number; score_category?: string } | null>(null);

  const endpoint = configEndpoint ?? `/api/clients/${clientSlug}/lead-form-config`;
  const postUrl = submitEndpoint ?? `/api/leads`;

  useEffect(() => {
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => setFormConfig(data))
      .catch(() => setFormConfig(null));
  }, [endpoint]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload: Record<string, string | string[]> = {};

    formData.forEach((value, key) => {
      if (payload[key]) {
        const existing = payload[key];
        payload[key] = Array.isArray(existing) ? [...existing, String(value)] : [existing, String(value)];
      } else {
        payload[key] = String(value);
      }
    });

    // Handle multi-select fields
    for (const field of formConfig?.fields ?? []) {
      if (field.field_type === "multi_select") {
        payload[field.field_key] = formData.getAll(field.field_key).map(String);
      }
      if (field.field_type === "checkbox") {
        payload[field.field_key] = formData.get(field.field_key) ? "yes" : "no";
      }
    }

    try {
      const response = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_slug: clientSlug,
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          company: payload.company,
          message: payload.message,
          form_data: payload,
          source: "embed-lead-form",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? data.error ?? "Submission failed");
      setResult(data.lead ?? null);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  const theme = formConfig?.theme ?? {};
  const config = formConfig?.config ?? {};
  const color = primaryColor ?? theme.primaryColor ?? "#2563eb";
  const displayTitle = title ?? config.title ?? "Request a quote";
  const displaySubtitle = subtitle ?? config.subtitle;
  const displaySubmit = submitLabel ?? config.submitLabel ?? "Submit";
  const displaySuccess = successMessage ?? config.successMessage ?? "Thank you! We will contact you soon.";

  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center text-green-800">
        <p className="font-medium">{displaySuccess}</p>
        {result?.score_category ? (
          <p className="mt-2 text-sm opacity-80">
            Priority: {result.score_category} (score {result.score})
          </p>
        ) : null}
      </div>
    );
  }

  const fields = formConfig?.fields ?? [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold" style={{ color }}>
        {displayTitle}
      </h2>
      {displaySubtitle ? <p className="mt-1 text-sm text-slate-600">{displaySubtitle}</p> : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {fields.length > 0 ? (
          fields.map((field) => (
            <div key={field.id}>
              {field.field_type !== "checkbox" ? (
                <label className="mb-1 block text-sm font-medium">
                  {field.label}
                  {field.is_required ? " *" : ""}
                </label>
              ) : null}
              <DynamicField field={field} />
            </div>
          ))
        ) : (
          <>
            <input name="name" placeholder="Name" className="w-full rounded-lg border px-3 py-2 text-sm" required />
            <input name="email" type="email" placeholder="Email" className="w-full rounded-lg border px-3 py-2 text-sm" required />
            <textarea name="message" placeholder="Message" className="w-full rounded-lg border px-3 py-2 text-sm" rows={4} required />
          </>
        )}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: color }}
        >
          {loading ? "Sending..." : displaySubmit}
        </button>
      </form>
    </div>
  );
}
