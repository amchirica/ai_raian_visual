# Embedding Guide

Embed widgets on any external website. All widgets are scoped by client slug.

Replace `your-domain.com` and `CLIENT_SLUG` with your values.

## Lead Form Widget

### Iframe

```html
<iframe
  src="https://your-domain.com/embed/lead-form/CLIENT_SLUG"
  width="100%"
  height="700"
  frameborder="0"
  style="border:0;border-radius:12px;"
></iframe>
```

### Script embed

```html
<script
  src="https://your-domain.com/widget/lead-form.js?client=CLIENT_SLUG"
  async
></script>
```

Or with `data-client`:

```html
<script
  src="https://your-domain.com/widget/lead-form.js"
  data-client="CLIENT_SLUG"
  async
></script>
```

Legacy path: `/embed/CLIENT_SLUG/lead-form`

---

## AI Chat Assistant Widget

### Iframe

```html
<iframe
  src="https://your-domain.com/embed/chat/CLIENT_SLUG"
  width="400"
  height="560"
  frameborder="0"
  style="border:0;border-radius:16px;"
></iframe>
```

### Script embed (floating)

```html
<script
  src="https://your-domain.com/widget/chat.js?client=CLIENT_SLUG"
  async
></script>
```

Or:

```html
<script
  src="https://your-domain.com/widget/chat.js"
  data-client="CLIENT_SLUG"
  async
></script>
```

Legacy path: `/embed/CLIENT_SLUG/chat`

---

## CORS

`middleware.ts` adds CORS headers for widget paths, embed pages, and public API routes so external sites can load iframes and call APIs.

---

## Prerequisites

Before embedding, configure the client in admin:

1. **Lead fields** — `/admin/clients/[id]/lead-fields`
2. **Packages** — for offer-related flows
3. **Assistant** — `/admin/clients/[id]/assistant` + FAQ
4. Set `NEXT_PUBLIC_APP_URL` to your production domain

---

## Raian Visual Example

```html
<script src="https://your-domain.com/widget/lead-form.js" data-client="raian-visual" async></script>
<script src="https://your-domain.com/widget/chat.js" data-client="raian-visual" async></script>
```
