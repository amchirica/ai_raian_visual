# Content & Follow-up Engine

Configurable system for generating marketing content and follow-up sequences per client.

## Features

- **12 content types**: follow-up email, WhatsApp, SMS, Meta Ads, Instagram, Facebook, blog outline, SEO title/description, portfolio description, proposal intro
- **Client-specific settings**: industry, tone, audience, positioning, forbidden claims, preferred CTA
- **Editable drafts** before use
- **Status workflow**: draft → approved → sent → archived
- **Follow-up sequences** linked to leads/offers with scheduling
- **Manual approval required** in MVP — nothing sends automatically

## Database

Run migrations:

```
008_content_followup_engine.sql
009_raian_visual_content_seed.sql  (Raian Visual demo)
```

| Table | Purpose |
|-------|---------|
| `content_settings` | Per-client tone, industry, rules |
| `content_templates` | Reusable templates (existing, extended) |
| `generated_content` | AI/manual generated content with status |
| `followup_sequences` | Sequences linked to leads/offers |
| `followup_messages` | Steps with delay + channel |
| `scheduled_followups` | Scheduled items pending approval |

## Admin Pages

| Page | Description |
|------|-------------|
| `/admin/clients/[id]/content-settings` | Industry, tone, audience, forbidden claims |
| `/admin/content-generator` | Generate + edit content |
| `/admin/generated-content` | All saved content |
| `/admin/leads/[leadId]/followups` | Lead follow-up sequences |
| `/admin/offers/[offerId]/followups` | Offer follow-up sequences |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/content/generate` | Generate content with AI |
| GET | `/api/content/templates?client_id=` | List templates |
| POST | `/api/content/save` | Save/update draft |
| PATCH | `/api/content/save` | Update status (approve/sent/archive) |
| POST | `/api/followups/create-sequence` | Create follow-up sequence |
| POST | `/api/followups/generate-message` | AI-generate scheduled message |
| POST | `/api/followups/mark-sent` | Approve or mark as sent |
| GET/PUT | `/api/admin/clients/[id]/content-settings` | Admin settings |

### Generate content

```json
POST /api/content/generate
{
  "client_id": "uuid",
  "content_type": "instagram_caption",
  "context": "Wedding portfolio post from last weekend in Iași",
  "lead_id": "optional-uuid",
  "offer_id": "optional-uuid",
  "extra_instructions": "Mention 2027 bookings"
}
```

### Create follow-up sequence

```json
POST /api/followups/create-sequence
{
  "client_id": "uuid",
  "lead_id": "uuid",
  "name": "Offer follow-up",
  "require_approval": true,
  "steps": [
    { "delay_hours": 24, "channel": "email", "name": "24h reminder" },
    { "delay_hours": 72, "channel": "whatsapp", "name": "72h reminder" },
    { "delay_hours": 168, "channel": "email", "name": "7-day reminder" }
  ]
}
```

## Content Types

- `follow_up_email`
- `whatsapp_message`
- `sms_short`
- `meta_ads_primary`
- `meta_ads_headline`
- `instagram_caption`
- `facebook_post`
- `blog_outline`
- `seo_title`
- `seo_meta_description`
- `portfolio_description`
- `proposal_intro`

## AI Safety Rules

- No false promises or invented prices/discounts
- No fake scarcity or aggressive spam language
- Regulated industry claims avoided (medical/legal/financial)
- Content aligned with client tone and approved business data only

## Raian Visual Demo

After seed `009_raian_visual_content_seed.sql`:

- **Settings**: `/admin/clients/{id}/content-settings`
- **Generator**: `/admin/content-generator?client={id}`

Example prompts:
- Follow-up after wedding offer
- Instagram caption for wedding portfolio
- Meta Ads text for 2027 bookings
- SEO outline: "Fotograf și videograf nuntă Iași"
- Short WhatsApp reminder

## Environment

Requires `OPENAI_API_KEY` for AI generation. Without it, placeholder demo text is returned.

## MVP Limitations

- Follow-ups are **scheduled and tracked** but **not auto-sent**
- Admin must approve, copy content, and manually mark as sent
- Future: email/WhatsApp integration with approved content only
