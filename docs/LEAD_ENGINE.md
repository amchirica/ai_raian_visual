# Lead Engine Module

Universal lead capture and qualification system — configurable per client, embeddable on any website.

## Features

- Dynamic forms from `lead_fields` table
- Configurable scoring via `clients.settings.lead_scoring`
- Embeddable via iframe or script widget
- Activity logs, webhooks, provider-agnostic email notifications
- Admin UI for fields and leads

## Embed URLs

```
/embed/lead-form/{clientSlug}          — iframe page
/widget/lead-form.js?client={slug}     — script widget
/embed/{clientSlug}/lead-form          — legacy path (still works)
```

## API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/clients/{slug}/lead-form-config` | Public form config (no secrets) |
| POST | `/api/leads` | Create lead (`client_slug` or `client_id`) |
| POST | `/api/clients/{slug}/leads` | Create lead (slug-scoped) |
| POST | `/api/webhooks/lead-created` | Manual webhook trigger |
| GET/POST | `/api/admin/clients/{id}/lead-fields` | Manage fields |
| GET | `/api/admin/clients/{id}/leads` | List leads |
| GET/PATCH | `/api/admin/leads/{leadId}` | Lead detail & status |

## Field Types

`text`, `email`, `phone`, `date`, `select`, `multi_select`, `textarea`, `number`, `budget_range`, `checkbox`

## Scoring Config

Store in `clients.settings.lead_scoring`:

```json
{
  "rules": [
    { "type": "field_in_list", "field": "desired_services", "value": ["photo+video"], "points": 20, "label": "Full package" },
    { "type": "budget_range_min", "field": "budget_range", "min": 1600, "points": 15, "label": "Budget fit" },
    { "type": "field_in_list", "field": "city", "value": ["Iași", "Moldova"], "points": 15, "label": "Location" },
    { "type": "completeness", "points": 15, "label": "Form complete" },
    { "type": "date_within_months", "field": "wedding_date", "months": 18, "points": 10, "label": "Urgency" }
  ],
  "thresholds": { "hot": 70, "warm": 40 },
  "recommended_actions": {
    "hot": "Contact within 2 hours",
    "warm": "Follow up in 24h",
    "cold": "Add to nurture sequence"
  }
}
```

### Rule Types

| Type | Description |
|------|-------------|
| `field_equals` | Exact field match |
| `field_contains` | Substring match |
| `field_in_list` | Value in array (location, services) |
| `budget_range_min` | Parse budget field, check minimum |
| `date_within_months` | Event date within N months |
| `date_after_today` | Future date |
| `completeness` | Partial points by % fields filled |
| `required_fields_complete` | All required fields filled |

## Email Notifications

Provider-agnostic via webhook. Set in client settings:

```json
{
  "notifications": {
    "notify_email": "contact@business.com",
    "email_webhook": "https://your-email-provider.com/webhook"
  }
}
```

Or set global `LEAD_EMAIL_WEBHOOK_URL` in `.env.local`.

## Migrations

Run in order:
1. `001_initial_schema.sql`
2. `002_lead_engine.sql`
3. `003_raian_visual_lead_seed.sql` (demo data)

## Admin Pages

- `/admin/clients/{id}/lead-fields` — manage form fields
- `/admin/clients/{id}/leads` — list & filter leads
- `/admin/leads/{leadId}` — detail, score explanation, status
