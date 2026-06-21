# Database Schema

Run migrations in order from `supabase/migrations/`.

## Tables

| Table | client_id | Purpose |
|-------|-----------|---------|
| `clients` | — | Tenant root |
| `business_profiles` | ✓ | Company branding & contact |
| `services` | ✓ | Service catalog |
| `packages` | ✓ | Pricing packages |
| `lead_fields` | ✓ | Dynamic form fields |
| `leads` | ✓ | Captured leads |
| `offers` | ✓ | Generated offers |
| `followup_sequences` | ✓ | Automation sequences |
| `followup_messages` | ✓ | Sequence steps |
| `faq_items` | ✓ | FAQ content |
| `content_templates` | ✓ | Email/offer templates |
| `activity_logs` | optional | Audit trail |
| `api_keys` | ✓ | Client API keys (hashed) |
| `widget_settings` | ✓ | Embed widget config |

All tables include `id`, `created_at`, `updated_at`. Tenant tables include `client_id`.

## Client Settings JSON

Example `clients.settings`:

```json
{
  "locale": "ro",
  "timezone": "Europe/Bucharest",
  "webhooks": {
    "lead.created": "https://n8n.example.com/webhook/abc",
    "default": "https://hooks.zapier.com/..."
  }
}
```

## Widget Settings

Each row in `widget_settings` defines one embeddable module per `widget_type`:

- `lead-form`
- `chat`
- `faq`
- `offer-request`

`theme` and `config` are JSON blobs for visual and behavioral settings.
