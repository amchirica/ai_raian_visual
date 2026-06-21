"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Lead, Package, PackageExtra } from "@/types";
import { recommendPackage } from "@/lib/offers/recommendation";
import type { PricingRule } from "@/types";

interface GenerateOfferFormProps {
  clientId: string;
  lead: Lead;
  packages: Package[];
  extras: PackageExtra[];
  pricingRules: PricingRule[];
}

export function GenerateOfferForm({
  clientId,
  lead,
  packages,
  extras,
  pricingRules,
}: GenerateOfferFormProps) {
  const router = useRouter();
  const recommendation = recommendPackage(lead, packages, pricingRules);
  const [packageId, setPackageId] = useState(recommendation?.package.id ?? packages[0]?.id ?? "");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [useAi, setUseAi] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleExtra(id: string) {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/offers/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          lead_id: lead.id,
          package_id: packageId || undefined,
          extra_ids: selectedExtras,
          use_ai_copy: useAi,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      router.push(`/admin/offers/${data.offer.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const selectedPkg = packages.find((p) => p.id === packageId);
  const extrasTotal = selectedExtras.reduce((sum, id) => {
    const e = extras.find((x) => x.id === id);
    return sum + (e ? Number(e.price) : 0);
  }, 0);
  const total = (selectedPkg?.price ?? 0) + extrasTotal;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h3 className="mb-4 font-semibold">Lead Summary</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Name</dt><dd>{lead.name}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Email</dt><dd>{lead.email}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Score</dt><dd><Badge>{lead.score_category} ({lead.score})</Badge></dd></div>
        </dl>

        {recommendation ? (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <strong>Recommended:</strong> {recommendation.package.name} — {recommendation.reason}
          </div>
        ) : null}

        <h3 className="mb-3 mt-6 font-semibold">Select Package</h3>
        <div className="space-y-2">
          {packages.filter((p) => p.is_active).map((pkg) => (
            <label key={pkg.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-accent">
              <input type="radio" name="package" value={pkg.id} checked={packageId === pkg.id} onChange={() => setPackageId(pkg.id)} />
              <div className="flex-1">
                <p className="font-medium">{pkg.name}</p>
                <p className="text-xs text-muted">{pkg.price} {pkg.currency}</p>
              </div>
            </label>
          ))}
        </div>

        <h3 className="mb-3 mt-6 font-semibold">Optional Extras</h3>
        <div className="space-y-2">
          {extras.map((e) => (
            <label key={e.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-2 text-sm">
              <input type="checkbox" checked={selectedExtras.includes(e.id)} onChange={() => toggleExtra(e.id)} />
              <span className="flex-1">{e.name}</span>
              <span className="text-muted">+{e.price} {e.currency}</span>
            </label>
          ))}
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} />
          Enhance wording with AI (prices stay deterministic)
        </label>

        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}

        <Button type="button" className="mt-4 w-full" disabled={loading || !packageId} onClick={generate}>
          {loading ? "Generating..." : "Generate Offer"}
        </Button>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Preview Totals</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt>Package</dt><dd>{selectedPkg?.price ?? 0} {selectedPkg?.currency}</dd></div>
          <div className="flex justify-between"><dt>Extras</dt><dd>{extrasTotal}</dd></div>
          <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
            <dt>Total</dt><dd>{total} {selectedPkg?.currency}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
