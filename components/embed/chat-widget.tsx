"use client";

import { useState } from "react";

interface ChatWidgetProps {
  clientSlug: string;
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  welcomeMessage?: string;
  placeholder?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget({
  clientSlug,
  title = "Chat",
  subtitle,
  primaryColor = "#2563eb",
  welcomeMessage = "Hello! How can I help?",
  placeholder = "Type your message...",
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: welcomeMessage },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    const nextMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const response = await fetch(`/api/clients/${clientSlug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: nextMessages }),
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply ?? "Sorry, I could not respond." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[500px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold" style={{ color: primaryColor }}>
          {title}
        </h2>
        {subtitle ? <p className="text-xs text-slate-600">{subtitle}</p> : null}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "ml-auto bg-slate-900 text-white"
                : "bg-slate-100 text-slate-900"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="border-t border-slate-200 p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
