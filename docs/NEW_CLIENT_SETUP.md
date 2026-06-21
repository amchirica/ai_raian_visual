# New Client Setup

Step-by-step to onboard a new business (any industry).

## 1. Create Client

Admin → **Clients** → **New Client**

- Name, slug, domain (optional)
- Business profile: company name, contact, colors, description

## 2. Lead Engine

`/admin/clients/[id]/lead-fields`

- Add/reorder form fields (name, email, phone, custom fields)
- Configure scoring in client settings JSON or use defaults

Test: `/embed/lead-form/[slug]`

## 3. Packages & Offers

`/admin/clients/[id]/packages`

- Add services and packages with prices
- Set pricing rules for recommendations
- Configure offer template: `/admin/clients/[id]/offer-template`

## 4. AI Assistant (optional)

`/admin/clients/[id]/assistant`

- Greeting, fallback, tone
- FAQ: `/admin/clients/[id]/faq`

Test: `/embed/chat/[slug]`

## 5. Content Settings

`/admin/clients/[id]/content-settings`

- Industry, tone, audience, forbidden claims, preferred CTA

## 6. Embed on Website

Add to client's website:

```html
<script src="https://your-domain.com/widget/lead-form.js" data-client="SLUG" async></script>
<script src="https://your-domain.com/widget/chat.js" data-client="SLUG" async></script>
```

See [EMBEDDING.md](EMBEDDING.md)

## 7. Workflow Test

1. Submit test lead via embed form
2. Review in `/admin/leads/[id]`
3. Generate offer from lead page
4. Preview PDF, mark as sent
5. Check `/admin/follow-ups` — 24h/72h/7d sequence auto-created
6. Generate content in `/admin/content-generator`

## Client Settings JSON (optional)

In client config, `settings` can include:

```json
{
  "locale": "ro",
  "industry": "wedding_photo_video",
  "lead_scoring": { "rules": [], "thresholds": { "hot": 70, "warm": 40 } },
  "offer_defaults": {
    "validity_days": 14,
    "delivery_terms": "...",
    "currency": "EUR"
  },
  "webhooks": {
    "lead.created": "https://n8n.example.com/webhook/...",
    "default": "https://..."
  }
}
```

## Demo Reference

Raian Visual (`slug: raian-visual`) — run migrations 003, 005, 007, 009, 010 for full demo data. See [RAIAN_VISUAL_DEMO.md](RAIAN_VISUAL_DEMO.md).
