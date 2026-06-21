# AI Assistant Chat Widget

Configurable virtual assistant embeddable on any website. Answers only from approved client data (business profile, services, packages, FAQ, offer rules).

## Features

- Embeddable via iframe or JavaScript script
- Client-specific knowledge base from database
- Safe AI behavior (no invented prices, no regulated advice)
- Conversation persistence
- Lead capture from chat
- Handoff-to-human detection
- Admin configuration and conversation review

## Database

Run migrations in order:

```
006_assistant_chat.sql
007_raian_visual_assistant_seed.sql  (demo data)
```

Tables:

| Table | Purpose |
|-------|---------|
| `assistant_settings` | Per-client assistant config |
| `faq_items` | Approved FAQ knowledge |
| `chat_conversations` | Conversation sessions |
| `chat_messages` | Individual messages |
| `leads` | Leads created from chat |

## Embed Options

### Iframe

```html
<iframe
  src="https://your-domain.com/embed/chat/raian-visual"
  width="400"
  height="560"
  frameborder="0"
  style="border:0;border-radius:16px;"
></iframe>
```

### Script widget (floating)

```html
<script
  src="https://your-domain.com/widget/chat.js?client=raian-visual"
  async
></script>
```

Or with `data-client`:

```html
<script
  src="https://your-domain.com/widget/chat.js"
  data-client="raian-visual"
  async
></script>
```

Legacy path also works: `/embed/raian-visual/chat`

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/assistant/[clientSlug]/config` | Public widget config |
| POST | `/api/assistant/chat` | Send message, get reply |
| POST | `/api/assistant/create-lead` | Create lead from conversation |
| GET | `/api/admin/clients/[id]/assistant` | Admin: get settings |
| PUT | `/api/admin/clients/[id]/assistant` | Admin: update settings |
| GET/POST/DELETE | `/api/admin/clients/[id]/faq` | Admin: FAQ CRUD |
| GET | `/api/admin/clients/[id]/chat-conversations` | List conversations |
| PATCH | `/api/admin/chat-conversations/[conversationId]` | Resolve conversation |

### Chat request

```json
POST /api/assistant/chat
{
  "client_slug": "raian-visual",
  "message": "Ce pachete aveți?",
  "conversation_id": "optional-uuid",
  "history": [{ "role": "user", "content": "..." }]
}
```

### Create lead from chat

```json
POST /api/assistant/create-lead
{
  "client_slug": "raian-visual",
  "conversation_id": "uuid",
  "name": "Maria",
  "email": "maria@example.com",
  "phone": "+40..."
}
```

## Admin Pages

- `/admin/clients/[clientId]/assistant` — enable/disable, greeting, fallback, tone, lead capture
- `/admin/clients/[clientId]/faq` — FAQ editor
- `/admin/clients/[clientId]/chat-conversations` — view and resolve conversations

## AI Safety Rules

The assistant:

- Answers only from `APPROVED_DATA` JSON built from database
- Does not invent prices, availability, or policies
- Does not provide legal, medical, or financial advice
- Identifies as virtual assistant when asked
- Uses fallback message when uncertain
- Suggests lead capture or human handoff when appropriate

## Environment

Requires `OPENAI_API_KEY` for AI replies. Without it, fallback messages are used.

```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Raian Visual Demo

After running seed `007_raian_visual_assistant_seed.sql`:

- Preview: http://localhost:3000/embed/chat/raian-visual
- Admin: http://localhost:3000/admin/clients → Raian Visual → Assistant

The assistant answers about wedding packages, prices, delivery, areas, extras (drone, second photographer, 4K), and booking — all from seeded FAQ and package data.
