# Plan 003: Verify (and if needed enable) Row-Level Security on the `progreso` table

> **Executor instructions**: This is primarily an INVESTIGATION plan. Follow it
> step by step. The outcome may be "already secure — no change needed" (a valid
> DONE) or "RLS was missing — added a migration". Do not guess: gather the
> evidence the steps ask for. If anything in "STOP conditions" occurs, stop and
> report. When done, update the status row in `plans/README.md` with the
> outcome and evidence.
>
> **Drift check (run first)**: `git diff --stat d2807f4..HEAD -- supabase/ docs/sql/`
> If migrations changed since this plan was written, re-read them before acting.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `d2807f4`, 2026-06-11

## Why this matters

The `progreso` table stores each user's study progress (test scores,
flashcard scheduling, exam history) keyed by `user_id` + `slug`. The client
reads and writes it directly with the Supabase **anon** key
(`src/services/supabase.ts:56-79`), so the ONLY thing preventing user A from
reading or overwriting user B's progress is Postgres Row-Level Security (RLS)
plus per-user policies. If RLS is not enabled on `progreso`, any authenticated
(or anonymous) user can read and modify everyone's data — cheating, data theft,
sabotage.

The concern is concrete: **there is no committed migration that creates the
`progreso` table or enables RLS on it.** The only related migration
(`2026-06-01-progreso-por-slug.sql`) merely adds a `slug` column and *assumes*
policies already exist ("RLS: las políticas por user_id siguen valiendo"). The
table was likely created by hand in the Supabase UI. We must verify the live
state and, if RLS/policies are missing, add an idempotent migration that
matches the pattern used by the other tables.

## Current state

- `src/services/supabase.ts:56-79` — client reads/writes `progreso` with the anon key:

```ts
export async function cargarProgresoRemoto(slug: string): Promise<Progreso | null> {
  // ...
  const { data } = await supabase
    .from('progreso')
    .select('data')
    .eq('user_id', user.id)
    .eq('slug', slug)
    .single()
  return (data?.data as Progreso) ?? null
}

export async function guardarProgresoRemoto(slug: string, progreso: Progreso): Promise<void> {
  // ...
  await supabase.from('progreso').upsert({
    user_id:    user.id,
    slug,
    data:       progreso,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,slug' })
}
```

- `supabase/migrations/2026-06-01-progreso-por-slug.sql` — the ONLY migration
  touching `progreso`; it does NOT enable RLS or create policies:

```sql
alter table public.progreso add column if not exists slug text not null default 'cgpc';
alter table public.progreso drop constraint if exists progreso_pkey;
create unique index if not exists progreso_user_slug_uq on public.progreso (user_id, slug);
-- RLS: las políticas por user_id siguen valiendo (slug no cambia la pertenencia).
```

- The repo's established RLS pattern, from
  `supabase/migrations/20260505_profiles.sql` (use this as the exemplar):

```sql
alter table profiles enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'Usuario puede ver su perfil'
  ) then
    create policy "Usuario puede ver su perfil"
      on profiles for select using (auth.uid() = id);
  end if;
end $$;
-- ... similar do-blocks for insert (with check) and update (using) ...
```

  Note: `profiles` keys on `id`; `progreso` keys on `user_id`, so policies must
  use `auth.uid() = user_id`.

## Step 0 — How to inspect the live database

You need read access to the project's Supabase instance. Two options; use
whichever is available, and if neither is, this becomes operator-assisted (see
STOP conditions):

- **Supabase SQL Editor** (browser): the operator runs the diagnostic query
  below and pastes the result back.
- **`psql` / Supabase CLI** with the project connection string from the
  operator. The repo lists `supabase` CLI in devDependencies.

Do NOT hard-code or echo any database password or service-role key. Reference
credentials by name only.

## Steps

### Step 1: Diagnose the live RLS state

Run this read-only query against the live database (or have the operator run it
in the Supabase SQL Editor):

```sql
-- Is RLS enabled on progreso?
select relname, relrowsecurity
from pg_class
where relname = 'progreso';

-- What policies exist on progreso?
select policyname, cmd, qual, with_check
from pg_policies
where tablename = 'progreso';
```

