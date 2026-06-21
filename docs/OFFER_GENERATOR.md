# Offer Generator Module

Universal, configurable offer generation for any small business.

## Setup

Run migrations in order:
1. `004_offer_generator.sql` — tables: `package_features`, `package_extras`, `pricing_rules`, `offer_items`
2. `005_raian_visual_offers_seed.sql` — demo packages, extras, rules

## Architecture

```
Lead + Packages + Extras + Pricing Rules + Business Profile
                    ↓
         Package Recommendation Engine (deterministic)
                    ↓
         Price Calculation (deterministic)
                    ↓
         HTML / Email / Text generation
                    ↓
         Optional AI copy enhancement (wording only)
                    ↓
              offers + offer_items tables
```

## Output Formats

| Format | Field |
|--------|-------|
| HTML preview | `offers.content_html` |
| PDF | `GET /api/offers/{id}/pdf` |
| Email body | `offers.email_body` |
| Text summary | `offers.text_summary` |

## API

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/offers/generate` | Generate offer from lead |
| GET | `/api/offers/{id}` | Get offer with items |
| GET | `/api/offers/{id}/pdf` | Download PDF |
| POST | `/api/offers/{id}/mark-sent` | Mark as sent |
| POST | `/api/offers/{id}/actions` | Duplicate offer |
| PATCH | `/api/offers/{id}/actions` | Regenerate AI wording (prices unchanged) |

### Generate Offer

```json
POST /api/offers/generate
{
  "client_id": "uuid",
  "lead_id": "uuid",
  "package_id": "uuid (optional — auto-recommends if omitted)",
  "extra_ids": ["uuid"],
  "use_ai_copy": true
}
```

## Package Recommendation

Rules stored in `pricing_rules` table:

```json
{
  "name": "Essential — photo+video mid budget",
  "rule_type": "recommend_package",
  "conditions": [
    { "field": "desired_services", "operator": "contains", "value": "photo+video" },
    { "field": "budget_range", "operator": "budget_between", "value": { "min": 1600, "max": 2000 } }
  ],
  "action": { "package_slug": "essential", "reason": "Potrivit pentru foto+video cu buget mediu" },
  "priority": 100
}
```

### Condition Operators

`equals`, `contains`, `in`, `gte`, `lte`, `budget_min`, `budget_max`, `budget_between`

## AI Copy Rules

- AI only improves `delivery_terms`, `next_steps`, intro wording
- **Never** invents prices, packages, dates, or guarantees
- All pricing is calculated server-side from DB values
- Disable with `"use_ai_copy": false`

## Admin Pages

| Page | Purpose |
|------|---------|
| `/admin/clients/{id}/packages` | Packages, extras, pricing rules |
| `/admin/clients/{id}/offer-template` | Email template |
| `/admin/leads/{leadId}/generate-offer` | Generate from lead |
| `/admin/offers/{offerId}` | Preview, PDF, send, duplicate |

## Raian Visual Demo

| Package | Price |
|---------|-------|
| Basic | 1399 EUR |
| Essential | 1799 EUR |
| Signature | 2099 EUR |
| Exclusive | 2699 EUR |

See [RAIAN_VISUAL_DEMO.md](RAIAN_VISUAL_DEMO.md) for full demo data including example leads and offers.

8 extras: drone, second photographer/videographer, extra hour, album, 4K, highlight, fast preview.

## Client Settings

```json
{
  "offer_defaults": {
    "validity_days": 14,
    "delivery_terms": "...",
    "next_steps": "...",
    "cta_text": "Confirmă oferta",
    "currency": "EUR"
  }
}
```
