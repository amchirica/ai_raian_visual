# Deployment Guide

## Stack

- **App:** Next.js 15 on Vercel
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI API (optional)
- **CDN/DNS:** Cloudflare (recommended)

---

## 1. Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run all migrations in `supabase/migrations/` (001 → 010) via SQL Editor
3. Copy credentials:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service role / secret key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Vercel

1. Push repo to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Set environment variables (all from `.env.example`)
4. Deploy

Required env vars:

```
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
WEBHOOK_SIGNING_SECRET=
```

5. After deploy, update `NEXT_PUBLIC_APP_URL` to production URL and redeploy

Build command: `npm run build`

---

## 3. Custom Domain

### Vercel

1. Project → Settings → Domains
2. Add `admin.your-domain.com` or `app.your-domain.com`
3. Follow DNS instructions

### Cloudflare

1. Add site to Cloudflare
2. Point DNS to Vercel:
   - CNAME `app` → `cname.vercel-dns.com`
3. Enable SSL (Full)
4. Optional: Page Rules for caching static assets only (do not cache `/api/*`)

Update `NEXT_PUBLIC_APP_URL=https://app.your-domain.com`

---

## 4. Post-Deploy Checklist

- [ ] Run migrations on production Supabase
- [ ] Create first client in `/admin/clients/new`
- [ ] Test lead form embed on external page
- [ ] Test chat widget embed
- [ ] Verify OpenAI or fallback drafts work
- [ ] Configure webhooks in client settings if using n8n/Make

---

## 5. Local vs Production

| | Local | Production |
|---|-------|------------|
| URL | localhost:3000 | your-domain.com |
| Supabase | same or separate project | dedicated project |
| OpenAI | dev key | production key with billing |

**Tip:** Use a separate Supabase project for production.

---

## 6. Troubleshooting

| Issue | Fix |
|-------|-----|
| 500 on embed | Check Supabase env vars |
| Widget CORS | Verify middleware.ts is deployed |
| OpenAI 429 | Fallback drafts activate automatically |
| `.next` corruption locally | Delete `.next`, restart dev (don't run build while dev is running) |
