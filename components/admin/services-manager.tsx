"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, Input, Textarea } from "@/components/ui/input";
import type { Service } from "@/types";

interface ServicesManagerProps {
  clientId: string;
  initialServices: Service[];
}

export function ServicesManager({ clientId, initialServices }: ServicesManagerProps) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editService, setEditService] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    base_price: "",
    currency: "EUR",
  });
  const [newService, setNewService] = useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    base_price: "",
    currency: "EUR",
  });

  async function createService() {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newService.name,
          slug: newService.slug,
          description: newService.description || undefined,
          category: newService.category || undefined,
          base_price: newService.base_price ? Number(newService.base_price) : undefined,
          currency: newService.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? data.error ?? "Failed");
      setServices((prev) => [...prev, data]);
      setNewService({ name: "", slug: "", description: "", category: "", base_price: "", currency: "EUR" });
      setSuccess(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create service");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(service: Service) {
    const res = await fetch(`/api/admin/clients/${clientId}/services`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: service.id, is_active: !service.is_active }),
    });
    const data = await res.json();
    if (res.ok) {
      setServices((prev) => prev.map((s) => (s.id === service.id ? data : s)));
      router.refresh();
    }
  }

  async function deleteService(serviceId: string) {
    if (!confirm("Delete this service?")) return;
    await fetch(`/api/admin/clients/${clientId}/services?id=${serviceId}`, { method: "DELETE" });
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    router.refresh();
  }

  function startEdit(service: Service) {
    setEditingId(service.id);
    setEditService({
      name: service.name,
      slug: service.slug,
      description: service.description ?? "",
      category: service.category ?? "",
      base_price: service.base_price != null ? String(service.base_price) : "",
      currency: service.currency,
    });
  }

  async function saveEdit(serviceId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/services`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: serviceId,
          name: editService.name,
          slug: editService.slug,
          description: editService.description || undefined,
          category: editService.category || undefined,
          base_price: editService.base_price ? Number(editService.base_price) : undefined,
          currency: editService.currency,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setServices((prev) => prev.map((s) => (s.id === serviceId ? data : s)));
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="mb-4 font-semibold">Services ({services.length})</h3>
        <p className="mb-4 text-sm text-muted">
          Services feed the AI assistant, content generator, and offer context. Prices here are factual — AI will not invent other amounts.
        </p>
        <div className="space-y-3">
          {services.length === 0 ? (
            <p className="text-sm text-muted">No services yet. Add your first service below.</p>
          ) : (
            services.map((service) => (
              <div key={service.id} className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3">
                {editingId === service.id ? (
                  <div className="grid w-full gap-3 sm:grid-cols-2">
                    <FormField label="Name"><Input value={editService.name} onChange={(e) => setEditService({ ...editService, name: e.target.value })} /></FormField>
                    <FormField label="Slug"><Input value={editService.slug} onChange={(e) => setEditService({ ...editService, slug: e.target.value })} /></FormField>
                    <FormField label="Category"><Input value={editService.category} onChange={(e) => setEditService({ ...editService, category: e.target.value })} /></FormField>
                    <FormField label="Base price"><Input type="number" value={editService.base_price} onChange={(e) => setEditService({ ...editService, base_price: e.target.value })} /></FormField>
                    <div className="sm:col-span-2">
                      <FormField label="Description"><Textarea rows={2} value={editService.description} onChange={(e) => setEditService({ ...editService, description: e.target.value })} /></FormField>
                    </div>
                    <div className="flex gap-2 sm:col-span-2">
                      <Button type="button" size="sm" disabled={loading} onClick={() => saveEdit(service.id)}>Save</Button>
                      <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                <div>
                  <p className="font-medium">{service.name}</p>
                  <p className="text-xs text-muted">
                    {service.slug}
                    {service.base_price != null ? ` · from ${service.base_price} ${service.currency}` : ""}
                    {service.category ? ` · ${service.category}` : ""}
                    {!service.is_active ? " · inactive" : ""}
                  </p>
                  {service.description ? <p className="mt-1 text-sm text-muted">{service.description}</p> : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(service)}>Edit</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => toggleActive(service)}>
                    {service.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button type="button" variant="danger" size="sm" onClick={() => deleteService(service.id)}>
                    Delete
                  </Button>
                </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Add Service</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" required>
            <Input value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} />
          </FormField>
          <FormField label="Slug" required>
            <Input value={newService.slug} onChange={(e) => setNewService({ ...newService, slug: e.target.value })} placeholder="wedding-photography" />
          </FormField>
          <FormField label="Category">
            <Input value={newService.category} onChange={(e) => setNewService({ ...newService, category: e.target.value })} placeholder="wedding" />
          </FormField>
          <FormField label="Base price">
            <Input type="number" value={newService.base_price} onChange={(e) => setNewService({ ...newService, base_price: e.target.value })} />
          </FormField>
          <FormField label="Currency">
            <Input value={newService.currency} onChange={(e) => setNewService({ ...newService, currency: e.target.value })} />
          </FormField>
        </div>
        <FormField label="Description">
          <Textarea rows={3} value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
        </FormField>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mt-2 text-sm text-green-600">Service saved.</p> : null}
        <Button type="button" className="mt-4" disabled={loading || !newService.name || !newService.slug} onClick={createService}>
          {loading ? "Saving..." : "Add Service"}
        </Button>
      </Card>
    </div>
  );
}
