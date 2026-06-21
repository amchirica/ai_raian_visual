# MVP Stabilization Report

**Date:** June 2025  
**Status after stabilization:** Build ✅ · Typecheck ✅ · Core flows connected

---

## 1. Folder structure summary

```
app/
  admin/              # Internal admin UI (dashboard, clients, leads, offers, content, follow-ups)
  api/                # REST API (public widgets + admin + webhooks)
  embed/              # iframe embed pages (lead-form, chat)
  widget/             # JS loader scripts
components/
  admin/              # Admin forms, lists, managers
  embed/              # Public widget UI
  ui/                 # Shared UI primitives
lib/
  services/           # Business logic (client-scoped)
  scoring/            # Lead scoring engine
  offers/             # Offer generation
  assistant/          # Chat knowledge + prompts
  content/            # Content generation + fallbacks
  supabase/           # DB clients
supabase/
  migrations/         # Schema 001–010 + Raian Visual seeds
docs/                 # Platform, module, QA, embed guides
types/                # TypeScript domain types
```

**Architecture:** Modular monolith — all modules share `client_id` / `clientSlug`. No Raian Visual logic in core code.

---

## 2. Broken or incomplete pages (before → after)

| Page | Before | After |
|------|--------|-------|
| `/admin/clients/[id]/profile` | Missing (profile on overview only) | ✅ Dedicated page |
| `/admin/clients/[id]/services` | Missing | ✅ Services CRUD UI |
| `/admin/clients/[id]/widget-settings` | Missing | ✅ Widget config UI |
| `/admin/content` | Missing | ✅ Content hub |
| `/admin/generated-content/[contentId]` | Missing | ✅ Detail + edit |
| `/admin/chat-conversations/[id]` | Missing at top level | ✅ Redirects to client conversation |
| Packages extras/rules UI | Read-only | ✅ Add forms |

---

## 3. Broken or incomplete buttons/actions (fixed)

| Action | Fix |
|--------|-----|
| Add package extra | Form + API `type: "extra"` |
| Add pricing rule | Simple rule builder |
| Follow-up copy | Copy-to-clipboard button |
| Follow-up edit | Inline edit + PATCH `/api/followups/[id]` |
| View generated content | Link to detail page |
| Services CRUD | Full admin UI |

No dead buttons (`href="#"`, empty onClick, console.log-only) found in admin/embed components.

---

## 4. API routes — frontend vs backend

### Added REST wrappers (spec compliance)

| Route | Purpose |
|-------|---------|
| `GET /api/leads?client_id=` | List leads |
| `GET/PATCH /api/leads/[leadId]` | Lead detail/update |
| `GET /api/offers?client_id=` | List offers |
| `GET /api/followups` | List scheduled follow-ups |
| `PATCH /api/followups/[followupId]` | Edit / approve / mark sent |
| `GET /api/content` | List generated content |
| `GET/PATCH /api/content/[contentId]` | Content detail/update |
| `GET/POST/PATCH/DELETE /api/admin/clients/[id]/services` | Services CRUD |
| `GET/PUT /api/admin/clients/[id]/widget-settings` | Widget settings |

### Existing (unchanged, working)

- Lead POST `/api/leads`, form config, admin lead PATCH
- Offer generate, PDF, mark-sent
- Follow-up create-sequence, generate-message, mark-sent
- Content generate, save
- Assistant chat, create-lead, FAQ CRUD

**Note:** Admin list pages still use server-side services (faster SSR). REST routes added for API consistency and external integrations.

---

## 5. Database tables vs code

All required tables exist in migrations 001–010:

| Table | Status |
|-------|--------|
| clients, business_profiles | ✅ |
| services, packages, package_features, package_extras, pricing_rules | ✅ |
| lead_fields, leads | ✅ |
| offers, offer_items | ✅ |
| followup_sequences, followup_messages, scheduled_followups | ✅ |
| faq_items, assistant_settings, chat_conversations, chat_messages | ✅ |
| content_settings, content_templates, generated_content | ✅ |
| widget_settings, activity_logs, api_keys | ✅ |

**`webhooks` table:** Not used — webhooks stored in `clients.settings` + `lib/webhooks/dispatcher.ts`. No migration needed for MVP.

---

## 6. SQL fields vs code expectations

All extended columns present:

- `leads`: `score_category`, `score_explanation`, `recommended_action` (002)
- `offers`: `email_body`, `text_summary`, `delivery_terms`, etc. (004)
- `followup_sequences`: `lead_id`, `offer_id`, `require_approval` (008)
- `scheduled_followups` table (008)

No new migration required.

---

## 7. Duplicate or conflicting components

- No duplicate managers found
- Profile form shared: overview + `/profile` page (intentional)
- Content hub vs generator: hub links to both generator and library

---

## 8. Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_APP_URL` | Yes | Embed URLs, widgets |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Database |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server admin client |
| `OPENAI_API_KEY` | Optional | Fallbacks when missing |
| `OPENAI_MODEL` | Optional | Default gpt-4o-mini |
| `WEBHOOK_SIGNING_SECRET` | Optional | Outbound webhooks |
| `LEAD_EMAIL_WEBHOOK_URL` | Optional | Email notifications |

---

## 9. Build / type status

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ Pass |
| `npm run build` | ✅ Pass |
| ESLint | ⚠️ 3 minor unused-var warnings (non-blocking) |

---

## 10. Repair plan (executed)

### Phase 1 — Audit ✅
This document + QA checklist.

### Phase 2 — Build/TS ✅
Build and typecheck pass.

### Phase 3 — Database ✅
Schema verified; no new migration needed.

### Phase 4 — Admin nav ✅
All 8 sidebar links resolve. Content hub added.

### Phase 5 — Client management ✅
Profile, services, widget-settings pages + APIs.

### Phase 6 — Lead engine ✅
End-to-end flow verified in code paths.

### Phase 7 — Offers ✅
Generate, preview, PDF, mark-sent wired.

### Phase 8 — Follow-ups ✅
Sequence creation, edit, copy, approve, mark sent.

### Phase 9 — Content ✅
Generator, library, detail page, fallbacks.

### Phase 10 — Assistant ✅
FAQ, settings, chat embed, conversations.

### Phase 11 — Widgets ✅
Embed docs at `docs/embed-widgets.md`.

### Phase 12 — Demo seed ✅
Raian Visual migrations 003–010 + `docs/demo-raianvisual.md`.

### Phase 13 — Button audit ✅
No dead buttons; packages/follow-ups enhanced.

### Phase 14 — UX ✅
Loading, error, success, empty states on new forms.

---

## Post-MVP (not in scope)

- Auth / multi-user admin login
- Automatic email/WhatsApp sending
- SaaS billing
- Public client portals
- Package feature UI (API exists)
- Lead field drag-reorder
- Dedicated `webhooks` table
- Global chat conversations list page

---

## How to run

```bash
npm install
# Configure .env.local from .env.example
# Run Supabase migrations 001–010
npm run dev
```

Open `http://localhost:3000/admin`

## Demo test

See [demo-raianvisual.md](demo-raianvisual.md) and [mvp-qa-checklist.md](mvp-qa-checklist.md).
