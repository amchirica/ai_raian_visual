# MVP QA Checklist

Manual test cases for release verification. Check each box before go-live.

---

## Environment

- [ ] `.env.local` has Supabase URL + service role key
- [ ] `NEXT_PUBLIC_APP_URL` matches dev/prod URL
- [ ] Migrations 001–010 applied in Supabase
- [ ] `npm run build` succeeds

---

## 1. Creating a client

- [ ] `/admin/clients` lists clients
- [ ] **New Client** form creates client with slug
- [ ] Client overview shows stats and shortcuts
- [ ] `/admin/clients/[id]/profile` saves business profile
- [ ] Active/inactive toggle works

---

## 2. Configuring packages

- [ ] `/admin/clients/[id]/services` — add/edit/delete service
- [ ] `/admin/clients/[id]/packages` — add package
- [ ] Add extra (name, slug, price)
- [ ] Add pricing rule (simple builder)
- [ ] `/admin/clients/[id]/offer-template` saves template

---

## 3. Configuring lead fields

- [ ] `/admin/clients/[id]/lead-fields` — add field
- [ ] Toggle required / active
- [ ] Delete field (with confirm)
- [ ] Preview `/embed/lead-form/[slug]` shows fields

---

## 4. Submitting public lead form

- [ ] Embed form loads without errors
- [ ] Submit with valid data → success message
- [ ] Invalid email → validation error
- [ ] Lead appears in `/admin/leads`

---

## 5. Viewing lead in admin

- [ ] Lead detail shows score + category + breakdown
- [ ] Change status (new → qualified → won/lost)
- [ ] Recommended action displayed

---

## 6. Generating offer

- [ ] **Generate Offer** from lead detail
- [ ] Package auto-recommended (if rules match)
- [ ] Select extras optional
- [ ] Generate succeeds with or without OpenAI

---

## 7. Previewing offer

- [ ] HTML preview renders
- [ ] PDF download works (or HTML print fallback)
- [ ] Prices match package DB values

---

## 8. Creating follow-ups

- [ ] Mark offer **sent** → follow-ups appear
- [ ] Manual **24h + 72h + 7-day** sequence creates 3 items
- [ ] **Generate AI text** fills body (or fallback)
- [ ] **Edit** saves changes
- [ ] **Copy** puts text on clipboard

---

## 9. Generating content

- [ ] `/admin/content-generator` — select client + type
- [ ] Generate with context → draft saved
- [ ] Without OpenAI → fallback notice + draft
- [ ] `/admin/generated-content/[id]` — edit, approve, copy

---

## 10. Testing chat widget

- [ ] `/embed/chat/[slug]` loads greeting
- [ ] FAQ question → correct answer from DB
- [ ] Unknown question → fallback message
- [ ] No invented prices

---

## 11. Creating lead from chat

- [ ] Lead capture prompt appears when appropriate
- [ ] Submit contact details → lead in admin
- [ ] Conversation visible in `/admin/clients/[id]/chat-conversations`

---

## 12. Testing widget embed scripts

- [ ] `lead-form.js` with `data-client` injects iframe
- [ ] `chat.js` with `data-client` shows bubble
- [ ] Missing slug → clear error (not crash)
- [ ] Mobile width acceptable

---

## 13. Raian Visual demo flow

- [ ] Demo client exists (`raian-visual`)
- [ ] 3 demo leads (hot/warm/cold) if migration 010 applied
- [ ] Demo offer + follow-ups visible
- [ ] Full flow per [demo-raianvisual.md](demo-raianvisual.md)

---

## 14. Missing OpenAI key fallback

- [ ] Content generator saves fallback draft
- [ ] Follow-up generate uses template text
- [ ] Offer generation still works (no AI copy or graceful skip)
- [ ] Chat uses FAQ matching (no crash)

---

## 15. Missing clientSlug error

- [ ] `/embed/lead-form/invalid-slug` → 404 or error state
- [ ] Widget script without `data-client` → console warning, no crash

---

## Widget settings

- [ ] `/admin/clients/[id]/widget-settings` saves title/color
- [ ] Lead form reflects updated primary color

---

## Navigation

- [ ] All sidebar links work: Dashboard, Clients, Leads, Offers, Assistant, Content, Follow-ups, Settings
- [ ] No 404 from client overview shortcuts

---

**Sign-off:** _______________ **Date:** _______________
