# Raian Visual — Demo Data Reference

**Client slug:** `raian-visual`  
**Website:** [raianvisual.ro](https://raianvisual.ro)  
**Industry:** Wedding photo-video · Romania · Iași, Moldova  

This document describes **demo seed data only**. Nothing here is hardcoded in application logic — all values live in Supabase SQL seeds (migrations `003`–`010` and `supabase/seed.sql`).

---

## Running the demo

Run migrations in order in Supabase SQL Editor:

```
001_initial_schema.sql
002_lead_engine.sql
003_raian_visual_lead_seed.sql
004_offer_generator.sql
005_raian_visual_offers_seed.sql
006_assistant_chat.sql
007_raian_visual_assistant_seed.sql
008_content_followup_engine.sql
009_raian_visual_content_seed.sql
010_raian_visual_demo_preview.sql
```

Or run `seed.sql` after `001`, then `002`–`010`.

---

## Business profile

| Field | Value |
|-------|-------|
| Company | Raian Visual |
| Phone | 0740607882 |
| Email | contact@raianvisual.ro |
| Areas | Iași, Moldova, România |
| Tone | premium, warm, direct, elegant, professional |
| Primary CTA | Verifică disponibilitatea datei |
| Brand color | `#7c3aed` |

---

## Services (9)

| Service | Slug | From |
|---------|------|------|
| Fotografie de nuntă | `wedding-photography` | 899 EUR |
| Videografie de nuntă | `wedding-videography` | 899 EUR |
| Pachet foto-video | `photo-video-package` | 1399 EUR |
| Filmare cu dronă | `drone-footage` | 150 EUR |
| Highlight film | `highlight-film` | 150 EUR |
| Album foto de nuntă | `wedding-album` | 180 EUR |
| Al doilea fotograf | `second-photographer` | 200 EUR |
| Al doilea videograf | `second-videographer` | 250 EUR |
| Preview rapid (48h) | `fast-delivery-preview` | 80 EUR |

---

## Packages (4)

| Package | Price | Logic |
|---------|-------|-------|
| **Basic** | 1399 EUR | Evenimente mai mici, buget sub ~1700 EUR |
| **Essential** | 1799 EUR | Foto+video standard — echilibrat |
| **Signature** | 2099 EUR | Recomandat — cinematic, highlight, 12h |
| **Exclusive** | 2699 EUR | Premium — echipă extinsă, evenimente mari |

---

## Lead form fields

`name` · `phone` · `email` · `wedding_date` · `city` · `venue` · `number_of_guests` · `desired_services` · `budget_range` · `priority` · `message`

**Budget options:** sub 1400 EUR · 1400-1700 EUR · 1700-2100 EUR · 2100-2700 EUR · peste 2700 EUR

**Priority options:** photo · video · highlight · album · fast delivery · price

---

## Scoring (config in `clients.settings.lead_scoring`)

| Signal | Points |
|--------|--------|
| `desired_services` = photo+video | 20 |
| Budget ≥ 1700 EUR | 12 |
| Budget ≥ 2100 EUR | +10 |
| City Iași / Moldova | 15 |
| Required fields complete | 15 |
| Form completeness | 15 |
| Wedding date within 18 months | 10 |

**Thresholds:** hot ≥ 70 · warm ≥ 40 · cold &lt; 40

**Price-focused leads:** `priority=price` + low budget + no foto+video → typically **cold** (~28 pts) without high-value rule matches.

---

## Demo leads (migration 010)

Preview in admin: `/admin/clients/{id}/leads` — filter by demo metadata.

### HOT — Maria Popescu & Andrei Ionescu

- **Score:** 97 · **Category:** hot  
- Foto+video · buget 2100–2700 EUR · Iași · 160 invitați · highlight priority  
- **Admin:** `/admin/leads/{leadId}` → Generate Offer (already has demo offer)

### WARM — Elena Dumitrescu

- **Score:** 52 · **Category:** warm  
- Video only · buget 1700–2100 EUR · Bacău  

### COLD — Alex M.

- **Score:** 28 · **Category:** cold  
- Photo only · buget sub 1400 EUR · priority price · mesaj „cel mai ieftin pachet”

Demo rows are tagged: `metadata.demo = true`.

---

## Example offer (demo)

**Title:** Ofertă Signature — Maria & Andrei  
**Package:** Signature — **2099 EUR**  
**Status:** sent (demo)  
**CTA:** Verifică disponibilitatea datei  

**Includes:**
- 12 ore acoperire foto + video  
- 450+ fotografii editate  
- Highlight film 6–7 min  
- Program 08:00–20:00  

**Delivery:** Foto 30–45 zile · Film 60–90 zile  

View in admin: `/admin/offers` (demo offer linked to hot lead).

---

## Follow-up sequence (post-offer)

| Step | Delay | Channel | Purpose |
|------|-------|---------|---------|
| 1 | 24h | email | Reminder politicos — oferta Signature |
| 2 | 72h | email | Confirmare disponibilitate dată + avans 30% |
| 3 | 7 zile | email | Reminder final elegant |

Templates also in `content_templates`: `followup_offer_24h`, `followup_offer_72h`, `followup_offer_7d`.

**Admin:** `/admin/follow-ups?client={id}` or `/admin/offers/{offerId}/followups`

MVP: status `pending_approval` — approve manually before marking sent.

---

## FAQ (assistant knowledge)

13 items covering:

- Pachete și prețuri  
- Timp de livrare  
- Proces rezervare  
- Avans 30%  
- Deplasare / travel  
- Dronă  
- 4K  
- Highlight film + lungime  
- Al doilea foto/video  
- Album  
- Număr fotografii  
- Program / ore lucrate  
- Verificare disponibilitate dată  

**Admin:** `/admin/clients/{id}/faq`

---

## Example assistant chat (demo conversation)

**Visitor:** Cât costă pachetul foto+video și în cât timp primim pozele?

**Assistant:** Pachetele foto-video: Basic — 1399 EUR, Essential — 1799 EUR, Signature — 2099 EUR, Exclusive — 2699 EUR. Livrare foto: 30–45 zile; film: 60–90 zile. Verifică disponibilitatea prin formular.

**Visitor:** Aveți dronă și al doilea fotograf?

**Assistant:** Da — dronă 150 EUR, al doilea fotograf 200 EUR. Exclusive include echipă extinsă. Vrei să verificăm disponibilitatea datei?

**Admin:** `/admin/clients/{id}/chat-conversations` (conversation tagged `demo`)

---

## Example Meta Ads text

**Primary:**
> Foto & video de nuntă premium în Iași și Moldova. Pachete de la 1399 EUR — acoperire cinematică, highlight film, echipă dedicată. Nu lăsa data să se ocupe fără tine: verifică disponibilitatea acum.

**Headline:**
> Verifică disponibilitatea datei — Raian Visual

**Admin:** `/admin/generated-content` or `content_templates` key `meta_ads_bookings`

---

## Example Instagram captions

**Portfolio:**
> Amintiri cinematice de la o nuntă plină de emoție ✨  
> Foto + video premium, editare atentă, poveste autentică a zilei voastre.  
> Planificați nunta în Iași sau Moldova? Verifică disponibilitatea datei — link în bio.  
> #nunta #fotografienunta #videografienunta #iasi #raianvisual

**Behind the scenes:**
> În spatele cadrelor 📸  
> Echipă dedicată, lumină naturală, emoții reale — așa construim amintirile voastre cinematice.  
> Pachete de la 1399 EUR · Essential & Signature recomandate pentru foto+video complet.

**Admin:** `/admin/content-generator?client={id}` or `/admin/generated-content`

---

## Embed URLs

| Widget | URL |
|--------|-----|
| Lead form | `/embed/lead-form/raian-visual` |
| Chat | `/embed/chat/raian-visual` |

```html
<script src="https://your-domain.com/widget/lead-form.js" data-client="raian-visual" async></script>
<script src="https://your-domain.com/widget/chat.js" data-client="raian-visual" async></script>
```

---

## Admin quick links

| Module | Path |
|--------|------|
| Client overview | `/admin/clients/{uuid}` |
| Leads | `/admin/clients/{uuid}/leads` |
| Lead fields | `/admin/clients/{uuid}/lead-fields` |
| Packages | `/admin/clients/{uuid}/packages` |
| Offer template | `/admin/clients/{uuid}/offer-template` |
| Assistant | `/admin/clients/{uuid}/assistant` |
| FAQ | `/admin/clients/{uuid}/faq` |
| Content settings | `/admin/clients/{uuid}/content-settings` |
| Follow-ups | `/admin/follow-ups?client={uuid}` |
| Generated content | `/admin/generated-content` |

---

## Re-running demo preview data

Migration `010_raian_visual_demo_preview.sql` is idempotent for demo rows: it deletes previous `metadata.demo = true` records before re-inserting.

Configuration migrations (`003`, `005`, `007`, `009`) can be re-run safely — they upsert or replace client-scoped config.

---

*Demo data only — safe to delete demo leads/offers in production after testing.*
