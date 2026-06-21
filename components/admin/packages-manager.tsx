"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField, Input, Textarea } from "@/components/ui/input";
import type { Package, PackageExtra, PackageFeature, PricingRule } from "@/types";

interface PackagesManagerProps {
  clientId: string;
  initialPackages: Package[];
  initialExtras: PackageExtra[];
  initialRules: PricingRule[];
  initialFeatures: PackageFeature[];
}

export function PackagesManager({
  clientId,
  initialPackages,
  initialExtras,
  initialRules,
  initialFeatures,
}: PackagesManagerProps) {
  const router = useRouter();
  const [packages, setPackages] = useState(initialPackages);
  const [extras, setExtras] = useState(initialExtras);
  const [rules, setRules] = useState(initialRules);
  const [features, setFeatures] = useState(initialFeatures);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(
    initialPackages[0]?.id ?? null,
  );
  const [newPkg, setNewPkg] = useState({ name: "", slug: "", price: "", currency: "EUR", description: "" });
  const [newExtra, setNewExtra] = useState({ name: "", slug: "", price: "", currency: "EUR" });
  const [newFeature, setNewFeature] = useState({ name: "", description: "" });
  const [newRule, setNewRule] = useState({
    name: "",
    package_slug: "essential",
    field: "budget_range",
    operator: "budget_min",
    value: "1700",
  });
  const [pkgEdit, setPkgEdit] = useState({
    name: "",
    slug: "",
    price: "",
    currency: "EUR",
    description: "",
    is_active: true,
  });
  const [extraEdit, setExtraEdit] = useState({
    name: "",
    slug: "",
    price: "",
    currency: "EUR",
    is_active: true,
  });

  const apiBase = `/api/admin/clients/${clientId}/packages`;

  async function apiCall(method: string, body?: unknown, query?: string) {
    const res = await fetch(query ? `${apiBase}?${query}` : apiBase, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? data.error ?? "Request failed");
    return data;
  }

  async function createPackage() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall("POST", {
        name: newPkg.name,
        slug: newPkg.slug,
        price: Number(newPkg.price),
        currency: newPkg.currency,
        description: newPkg.description || undefined,
      });
      setPackages((p) => [...p, data]);
      setNewPkg({ name: "", slug: "", price: "", currency: "EUR", description: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  function startEditPkg(pkg: Package) {
    setEditingPkgId(pkg.id);
    setPkgEdit({
      name: pkg.name,
      slug: pkg.slug,
      price: String(pkg.price ?? ""),
      currency: pkg.currency,
      description: pkg.description ?? "",
      is_active: pkg.is_active,
    });
  }

  async function savePkg(pkgId: string) {
    setLoading(true);
    try {
      const data = await apiCall("PATCH", {
        type: "package",
        id: pkgId,
        name: pkgEdit.name,
        slug: pkgEdit.slug,
        price: pkgEdit.price ? Number(pkgEdit.price) : null,
        currency: pkgEdit.currency,
        description: pkgEdit.description || null,
        is_active: pkgEdit.is_active,
      });
      setPackages((p) => p.map((x) => (x.id === pkgId ? data : x)));
      setEditingPkgId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function togglePkg(pkg: Package) {
    const data = await apiCall("PATCH", { type: "package", id: pkg.id, is_active: !pkg.is_active });
    setPackages((p) => p.map((x) => (x.id === pkg.id ? data : x)));
  }

  async function deletePkg(pkgId: string) {
    if (!confirm("Delete this package and its features?")) return;
    await apiCall("DELETE", undefined, `type=package&id=${pkgId}`);
    setPackages((p) => p.filter((x) => x.id !== pkgId));
    setFeatures((f) => f.filter((x) => x.package_id !== pkgId));
    if (selectedPkgId === pkgId) setSelectedPkgId(null);
    router.refresh();
  }

  async function duplicatePkg(pkgId: string) {
    setLoading(true);
    try {
      const data = await apiCall("POST", { type: "duplicate_package", package_id: pkgId });
      setPackages((p) => [...p, data]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function createExtra() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall("POST", {
        type: "extra",
        name: newExtra.name,
        slug: newExtra.slug,
        price: Number(newExtra.price),
        currency: newExtra.currency,
      });
      setExtras((e) => [...e, data]);
      setNewExtra({ name: "", slug: "", price: "", currency: "EUR" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  function startEditExtra(extra: PackageExtra) {
    setEditingExtraId(extra.id);
    setExtraEdit({
      name: extra.name,
      slug: extra.slug,
      price: String(extra.price),
      currency: extra.currency,
      is_active: extra.is_active,
    });
  }

  async function saveExtra(extraId: string) {
    setLoading(true);
    try {
      const data = await apiCall("PATCH", {
        type: "extra",
        id: extraId,
        ...extraEdit,
        price: Number(extraEdit.price),
      });
      setExtras((e) => e.map((x) => (x.id === extraId ? data : x)));
      setEditingExtraId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function deleteExtra(extraId: string) {
    if (!confirm("Delete this extra?")) return;
    await apiCall("DELETE", undefined, `type=extra&id=${extraId}`);
    setExtras((e) => e.filter((x) => x.id !== extraId));
    router.refresh();
  }

  async function createFeature() {
    if (!selectedPkgId) return;
    setLoading(true);
    try {
      const data = await apiCall("POST", {
        type: "feature",
        package_id: selectedPkgId,
        name: newFeature.name,
        description: newFeature.description || undefined,
        sort_order: pkgFeatures.length,
      });
      setFeatures((f) => [...f, data]);
      setNewFeature({ name: "", description: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function deleteFeature(featureId: string) {
    if (!confirm("Delete this feature?")) return;
    await apiCall("DELETE", undefined, `type=feature&id=${featureId}`);
    setFeatures((f) => f.filter((x) => x.id !== featureId));
    router.refresh();
  }

  async function moveFeature(index: number, direction: -1 | 1) {
    const sorted = [...pkgFeatures].sort((a, b) => a.sort_order - b.sort_order);
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
    await apiCall("PATCH", { type: "reorder_features", feature_ids: sorted.map((f) => f.id) });
    setFeatures((all) => {
      const updated = sorted.map((f, i) => ({ ...f, sort_order: i }));
      return all.map((f) => updated.find((u) => u.id === f.id) ?? f);
    });
  }

  async function createRule() {
    setLoading(true);
    try {
      const conditionValue =
        newRule.operator === "budget_min" || newRule.operator === "budget_max"
          ? Number(newRule.value)
          : newRule.value;
      const data = await apiCall("POST", {
        type: "pricing_rule",
        name: newRule.name,
        priority: 50,
        conditions: [{ field: newRule.field, operator: newRule.operator, value: conditionValue }],
        action: { package_slug: newRule.package_slug, reason: newRule.name },
      });
      setRules((r) => [...r, data]);
      setNewRule({ name: "", package_slug: "essential", field: "budget_range", operator: "budget_min", value: "1700" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function toggleRule(rule: PricingRule) {
    const data = await apiCall("PATCH", { type: "pricing_rule", id: rule.id, is_active: !rule.is_active });
    setRules((r) => r.map((x) => (x.id === rule.id ? data : x)));
  }

  async function deleteRule(ruleId: string) {
    if (!confirm("Delete this pricing rule?")) return;
    await apiCall("DELETE", undefined, `type=pricing_rule&id=${ruleId}`);
    setRules((r) => r.filter((x) => x.id !== ruleId));
    router.refresh();
  }

  const pkgFeatures = selectedPkgId
    ? features.filter((f) => f.package_id === selectedPkgId).sort((a, b) => a.sort_order - b.sort_order)
    : [];

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card>
        <h3 className="mb-4 font-semibold">Packages ({packages.length})</h3>
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="rounded-lg border border-border px-4 py-3">
              {editingPkgId === pkg.id ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Name"><Input value={pkgEdit.name} onChange={(e) => setPkgEdit({ ...pkgEdit, name: e.target.value })} /></FormField>
                  <FormField label="Slug"><Input value={pkgEdit.slug} onChange={(e) => setPkgEdit({ ...pkgEdit, slug: e.target.value })} /></FormField>
                  <FormField label="Price"><Input type="number" value={pkgEdit.price} onChange={(e) => setPkgEdit({ ...pkgEdit, price: e.target.value })} /></FormField>
                  <FormField label="Currency"><Input value={pkgEdit.currency} onChange={(e) => setPkgEdit({ ...pkgEdit, currency: e.target.value })} /></FormField>
                  <div className="sm:col-span-2">
                    <FormField label="Description"><Textarea rows={2} value={pkgEdit.description} onChange={(e) => setPkgEdit({ ...pkgEdit, description: e.target.value })} /></FormField>
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="button" size="sm" disabled={loading} onClick={() => savePkg(pkg.id)}>Save</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setEditingPkgId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{pkg.name}</p>
                    <p className="text-xs text-muted">
                      {pkg.slug} · {pkg.price} {pkg.currency}
                      {!pkg.is_active ? " · inactive" : ""}
                    </p>
                    {pkg.description ? <p className="mt-1 text-sm text-muted">{pkg.description}</p> : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedPkgId(pkg.id)}>Features</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => startEditPkg(pkg)}>Edit</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => togglePkg(pkg)}>
                      {pkg.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => duplicatePkg(pkg.id)}>Duplicate</Button>
                    <Button type="button" variant="danger" size="sm" onClick={() => deletePkg(pkg.id)}>Delete</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Add Package</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name"><Input value={newPkg.name} onChange={(e) => setNewPkg({ ...newPkg, name: e.target.value })} /></FormField>
          <FormField label="Slug"><Input value={newPkg.slug} onChange={(e) => setNewPkg({ ...newPkg, slug: e.target.value })} /></FormField>
          <FormField label="Price"><Input type="number" value={newPkg.price} onChange={(e) => setNewPkg({ ...newPkg, price: e.target.value })} /></FormField>
          <FormField label="Currency"><Input value={newPkg.currency} onChange={(e) => setNewPkg({ ...newPkg, currency: e.target.value })} /></FormField>
          <div className="sm:col-span-2">
            <FormField label="Description"><Textarea rows={2} value={newPkg.description} onChange={(e) => setNewPkg({ ...newPkg, description: e.target.value })} /></FormField>
          </div>
        </div>
        <Button type="button" className="mt-4" disabled={loading || !newPkg.name || !newPkg.slug} onClick={createPackage}>Add Package</Button>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">
          Package Features
          {selectedPkgId ? (
            <span className="ml-2 text-sm font-normal text-muted">
              for {packages.find((p) => p.id === selectedPkgId)?.name}
            </span>
          ) : null}
        </h3>
        {!selectedPkgId ? (
          <p className="text-sm text-muted">Select a package above to manage its features.</p>
        ) : (
          <>
            <div className="mb-4 space-y-2">
              {pkgFeatures.length === 0 ? (
                <p className="text-sm text-muted">No features yet.</p>
              ) : (
                pkgFeatures.map((f, index) => (
                  <div key={f.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2 text-sm">
                    <div>
                      <span className="font-medium">{f.name}</span>
                      {f.description ? <span className="ml-2 text-muted">{f.description}</span> : null}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => moveFeature(index, -1)}>↑</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => moveFeature(index, 1)}>↓</Button>
                      <Button type="button" variant="danger" size="sm" onClick={() => deleteFeature(f.id)}>Delete</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Feature name"><Input value={newFeature.name} onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })} /></FormField>
              <FormField label="Description"><Input value={newFeature.description} onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })} /></FormField>
            </div>
            <Button type="button" className="mt-4" variant="secondary" disabled={loading || !newFeature.name} onClick={createFeature}>Add Feature</Button>
          </>
        )}
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Extras ({extras.length})</h3>
        <div className="mb-4 space-y-2">
          {extras.map((e) => (
            <div key={e.id} className="rounded-lg border border-border px-4 py-2 text-sm">
              {editingExtraId === e.id ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input value={extraEdit.name} onChange={(ev) => setExtraEdit({ ...extraEdit, name: ev.target.value })} />
                  <Input value={extraEdit.slug} onChange={(ev) => setExtraEdit({ ...extraEdit, slug: ev.target.value })} />
                  <Input type="number" value={extraEdit.price} onChange={(ev) => setExtraEdit({ ...extraEdit, price: ev.target.value })} />
                  <Input value={extraEdit.currency} onChange={(ev) => setExtraEdit({ ...extraEdit, currency: ev.target.value })} />
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="button" size="sm" onClick={() => saveExtra(e.id)}>Save</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setEditingExtraId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span>
                    {e.name}
                    {!e.is_active ? <Badge>inactive</Badge> : null}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted">+{e.price} {e.currency}</span>
                    <Button type="button" variant="secondary" size="sm" onClick={() => startEditExtra(e)}>Edit</Button>
                    <Button type="button" variant="danger" size="sm" onClick={() => deleteExtra(e.id)}>Delete</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name"><Input value={newExtra.name} onChange={(ev) => setNewExtra({ ...newExtra, name: ev.target.value })} /></FormField>
          <FormField label="Slug"><Input value={newExtra.slug} onChange={(ev) => setNewExtra({ ...newExtra, slug: ev.target.value })} /></FormField>
          <FormField label="Price"><Input type="number" value={newExtra.price} onChange={(ev) => setNewExtra({ ...newExtra, price: ev.target.value })} /></FormField>
          <FormField label="Currency"><Input value={newExtra.currency} onChange={(ev) => setNewExtra({ ...newExtra, currency: ev.target.value })} /></FormField>
        </div>
        <Button type="button" className="mt-4" variant="secondary" disabled={loading || !newExtra.name || !newExtra.slug} onClick={createExtra}>Add Extra</Button>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Pricing Rules ({rules.length})</h3>
        <p className="mb-3 text-sm text-muted">Deterministic package recommendation — AI never invents prices.</p>
        <div className="mb-4 space-y-2">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2 text-sm">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-muted">Priority: {r.priority}{!r.is_active ? " · inactive" : ""}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => toggleRule(r)}>
                  {r.is_active ? "Disable" : "Enable"}
                </Button>
                <Button type="button" variant="danger" size="sm" onClick={() => deleteRule(r.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Rule name"><Input value={newRule.name} onChange={(ev) => setNewRule({ ...newRule, name: ev.target.value })} /></FormField>
          <FormField label="Recommend package slug"><Input value={newRule.package_slug} onChange={(ev) => setNewRule({ ...newRule, package_slug: ev.target.value })} /></FormField>
          <FormField label="Lead field"><Input value={newRule.field} onChange={(ev) => setNewRule({ ...newRule, field: ev.target.value })} /></FormField>
          <FormField label="Operator">
            <select value={newRule.operator} onChange={(ev) => setNewRule({ ...newRule, operator: ev.target.value })} className="w-full rounded-lg border border-border px-3 py-2 text-sm">
              <option value="budget_min">budget_min</option>
              <option value="budget_max">budget_max</option>
              <option value="contains">contains</option>
              <option value="equals">equals</option>
            </select>
          </FormField>
          <FormField label="Value"><Input value={newRule.value} onChange={(ev) => setNewRule({ ...newRule, value: ev.target.value })} /></FormField>
        </div>
        <Button type="button" className="mt-4" variant="secondary" disabled={loading || !newRule.name} onClick={createRule}>Add Pricing Rule</Button>
      </Card>
    </div>
  );
}
