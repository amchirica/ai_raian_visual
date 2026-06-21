"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Textarea } from "@/components/ui/input";
import type { ContentTemplate } from "@/types";

interface OfferTemplateFormProps {
  clientId: string;
  template: ContentTemplate | null;
}

export function OfferTemplateForm({ clientId, template }: OfferTemplateFormProps) {
  const [subject, setSubject] = useState(template?.subject ?? "Ofertă {{package_name}} — {{company_name}}");
  const [body, setBody] = useState(
    template?.body ??
      "Bună {{lead_name}},\n\nPachet: {{package_name}} — {{package_price}} {{currency}}\n\n{{next_steps}}",
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function save() {
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/offer-template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <h3 className="mb-4 font-semibold">Offer Email Template</h3>
      <p className="mb-4 text-sm text-muted">
        Variables: {"{{lead_name}}"}, {"{{company_name}}"}, {"{{package_name}}"}, {"{{package_price}}"}, {"{{currency}}"}, {"{{next_steps}}"}, {"{{valid_until}}"}
      </p>
      <FormField label="Subject" htmlFor="subject">
        <input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
      </FormField>
      <FormField label="Email Body" htmlFor="body">
        <Textarea id="body" rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
      </FormField>
      {success ? <p className="mt-2 text-sm text-success">Template saved.</p> : null}
      <Button type="button" className="mt-4" disabled={loading} onClick={save}>
        {loading ? "Saving..." : "Save Template"}
      </Button>
    </Card>
  );
}
