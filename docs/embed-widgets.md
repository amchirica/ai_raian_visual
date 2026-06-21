# Embed Widgets Guide

Embed lead form and chat assistant on any external website. All widgets are scoped by **client slug** — no hardcoded business logic.

Replace `your-domain.com` and `CLIENT_SLUG` with your values.

---

## Lead form

### Script embed (recommended)

```html
<script
  src="https://your-domain.com/widget/lead-form.js"
  data-client="CLIENT_SLUG"
  async
></script>
```

Query param variant:

```html
<script src="https://your-domain.com/widget/lead-form.js?client=CLIENT_SLUG" async></script>
```

### Iframe

```html
<iframe
  src="https://your-domain.com/embed/lead-form/CLIENT_SLUG"
  width="100%"
  height="700"
  frameborder="0"
  style="border:0;border-radius:12px;"
  title="Contact form"
></iframe>
```

---

## Chat assistant

### Script embed (floating bubble)

```html
<script
  src="https://your-domain.com/widget/chat.js"
  data-client="CLIENT_SLUG"
  async
></script>
```

### Iframe

```html
<iframe
  src="https://your-domain.com/embed/chat/CLIENT_SLUG"
  width="400"
  height="560"
  frameborder="0"
  style="border:0;border-radius:16px;"
  title="Chat assistant"
></iframe>
```

---

## Raian Visual example

```html
<script src="https://your-domain.com/widget/lead-form.js" data-client="raian-visual" async></script>
<script src="https://your-domain.com/widget/chat.js" data-client="raian-visual" async></script>
```

---

## Prerequisites

Before embedding:

1. Client is **active** in admin
2. Lead fields configured: `/admin/clients/{id}/lead-fields`
3. Assistant + FAQ (for chat): `/admin/clients/{id}/assistant`
4. `NEXT_PUBLIC_APP_URL` set to production domain

Configure widget titles/colors: `/admin/clients/{id}/widget-settings`

---

## Error states

| Issue | Cause | Fix |
|-------|-------|-----|
| Blank widget | Wrong slug | Verify slug on client overview |
| 404 | Client inactive or missing | Activate client |
| CORS error | Wrong domain | Use HTTPS production URL |
| Missing `data-client` | Script without slug | Add `data-client="slug"` |

Script widgets inject an isolated iframe — they do not inherit host site CSS.

---

## Mobile

Both widgets are responsive inside their iframe. Test at 375px width before go-live.

---

## Legacy paths

- `/embed/{slug}/lead-form`
- `/embed/{slug}/chat`

Still supported for backward compatibility.

See also [EMBEDDING.md](EMBEDDING.md) and [demo-raianvisual.md](demo-raianvisual.md).
