import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_NAME } from "@/lib/constants";
import { getSessionUser, getPlatformAdmin } from "@/lib/auth/admin";

export default async function SettingsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY),
  );
  const webhookEnvConfigured = Boolean(
    process.env.N8N_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL || process.env.ZAPIER_WEBHOOK_URL,
  );

  const user = await getSessionUser();
  const admin = user ? await getPlatformAdmin(user.id) : null;

  return (
    <>
      <AdminHeader title="System Control" description="Platform status, security, and documentation." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-emerald-200 bg-emerald-50 lg:col-span-2">
          <h3 className="mb-2 font-semibold text-emerald-900">Admin authentication</h3>
          <p className="text-sm text-emerald-800">
            Admin panel is protected by Supabase Auth + <code>platform_admins</code> table.
            {admin ? (
              <> Signed in as <strong>{admin.email}</strong> ({admin.role}).</>
            ) : (
              <> Session not detected on this page load.</>
            )}{" "}
            Setup: <code>npm run db:migrate:auth</code> then <code>npm run seed:admin</code>.
            See <span className="font-mono text-xs">docs/admin-auth-setup.md</span>.
          </p>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold">Environment Status</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">App URL</dt><dd className="font-mono text-xs">{baseUrl}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">OpenAI API key</dt><dd><Badge variant={openAiConfigured ? "success" : "warning"}>{openAiConfigured ? "Configured" : "Not set"}</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-muted">Supabase</dt><dd><Badge variant={supabaseConfigured ? "success" : "warning"}>{supabaseConfigured ? "Connected" : "Not configured"}</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-muted">Widget base URL</dt><dd className="font-mono text-xs">{baseUrl}/embed/{"{clientSlug}"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Webhook env fallback</dt><dd><Badge variant={webhookEnvConfigured ? "success" : "default"}>{webhookEnvConfigured ? "Configured" : "Optional"}</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-muted">Demo mode</dt><dd>Seed data only (Raian Visual) — no hardcoded business logic</dd></div>
          </dl>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold">Post-MVP (documented, not built)</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted">
            <li>SaaS billing and subscription management</li>
            <li>Public client portal accounts</li>
            <li>Complex multi-user RBAC permissions</li>
            <li>Automatic email/WhatsApp sending (MVP: copy + mark sent)</li>
            <li>Full webhook delivery log history</li>
            <li>Drag-and-drop reorder (MVP uses move up/down)</li>
          </ul>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold">Implemented MVP Controls</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted">
            <li>Full CRUD: packages, features, extras, pricing rules, services, FAQ, lead fields</li>
            <li>Webhooks table + per-client admin UI</li>
            <li>Lead/offer archive, content delete, follow-up delete/reschedule</li>
            <li>Activity logs on client detail</li>
          </ul>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold">Documentation</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/admin" className="text-primary hover:underline">Platform dashboard</Link></li>
            <li><span className="text-muted">docs/admin-auth-setup.md — login & platform_admins setup</span></li>
            <li><span className="text-muted">docs/full-admin-control-audit.md — CRUD audit & checklist</span></li>
            <li><span className="text-muted">docs/client-onboarding.md — new client setup</span></li>
            <li><span className="text-muted">docs/RAIAN_VISUAL_DEMO.md — demo seed reference</span></li>
            <li><span className="text-muted">docs/mvp-stabilization-report.md — stabilization status</span></li>
            <li><span className="text-muted">docs/mvp-qa-checklist.md — manual QA</span></li>
            <li><span className="text-muted">docs/embed-widgets.md — widget embed guide</span></li>
            <li><span className="text-muted">docs/demo-raianvisual.md — demo test flow</span></li>
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="mb-3 font-semibold">{APP_NAME}</h3>
          <p className="text-sm text-muted">
            Multi-tenant internal platform. All modules share <code>client_id</code> and business configuration.
            Pricing is deterministic from packages — AI never invents prices. Raian Visual is seed/demo data only.
          </p>
        </Card>
      </div>
    </>
  );
}
