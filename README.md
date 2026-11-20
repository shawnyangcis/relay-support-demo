# Relay — AI support chatbot demo

A proposal demonstration for a website support chatbot. **Northstar is fictional; all six knowledge articles are sample content.** The assistant supports a live LongCat model with an optional Vercel AI Gateway configuration. Human handoff is a local preview, not a submitted ticket.

## Try it

[Open the live demo](https://relay-support-demo-inky.vercel.app).

1. Ask “How do I download an invoice?” and open the cited article.
2. Start the login scenario. Say “My reset link expired”, then “I already tried that”.
3. Ask whether a custom identity system is guaranteed to work. The sample documentation cannot confirm that.
4. Preview a human handoff and download the summary with its full transcript.

## Stack

Next.js App Router, React, TypeScript, Vercel AI SDK with an OpenAI-compatible provider, Zod, and Lucide icons. The six-article knowledge base is provided in full to the model on each turn; this deliberately avoids an unnecessary vector database for a small corpus. Model output is schema-validated. Citation passages must be exact substrings of approved articles, and handoff customer statements must occur verbatim in user messages. These checks establish provenance, not guaranteed semantic accuracy.

## Development

Node.js 22 or later.

```sh
npm ci
cp .env.example .env.local
# Set CHAT_API_KEY locally for LongCat. Never commit the key.
npm run dev
```

The deployed demo uses a dedicated LongCat key stored as a Vercel Production Secret (`CHAT_API_KEY`). `CHAT_BASE_URL` and `CHAT_MODEL` override the direct provider defaults. LongCat uses its [Responses API](https://longcat.ai/platform/docs/api/responses) with strict JSON schema output and reasoning disabled for this short support workflow. Output is also validated locally using Zod. Other compatible providers use Chat Completions with local schema validation and one bounded formatting retry. Without `CHAT_API_KEY`, the server uses AI Gateway, which requires eligible credits and either OIDC or `AI_GATEWAY_API_KEY`. Never commit credentials or `.vercel` files.

```sh
npm test
npm run typecheck
npm run build
```

## Behavior and boundaries

- Free-form questions and multi-turn troubleshooting, using actual model inference.
- Source articles and cited passages are inspectable.
- Unknown information is referred for review instead of assuming a product policy.
- Handoff includes verbatim customer evidence, a suggested next step, referenced articles, and transcript. It is never described as sent.
- Browser memory only: refresh clears the chat. Requests are sent to Vercel and the AI provider; no application database or analytics stores conversations.
- No account lookup, payments, refunds, email delivery, or ticket integration.
- Generation errors are shown honestly; there is no scripted response pretending to be live AI.
- Input limits, output limits, a 45-second model timeout, origin checking, and a best-effort per-instance rate limit keep demo use bounded. The limiter is not distributed; production needs durable limits, authentication where appropriate, and spend controls.
- User-submitted history is untrusted. No tools capable of external actions are available to the model.

## Production scope

Replace sample content with approved business sources, agree on retrieval/update workflows, add durable conversation storage and access policies, integrate the actual website and helpdesk, and evaluate against real support cases. Source matching does not prevent every hallucination or prompt injection; evaluation and human review remain necessary. The demo does not claim production readiness.

## Deployment

The repository is connected to a dedicated Vercel project. The production alias is intended for public viewing from an Upwork proposal. Pushes to the production branch deploy via Vercel Git integration.
