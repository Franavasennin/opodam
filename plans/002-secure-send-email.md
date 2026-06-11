# Plan 002: Lock down the `send-email` function (shared secret + rate limit)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d2807f4..HEAD -- netlify/functions/send-email.cjs netlify/functions/stripe-webhook.cjs`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding; on a mismatch, treat
> it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S–M
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `d2807f4`, 2026-06-11

## Why this matters

`netlify/functions/send-email.cjs` accepts `POST { tipo, to, data }` and sends
an email via SendGrid with **no authentication and no rate limiting**. Anyone
who knows the URL (`/.netlify/functions/send-email`) can send arbitrary OpoDAM-
branded emails to any address: spam, phishing that looks like it came from
OpoDAM, exhaustion of the SendGrid quota, and damage to the sending domain's
reputation. The CORS header only constrains browsers — a plain `curl` ignores
it. Every other function in this repo at least rate-limits by IP; this one has
nothing.

The only legitimate caller today is server-side: `stripe-webhook.cjs` invokes it
after a successful checkout. So we can require a shared secret that only the
server knows, and additionally rate-limit by IP as defense in depth.

## Current state

- `netlify/functions/send-email.cjs` — SendGrid sender. Handler has zero auth:

```js
exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(), body: '' }
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) }

  if (!API_KEY) return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'SENDGRID_API_KEY no configurada' }) }
  sgMail.setApiKey(API_KEY)

  let body
  try { body = JSON.parse(event.body || '{}') } catch { return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'JSON inválido' }) } }

  const { tipo, to, data = {} } = body
  // ... picks a template and sends, no auth, no rate limit ...
```

- The current (only) caller, `netlify/functions/stripe-webhook.cjs:124-136`,
  calls it server-to-server, fire-and-forget:

```js
if (session.customer_details?.email) {
  const baseUrl = process.env.URL || 'https://opodam.netlify.app'
  fetch(`${baseUrl}/.netlify/functions/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tipo: 'pago-confirmado',
      to: session.customer_details.email,
      data: { oposicion: oposicionSlug, importe: '19,90 €' },
    }),
  }).catch(e => console.warn('[stripe-webhook] send-email falló:', e?.message))
}
```

- The repo already has a rate-limit helper, `netlify/functions/_ratelimit.cjs`,
  used like this in `tutor-chat.cjs`:

```js
const { comprobarLimite } = require('./_ratelimit.cjs')
// ...
const limite = await comprobarLimite(event, { clave: 'tutor', max: 20, ventanaSeg: 60 })
if (!limite.permitido) {
  return { statusCode: 429, headers: { ...corsHeaders(event), 'Retry-After': String(limite.resetSeg) }, body: JSON.stringify({ error: 'Demasiadas peticiones, espera un momento.' }) }
}
```

`comprobarLimite(event, opts)` returns `{ permitido, restante, resetSeg }` and
fails open if Netlify Blobs is unavailable.

## Convention notes for the executor

- Netlify functions read config from `process.env`. Env vars are set in the
  Netlify dashboard (Site configuration → Environment variables), NOT in
  committed files. This plan adds a new env var `SEND_EMAIL_SECRET`; you only
  reference it in code — the human operator sets the value in Netlify and adds
  it to their local `.env.local` (untracked). **Do not invent or commit a
  secret value.**
- Comparisons of secrets should be constant-time to avoid timing leaks; Node has
  `crypto.timingSafeEqual`. Use it.

## Commands you will need

| Purpose   | Command                              | Expected on success |
|-----------|--------------------------------------|---------------------|
| Tests     | `npm run test:run`                   | all pass            |
| Lint      | `npm run lint`                       | exit 0 (note: .cjs may be outside the lint glob — see STOP) |
| Build     | `npm run build`                      | exit 0              |
| Node syntax check | `node --check netlify/functions/send-email.cjs` | exit 0 |
| Node syntax check | `node --check netlify/functions/stripe-webhook.cjs` | exit 0 |

## Scope

**In scope** (the only files you should modify):
- `netlify/functions/send-email.cjs`
- `netlify/functions/stripe-webhook.cjs` (add the secret header to its outbound call)
- `.env.example` if one exists at repo root (add `SEND_EMAIL_SECRET=` placeholder, no value)

**Out of scope** (do NOT touch):
- The four email template functions inside `send-email.cjs` — only the handler.
- Any other Netlify function.
- The SendGrid API key handling — unchanged.
- Do NOT write any real secret value anywhere.

## Git workflow

- Branch: `advisor/002-secure-send-email`.
- Conventional commit, e.g. `fix(seguridad): send-email exige secreto compartido + rate limit`.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Require a shared-secret header in the send-email handler

At the top of `send-email.cjs`, require the rate-limit helper and Node crypto:

```js
const sgMail = require('@sendgrid/mail')
const crypto = require('crypto')
const { comprobarLimite } = require('./_ratelimit.cjs')
```

Add a constant-time secret check helper near the top (after the env consts):

```js
const SEND_EMAIL_SECRET = process.env.SEND_EMAIL_SECRET

function secretoValido(event) {
  if (!SEND_EMAIL_SECRET) return false // sin secreto configurado, denegar (fail-closed)
  const provided = event.headers['x-send-email-secret'] || event.headers['X-Send-Email-Secret'] || ''
  const a = Buffer.from(String(provided))
  const b = Buffer.from(String(SEND_EMAIL_SECRET))
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
```

In the handler, immediately after the method check and before doing any work,
enforce rate limit then secret:

```js
if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) }

