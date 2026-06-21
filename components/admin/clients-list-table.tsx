"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { Client } from "@/types";

interface ClientsListTableProps {
  initialClients: Client[];
}

export function ClientsListTable({ initialClients }: ClientsListTableProps) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", slug: "", domain: "", is_active: true });

  function startEdit(client: Client) {
    setEditingId(client.id);
    setEditForm({
      name: client.name,
      slug: client.slug,
      domain: client.domain ?? "",
      is_active: client.is_active,
    });
    setError(null);
  }

  async function saveEdit(clientId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: {
            name: editForm.name,
            slug: editForm.slug,
            domain: editForm.domain || null,
            is_active: editForm.is_active,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : data.error?.message ?? "Failed to save");
      setClients((prev) =>
        prev.map((c) =>
          c.id === clientId
            ? {
                ...c,
                name: editForm.name,
                slug: editForm.slug,
                domain: editForm.domain || null,
                is_active: editForm.is_active,
              }
            : c,
        ),
      );
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function deleteClient(client: Client) {
    const confirmed = confirm(
      `Delete client "${client.name}"?\n\nThis permanently removes all related data (leads, offers, packages, FAQ, etc.). This cannot be undone.`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${client.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : data.error?.message ?? "Failed to delete");
      setClients((prev) => prev.filter((c) => c.id !== client.id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-accent/50">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-border last:border-0">
                {editingId === client.id ? (
                  <>
                    <td className="px-4 py-3">
                      <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </td>
                    <td className="px-4 py-3">
                      <Input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} />
                    </td>
                    <td className="px-4 py-3">
                      <Input value={editForm.domain} onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })} placeholder="optional" />
                    </td>
                    <td className="px-4 py-3">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={editForm.is_active}
                          onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                        />
                        Active
                      </label>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(client.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" disabled={loading} onClick={() => saveEdit(client.id)}>Save</Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium">{client.name}</td>
                    <td className="px-4 py-3 text-muted">{client.slug}</td>
                    <td className="px-4 py-3 text-muted">{client.domain ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={client.is_active ? "success" : "warning"}>
                        {client.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(client.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/clients/${client.id}`}>
                          <Button type="button" variant="secondary" size="sm">Open</Button>
                        </Link>
                        <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(client)}>Edit</Button>
                        <Button type="button" variant="danger" size="sm" disabled={loading} onClick={() => deleteClient(client)}>Delete</Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