Interpretation:
- `relrowsecurity = true` AND policies exist for select/insert/update scoped to
  `auth.uid() = user_id` → **already secure**. Go to Step 4 (record DONE, no
  code change).
- `relrowsecurity = false` OR no per-user policies → **insecure**. Go to Step 2.

**Verify**: you have captured the query output (paste it into the PR / status note).

### Step 2: Write an idempotent RLS migration (only if Step 1 showed it's missing)

Create `supabase/migrations/2026-06-11-progreso-rls.sql`, matching the repo's
existing idempotent style (guarded `do $$` blocks so re-running is safe):

```sql
-- Habilita RLS y políticas por usuario en la tabla `progreso`.
-- Idempotente: seguro de re-ejecutar. Ejecutar en Supabase SQL Editor.

alter table public.progreso enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'progreso' and policyname = 'Usuario ve su progreso') then
    create policy "Usuario ve su progreso"
      on public.progreso for select using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'progreso' and policyname = 'Usuario crea su progreso') then
    create policy "Usuario crea su progreso"
      on public.progreso for insert with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'progreso' and policyname = 'Usuario actualiza su progreso') then
    create policy "Usuario actualiza su progreso"
      on public.progreso for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
```

**Verify**: file exists; `grep -n "enable row level security" supabase/migrations/2026-06-11-progreso-rls.sql` → one match.

### Step 3: Apply the migration

The operator applies it (Supabase SQL Editor paste, or `supabase db push` if the
CLI is wired to this project). Then re-run the Step 1 diagnostic query and
confirm `relrowsecurity = true` and the three policies now exist.

**Verify**: the re-run diagnostic shows RLS enabled + 3 policies.

### Step 4: Functional smoke test (both outcomes)

Confirm the app still works for the legitimate path (a user reading/writing
their OWN progress):
- Log in, study something that writes progress, reload, confirm progress
  persisted (this exercises `guardarProgresoRemoto` / `cargarProgresoRemoto`
  under RLS).

Optionally (strong verification) confirm isolation: with two accounts, account
A cannot select account B's row. This requires two test users; if not available,
note it as not-verified rather than claiming it.

**Verify**: own-progress read/write still works end to end.

## Done criteria

ALL must hold (the applicable branch):

- [ ] Step 1 diagnostic output captured and recorded in the PR / status note.
- [ ] If RLS was already on: `plans/README.md` row 003 → DONE with note "verified: RLS already enabled, policies present" + the query output.
- [ ] If RLS was missing: `supabase/migrations/2026-06-11-progreso-rls.sql` created, applied, and the re-run diagnostic confirms RLS=on + 3 per-user policies.
- [ ] Own-progress read/write smoke test passes.
- [ ] No credentials/secrets written to any file.
- [ ] `plans/README.md` status row for 003 updated.

## STOP conditions

Stop and report back (do not improvise) if:

- You cannot obtain any read access to the live database and the operator is not
  available to run the diagnostic — report that this needs operator action and
  provide them the Step 1 query.
- The diagnostic shows RLS enabled but with a policy that is NOT scoped to
  `auth.uid() = user_id` (e.g. a permissive `using (true)` policy) — report the
  exact policy; widening/altering an existing policy is riskier than this plan
  covers.
- The `progreso` table does not exist at all (the app may use a different table
  name in this environment) — report, do not create tables blindly.
- Applying the migration errors (e.g. a conflicting policy name) — report the error.

## Maintenance notes

- Going forward, every table the browser reads/writes with the anon key MUST
  have RLS + per-user policies. Audit `oposicion_subscriptions` (already RLS,
  select-only — good), `perfil_psicologico` (already RLS — good), `profiles`
  (already RLS — good). `progreso` was the gap.
- Add the new migration to whatever order the team applies migrations in; the
  `do $$` guards make ordering forgiving.
- A reviewer should confirm the policies use `user_id` (not `id`) since that is
  this table's owner column.
