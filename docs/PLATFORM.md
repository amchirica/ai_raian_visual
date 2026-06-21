# Platform Architecture

## Overview

Single internal admin platform serving multiple clients (tenants). Every module scopes data by `client_id`.

## Shared Configuration

All modules read from the same client data:

| Source | Used by |
|--------|---------|
| `clients` + `settings` | Lead scoring, offer defaults, webhooks |
| `business_profiles` | All modules (name, contact, branding) |
| `services` / `packages` | Offers, Assistant, Content |
| `content_settings` | Content & Follow-up Engine |
| `assistant_settings` | AI Assistant |
| `faq_items` | Assistant, Content |
| `lead_fields` | Lead Engine |

Load via `platformService.getSharedBusinessConfig(clientId)`.

## Workflow Orchestration

`lib/services/workflow-service.ts` connects modules:

| Event | Trigger | Action |
|-------|---------|--------|
| Lead created | `POST /api/leads` | Log workflow step |
| Offer generated | Admin generates offer | Log step, update lead status |
| Offer sent | Mark offer as sent | Webhook + auto-create 24h/72h/7d follow-up sequence |

Follow-ups require **manual approval** in MVP before marking as sent.

## Module Map

```
Lead Engine          → leads, lead_fields, scoring
Offer Generator      → offers, packages, pricing_rules
AI Assistant         → assistant_settings, chat_*, faq_items
Content & Follow-up  → content_settings, generated_content, scheduled_followups
```

## API Surface

Public (embed):
- `POST /api/leads`
- `GET /api/clients/[slug]/lead-form-config`
- `POST /api/assistant/chat`
- `GET /api/assistant/[slug]/config`

Admin:
- `/api/admin/clients/*`
- `/api/offers/*`
- `/api/content/*`
- `/api/followups/*`

## Activity Log

All major actions write to `activity_logs` for dashboard visibility.

## Multi-Industry Support

Configure per client via:
- `content_settings.industry` — wedding, salon, clinic, etc.
- `clients.settings` — JSON for scoring, offer defaults, webhooks
- No industry logic hardcoded in application code
