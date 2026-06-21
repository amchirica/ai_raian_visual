# Raian Visual Demo Flow

Quick guide to test the full MVP with the **Raian Visual** demo client (`slug: raian-visual`).

> Full seed reference: [RAIAN_VISUAL_DEMO.md](RAIAN_VISUAL_DEMO.md)

## Prerequisites

1. Run Supabase migrations `001` → `010`
2. Set `.env.local`: `NEXT_PUBLIC_APP_URL`, Supabase keys
3. `npm run dev` → open `http://localhost:3000/admin`

## Test flow

### 1. Open lead form

```
http://localhost:3000/embed/lead-form/raian-visual
```

Submit a test lead (foto+video, Iași, budget 2100–2700 EUR) → expect **hot** score.

### 2. View lead in admin

`/admin/clients` → Raian Visual → **Leads**

Or use demo lead **Maria Popescu & Andrei Ionescu** (migration 010).

### 3. Generate offer

Lead detail → **Generate Offer** → Signature package recommended → Generate → Preview HTML/PDF.

### 4. Mark offer sent

Offer detail → **Mark as sent** → follow-ups auto-created (24h / 72h / 7d).

### 5. Follow-ups

`/admin/follow-ups?client={id}` → Generate AI text → Edit → Copy → Approve → Mark sent.

### 6. Content generator

`/admin/content-generator?client={id}` → Instagram caption or Meta Ads → Save draft → View in **Generated Content**.

### 7. Chat widget

```
http://localhost:3000/embed/chat/raian-visual
```

Ask about packages/prices → answers from FAQ. Test lead capture prompt.

### 8. Embed scripts

From client overview **Quick Embed Code**:

```html
<script src="http://localhost:3000/widget/lead-form.js" data-client="raian-visual" async></script>
<script src="http://localhost:3000/widget/chat.js" data-client="raian-visual" async></script>
```

See [embed-widgets.md](embed-widgets.md) for production URLs.

## Demo data tags

Preview rows use `metadata.demo = true`. Safe to delete after testing.

## Without OpenAI

- Content generator uses **template fallback** (amber notice)
- Follow-up AI generation uses fallback text
- Offer generation still works (deterministic pricing + HTML)
- Chat uses FAQ keyword matching
