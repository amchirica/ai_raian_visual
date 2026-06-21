"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormField, Input, Textarea } from "@/components/ui/input";
import type { FaqItem } from "@/types";

interface FaqManagerProps {
  clientId: string;
  initialItems: FaqItem[];
}

export function FaqManager({ clientId, initialItems }: FaqManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [newItem, setNewItem] = useState({ question: "", answer: "", category: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState({ question: "", answer: "", category: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

  async function addItem() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/faq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newItem, sort_order: items.length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setItems((prev) => [...prev, data]);
      setNewItem({ question: "", answer: "", category: "" });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: FaqItem) {
    setEditingId(item.id);
    setEditItem({ question: item.question, answer: item.answer, category: item.category ?? "" });
  }

  async function saveEdit(item: FaqItem) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/faq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, ...editItem, sort_order: item.sort_order, is_active: item.is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(item: FaqItem) {
    const res = await fetch(`/api/admin/clients/${clientId}/faq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        question: item.question,
        answer: item.answer,
        category: item.category,
        is_active: !item.is_active,
      }),
    });
    const data = await res.json();
    if (res.ok) setItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
  }

  async function moveItem(index: number, direction: -1 | 1) {
    const next = [...sorted];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await fetch(`/api/admin/clients/${clientId}/faq`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_ids: next.map((i) => i.id) }),
    });
    setItems(next.map((item, i) => ({ ...item, sort_order: i })));
    router.refresh();
  }

  async function removeItem(id: string) {
    if (!confirm("Delete this FAQ item?")) return;
    await fetch(`/api/admin/clients/${clientId}/faq?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Card>
        <h3 className="mb-4 font-semibold">FAQ Items ({sorted.length})</h3>
        <div className="space-y-3">
          {sorted.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-border px-4 py-3">
              {editingId === item.id ? (
                <div className="space-y-3">
                  <FormField label="Question"><Input value={editItem.question} onChange={(e) => setEditItem({ ...editItem, question: e.target.value })} /></FormField>
                  <FormField label="Answer"><Textarea rows={3} value={editItem.answer} onChange={(e) => setEditItem({ ...editItem, answer: e.target.value })} /></FormField>
                  <FormField label="Category"><Input value={editItem.category} onChange={(e) => setEditItem({ ...editItem, category: e.target.value })} /></FormField>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" disabled={loading} onClick={() => saveEdit(item)}>Save</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.question}</p>
                      <p className="mt-1 text-sm text-muted">{item.answer}</p>
                      {item.category ? <p className="mt-1 text-xs text-muted">{item.category}</p> : null}
                    </div>
                    {!item.is_active ? <Badge variant="warning">Inactive</Badge> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => moveItem(index, -1)}>↑</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => moveItem(index, 1)}>↓</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(item)}>Edit</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => toggleActive(item)}>
                      {item.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button type="button" variant="danger" size="sm" onClick={() => removeItem(item.id)}>Delete</Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h3 className="mb-4 font-semibold">Add FAQ</h3>
        <div className="space-y-3">
          <FormField label="Question"><Input value={newItem.question} onChange={(e) => setNewItem({ ...newItem, question: e.target.value })} /></FormField>
          <FormField label="Answer"><Textarea rows={3} value={newItem.answer} onChange={(e) => setNewItem({ ...newItem, answer: e.target.value })} /></FormField>
          <FormField label="Category"><Input value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} /></FormField>
          <Button type="button" disabled={loading || !newItem.question || !newItem.answer} onClick={addItem}>Add FAQ</Button>
        </div>
      </Card>
    </div>
  );
}
