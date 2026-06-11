# Plan 004: Move the hardcoded beta-tester emails out of source into an env var

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d2807f4..HEAD -- netlify/functions/stripe-checkout.cjs`
> If the file changed since this plan was written, compare the "Current state"
> excerpt against the live code; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `d2807f4`, 2026-06-11

## Why this matters

`netlify/functions/stripe-checkout.cjs` hardcodes two real personal Gmail
addresses in a `betaTesters` array. These accounts get a 10-year free
subscription and `rol: 'beta'`. Two problems: (1) the addresses are personal
data committed to git history forever; (2) you cannot add or remove a beta
tester without editing code and redeploying. Moving the list to an environment
variable fixes both — testers become config, not code, and the addresses leave
the source tree.

Note on git history: removing the emails from the current file does NOT remove
them from past commits. History rewriting is out of scope here (risky, and the
repo is private per the Netlify "private repo" build error seen earlier). This
plan stops the bleeding (no new commits contain the emails) and makes the list
configurable; history scrubbing is a separate operator decision noted at the end.

## Current state

- `netlify/functions/stripe-checkout.cjs` — beta bypass block (around lines 96-118):

```js
  // --- Bypass para beta testers ---
  const betaTesters = ['itsdamaaa.19@gmail.com', 'esterlcorreas@gmail.com']
  if (usuario.email && betaTesters.includes(usuario.email.toLowerCase())) {
    try {
      const db = supabaseAdmin()
      if (db) {
        await db.query('oposicion_subscriptions', 'UPSERT', '', {
          user_id: usuario.id,
          oposicion_slug,
          status: 'active',
          current_period_end: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10).toISOString(),
          updated_at: new Date().toISOString(),
        })
        await db.query('profiles', 'PATCH', `id=eq.${usuario.id}`, { rol: 'beta' })
      }
      return {
        statusCode: 200,
        headers: corsHeaders(event),
        body: JSON.stringify({ url: `${origin}/oposicion/${oposicion_slug}?checkout=success` })
      }
    } catch (error) {
      console.error('[stripe-checkout bypass error]', error)
    }
  }
```

- Env var convention: Netlify functions read `process.env.*`; values are set in
  the Netlify dashboard, never committed. The current value of the new var will
  be the two existing emails, comma-separated — the operator sets it in Netlify.

## Commands you will need

| Purpose   | Command                                          | Expected |
|-----------|--------------------------------------------------|----------|
| Node syntax check | `node --check netlify/functions/stripe-checkout.cjs` | exit 0 |
| Tests     | `npm run test:run`                               | all pass |
| Build     | `npm run build`                                  | exit 0   |
| Grep      | `grep -n "@gmail.com" netlify/functions/stripe-checkout.cjs` | no matches |

## Scope

**In scope** (the only files you should modify):
- `netlify/functions/stripe-checkout.cjs`
- `.env.example` if it exists at repo root (add `BETA_TESTERS=` placeholder, empty)

**Out of scope** (do NOT touch):
- The subscription upsert / `rol: 'beta'` logic — behavior must stay identical
  for the matched testers.
- Any other function.
- Git history rewriting — explicitly deferred (see Maintenance notes).
- Do NOT put the real email addresses in `.env.example` or any committed file.

## Git workflow

- Branch: `advisor/004-beta-testers-env`.
- Conventional commit, e.g. `refactor(seguridad): lista de beta testers desde env var (fuera del código)`.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Read the beta-tester list from an env var

Replace the hardcoded array with a parsed env var. Change:

```js
  const betaTesters = ['itsdamaaa.19@gmail.com', 'esterlcorreas@gmail.com']
  if (usuario.email && betaTesters.includes(usuario.email.toLowerCase())) {
```

to:

```js
  const betaTesters = (process.env.BETA_TESTERS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  if (usuario.email && betaTesters.includes(usuario.email.toLowerCase())) {
```

Everything inside the `if` block stays exactly as-is.

**Verify**:
- `node --check netlify/functions/stripe-checkout.cjs` → exit 0.
- `grep -n "@gmail.com" netlify/functions/stripe-checkout.cjs` → no matches.
- `grep -n "process.env.BETA_TESTERS" netlify/functions/stripe-checkout.cjs` → one match.

### Step 2: Add `.env.example` placeholder (only if that file exists)

If `.env.example` exists, add `BETA_TESTERS=` (empty, no addresses). If it does
not exist, skip — do not create it.

**Verify**: if applicable, `grep -n "BETA_TESTERS" .env.example` → one match, with no email after the `=`.

### Step 3: Build + tests

**Verify**:
- `npm run test:run` → all pass.
- `npm run build` → exit 0.

## Test plan

No `.cjs` test harness exists in this repo (out of scope to add). Verify via:
- The `grep` and `node --check` gates above.
- Manual, after the operator sets `BETA_TESTERS` in Netlify to the two existing
  emails (comma-separated): a beta-tester account hitting checkout still gets
  bypass access (HTTP 200 + active subscription); a non-beta account still goes
  to the real Stripe flow. Document this in the PR.

## Done criteria

ALL must hold:

- [ ] `node --check netlify/functions/stripe-checkout.cjs` exits 0
- [ ] `grep -n "@gmail.com" netlify/functions/stripe-checkout.cjs` → no matches
- [ ] `grep -n "process.env.BETA_TESTERS" netlify/functions/stripe-checkout.cjs` → one match
- [ ] `npm run test:run` exits 0
- [ ] `npm run build` exits 0
- [ ] No email addresses in any committed file in this diff (`git diff`)
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` row 004 → DONE, with operator note: "set BETA_TESTERS in Netlify env vars to the comma-separated tester emails (currently itsdamaaa.19@gmail.com, esterlcorreas@gmail.com) BEFORE deploying, or beta access breaks"

## STOP conditions

Stop and report back (do not improvise) if:

- The beta-bypass block does not match the "Current state" excerpt (drift) —
  in particular if the matching logic or the upsert changed.
- You cannot find `BETA_TESTERS` referenced after your edit (the replacement
  didn't land).
- Any verification fails twice after a reasonable fix attempt.

## Maintenance notes

- **Operator action required before deploy**: set `BETA_TESTERS` in Netlify
  (Site configuration → Environment variables) to the comma-separated list. If
  unset, the bypass simply never matches (fail-closed) and those testers fall
  back to paying — safe, but they lose free access until it's configured.
- **Deferred — git history scrubbing**: the two emails remain in past commits.
  If the operator wants them purged, that's a separate task (`git filter-repo`
  or BFG + force-push + re-clone for all collaborators) and should be weighed
  against the breakage of rewriting shared history. Not done here.
- Future: consider a per-tester expiry or an admin-managed allowlist table
  instead of an env var if the tester list grows.