const limite = await comprobarLimite(event, { clave: 'send-email', max: 5, ventanaSeg: 60 })
if (!limite.permitido) {
  return { statusCode: 429, headers: { ...corsHeaders(), 'Retry-After': String(limite.resetSeg) }, body: JSON.stringify({ error: 'Demasiadas peticiones' }) }
}

if (!secretoValido(event)) {
  return { statusCode: 401, headers: corsHeaders(), body: JSON.stringify({ error: 'No autorizado' }) }
}
```

**Verify**: `node --check netlify/functions/send-email.cjs` → exit 0.

### Step 2: Add basic recipient validation

After parsing the body and reading `{ tipo, to, data }`, reject malformed
recipients before sending (defense in depth even with the secret):

```js
const { tipo, to, data = {} } = body
if (!tipo || !to) return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Faltan campos: tipo, to' }) }
if (typeof to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
  return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Destinatario inválido' }) }
}
```

**Verify**: `node --check netlify/functions/send-email.cjs` → exit 0.

### Step 3: Send the secret header from the only legitimate caller

In `stripe-webhook.cjs`, add the secret header to the outbound `fetch` to
send-email:

```js
fetch(`${baseUrl}/.netlify/functions/send-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Send-Email-Secret': process.env.SEND_EMAIL_SECRET || '',
  },
  body: JSON.stringify({ /* unchanged */ }),
}).catch(e => console.warn('[stripe-webhook] send-email falló:', e?.message))
```

**Verify**: `node --check netlify/functions/stripe-webhook.cjs` → exit 0, and
`grep -n "X-Send-Email-Secret" netlify/functions/stripe-webhook.cjs` → one match.

### Step 4: Add an `.env.example` placeholder (only if that file exists)

If `.env.example` exists at the repo root, add a line `SEND_EMAIL_SECRET=`
(empty — no value). If it does not exist, skip this step (do not create one
unless the repo already uses that convention).

**Verify**: if applicable, `grep -n "SEND_EMAIL_SECRET" .env.example` → one match.

### Step 5: Full build + tests

**Verify**:
- `npm run test:run` → all pass.
- `npm run build` → exit 0.

## Test plan

There is no existing test harness for `.cjs` Netlify functions in this repo
(they are excluded from Vitest). Writing one is out of scope for this plan.
Instead, verify behavior with the syntax checks above plus this manual matrix,
documented in the PR description:

1. `curl -X POST <site>/.netlify/functions/send-email -H 'Content-Type: application/json' -d '{"tipo":"bienvenida","to":"x@x.com","data":{}}'` **without** the secret header → expect HTTP 401.
2. Same call **with** `-H 'X-Send-Email-Secret: <value>'` (the value the operator set) → expect HTTP 200 and an email delivered.
3. Rapidly repeat call (1) > 5 times in a minute → expect HTTP 429 on the 6th.
4. A real Stripe test checkout still triggers the confirmation email (the webhook now sends the secret).

If the operator has not yet set `SEND_EMAIL_SECRET` in Netlify, note in the PR
that the function will return 401 for ALL callers (including the webhook) until
the env var is configured in both the Netlify dashboard and as a webhook-visible
variable — this is the intended fail-closed behavior.

## Done criteria

ALL must hold:

- [ ] `node --check netlify/functions/send-email.cjs` exits 0
- [ ] `node --check netlify/functions/stripe-webhook.cjs` exits 0
- [ ] `npm run test:run` exits 0
- [ ] `npm run build` exits 0
- [ ] `grep -n "secretoValido" netlify/functions/send-email.cjs` returns matches (helper present and called)
- [ ] `grep -n "comprobarLimite" netlify/functions/send-email.cjs` returns a match
- [ ] `grep -n "X-Send-Email-Secret" netlify/functions/stripe-webhook.cjs` returns a match
- [ ] No real secret value appears in any committed file (`git diff` shows only `process.env.SEND_EMAIL_SECRET` references and an empty `.env.example` placeholder)
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row for 002 updated to DONE, with a note to the operator: "set SEND_EMAIL_SECRET in Netlify env vars (and ensure it is exposed to the stripe-webhook function)"

## STOP conditions

Stop and report back (do not improvise) if:

- `send-email.cjs` or `stripe-webhook.cjs` does not match the "Current state"
  excerpts (drift).
- `npm run lint` errors on the `.cjs` changes because the function files are
  outside the ESLint glob and adding them pulls in unrelated lint failures —
  in that case skip lint for these `.cjs` files, note it, and rely on
  `node --check`.
- You find another caller of `/send-email` besides `stripe-webhook.cjs`
  (search: `grep -rn "send-email" src netlify api`). If a client-side (browser)
  caller exists, STOP — a browser cannot safely hold the shared secret, and the
  design must change (e.g. that caller routes through an authenticated function
  instead). Report it.
- Any verification fails twice after a reasonable fix attempt.

## Maintenance notes

- If a new legitimate caller of `send-email` is added, it must run server-side
  and send the `X-Send-Email-Secret` header. Never call this function from the
  browser — the secret would be exposed.
- Rotating `SEND_EMAIL_SECRET` requires updating the Netlify env var only; no
  code change.
- A reviewer should confirm: fail-closed when the env var is unset, constant-time
  comparison, and that no secret value was committed.
- Deferred: a proper `.cjs` function test harness would let this be covered by
  automated tests (tracked as a separate deferred finding in `plans/README.md`).
