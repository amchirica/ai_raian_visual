"use client";

import { useEffect, useState } from "react";
import type { LeadField } from "@/types";

interface LeadFormWidgetProps {
  clientSlug: string;
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  submitLabel?: string;
  successMessage?: string;
}

export function LeadFormWidget({
  clientSlug,
  title = "Contact us",
  subtitle,
  primaryColor = "#2563eb",
  submitLabel = "Submit",
  successMessage = "Thank you! We will contact you soon.",
}: LeadFormWidgetProps) {
  const [fields, setFields] = useState<LeadField[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/clients/${clientSlug}/leads`)
      .then((res) => res.json())
      .then((data) => setFields(data.fields ?? []))
      .catch(() => setFields([]));
  }, [clientSlug]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload: Record<string, string> = {};
    formData.forEach((value, key) => {
      payload[key] = String(value);
    });

    try {
      const response = await fetch(`/api/clients/${clientSlug}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      if (!response.ok) throw new Error(data.error ?? "Submission failed");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center text-green-800">
        {successMessage}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold" style={{ color: primaryColor }}>
        {title}
      </h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {fields.length > 0
          ? fields.map((field) => (
              <div key={field.id}>
                <label className="mb-1 block text-sm font-medium">
                  {field.label}
                  {field.is_required ? " *" : ""}
                </label>
                {field.field_type === "textarea" ? (
                  <textarea
                    name={field.field_key}
                    required={field.is_required}
                    placeholder={field.placeholder ?? undefined}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    rows={4}
                  />
                ) : field.field_type === "select" ? (
                  <select
                    name={field.field_key}
                    required={field.is_required}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select...</option>
                    {(Array.isArray(field.options) ? field.options : []).map((opt) => (
                      <option key={String(opt)} value={String(opt)}>
                        {String(opt)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={field.field_key}
                    type={field.field_type === "email" ? "email" : "text"}
                    required={field.is_required}
                    placeholder={field.placeholder ?? undefined}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                )}
              </div>
            ))
          : (
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
          style={{ backgroundColor: primaryColor }}
        >
          {loading ? "Sending..." : submitLabel}
        </button>
      </form>
    </div>
  );
}
