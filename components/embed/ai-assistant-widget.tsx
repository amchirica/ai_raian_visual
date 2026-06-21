"use client";

import { useEffect, useRef, useState } from "react";
import type { AssistantConfig } from "@/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantWidgetProps {
  clientSlug: string;
  mode?: "embed" | "floating";
  config?: AssistantConfig | null;
}

export function AIAssistantWidget({
  clientSlug,
  mode = "embed",
  config: initialConfig,
}: AIAssistantWidgetProps) {
  const [open, setOpen] = useState(mode === "embed");
  const [config, setConfig] = useState<AssistantConfig | null>(initialConfig ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: "", email: "", phone: "" });
  const [leadDone, setLeadDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const primaryColor = config?.theme?.primaryColor ?? "#2563eb";

  useEffect(() => {
    if (!initialConfig) {
      fetch(`/api/assistant/${clientSlug}/config`)
        .then((r) => r.json())
        .then((data) => {
          setConfig(data);
          setMessages([{ role: "assistant", content: data.greeting_message }]);
        })
        .catch(() => undefined);
    } else {
      setMessages([{ role: "assistant", content: initialConfig.greeting_message }]);
    }
  }, [clientSlug, initialConfig]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showLeadForm]);

  async function sendMessage(event?: React.FormEvent) {
    event?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    const nextMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        client_slug: clientSlug,
        message: userMessage,
        history: nextMessages,
      };
      if (conversationId) payload.conversation_id = conversationId;

      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setConversationId(data.conversation_id);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      if (data.handoff_requested || data.lead_capture_suggested) {
        setShowLeadForm(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: config?.fallback_message ?? "Ne pare rău, a apărut o eroare. Încearcă din nou.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submitLead(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      let convId = conversationId;
      if (!convId) {
        const bootstrap = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_slug: clientSlug,
            message: "Solicitare ofertă prin formular",
            history: messages,
          }),
        });
        const bootData = await bootstrap.json();
        if (!bootstrap.ok) throw new Error("Failed");
        convId = bootData.conversation_id;
        setConversationId(convId);
      }

      const res = await fetch("/api/assistant/create-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_slug: clientSlug,
          conversation_id: convId,
          ...leadForm,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setLeadDone(true);
      setShowLeadForm(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Mulțumim! Am înregistrat solicitarea ta. Echipa te va contacta în curând.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Nu am putut salva datele. Te rugăm să încerci din nou." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const chatWindow = (
    <div
      className="ai-assistant-widget flex flex-col overflow-hidden bg-white shadow-2xl"
      style={{
        width: mode === "floating" ? 380 : "100%",
        height: mode === "floating" ? 520 : 560,
        maxHeight: "85vh",
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div>
          <p className="text-sm font-semibold">{config?.company_name ?? "Asistent"}</p>
          <p className="text-xs opacity-80">Asistent virtual</p>
        </div>
        {mode === "floating" ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-1 text-lg leading-none opacity-80 hover:opacity-100"
            aria-label="Close"
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className="max-w-[88%] rounded-xl px-3 py-2 text-sm leading-relaxed"
            style={
              msg.role === "user"
                ? { marginLeft: "auto", backgroundColor: primaryColor, color: "#fff" }
                : { backgroundColor: "#f1f5f9", color: "#1e293b" }
            }
          >
            {msg.content}
          </div>
        ))}
        {loading ? (
          <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-500">Scrie...</div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {showLeadForm && !leadDone ? (
        <form onSubmit={submitLead} className="border-t border-slate-200 bg-slate-50 p-3 space-y-2">
          <p className="text-xs font-medium text-slate-700">{config?.lead_capture_prompt}</p>
          <input
            placeholder="Nume"
            value={leadForm.name}
            onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={leadForm.email}
            onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Telefon (opțional)"
            value={leadForm.phone}
            onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2 text-sm font-medium text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Trimite
          </button>
        </form>
      ) : (
        <form onSubmit={sendMessage} className="border-t border-slate-200 p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Scrie mesajul tău..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              →
            </button>
          </div>
          {!showLeadForm ? (
            <button
              type="button"
              onClick={() => setShowLeadForm(true)}
              className="mt-2 text-xs text-slate-500 hover:underline"
            >
              Vreau o ofertă →
            </button>
          ) : null}
        </form>
      )}
    </div>
  );

  if (mode === "floating") {
    return (
      <div className="ai-assistant-root" style={{ position: "fixed", bottom: 20, right: 20, zIndex: 99999 }}>
        {open ? (
          chatWindow
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
            style={{ backgroundColor: primaryColor }}
            aria-label="Open chat"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return <div className="ai-assistant-embed p-2">{chatWindow}</div>;
}
