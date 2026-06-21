# Architecture Overview

## Multi-Tenancy Model

Every business is a **client** row in the `clients` table. All related data (services, leads, offers, widgets, etc.) is scoped by `client_id`.

```
clients (tenant root)
  ├── business_profiles
  ├── services
  ├── packages
  ├── lead_fields
  ├── leads
  ├── offers
  ├── followup_sequences
  │     └── followup_messages
  ├── faq_items
  ├── content_templates
  ├── widget_settings
  ├── api_keys
  └── activity_logs
```

## Layering

| Layer | Location | Responsibility |
|-------|----------|----------------|
| UI | `app/admin`, `app/embed` | Presentation only |
| API | `app/api` | HTTP boundary, validation |
| Services | `lib/services` | Business operations |
| Integrations | `lib/ai`, `lib/pdf`, `lib/webhooks` | External systems |
| Data | `lib/supabase` | Database access |

## Security

- `SUPABASE_SERVICE_ROLE_KEY` is used only in server code (`lib/supabase/admin.ts`)
- `OPENAI_API_KEY` is used only in `lib/ai/service.ts`
- Frontend widgets call public API routes; secrets never leave the server
- RLS is enabled on all tables; policies should be added when exposing public anon access

## Webhooks

Webhooks fire on events like `lead.created`. Targets are resolved from:

1. `clients.settings.webhooks[event]` (per-client)
2. `clients.settings.webhooks.default`
3. Global env vars (`N8N_WEBHOOK_URL`, etc.)

Compatible with n8n, Make, and Zapier inbound webhooks.

## Embeds

Widgets load client config from `widget_settings` and related tables at render time. No business-specific code in the widget components — only generic rendering driven by DB config.

## Demo Data

`supabase/seed.sql` inserts **Raian Visual** as sample config. The application code has zero references to Raian Visual; it only appears in seed data.
