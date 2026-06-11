# Plan 005: Parallelize `cargarTema` loads to speed up exam/session startup

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result. If anything in "STOP
> conditions" occurs, stop and report. When done, update the status row in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d2807f4..HEAD -- src/pages/Examen.tsx src/pages/Simulacro.tsx src/pages/SesionDiaria.tsx src/pages/FlashcardsGlobal.tsx`
> If any of these changed since this plan was written, compare the "Current
> state" excerpts against the live code; on a mismatch, treat it as a STOP
> condition for that file.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (note: `src/pages/Examen.tsx` is also edited by plan 001;
  if both run, do 001 first or rebase — the edits are in different functions and
  do not overlap, but running 001 first avoids a manual merge)
- **Category**: perf
- **Planned at**: commit `d2807f4`, 2026-06-11

## Why this matters

Several pages load topic data (`cargarTema`) inside `for … of` loops with
`await` **inside** the loop, so the ~45 topics of an oposición are fetched
strictly one after another. Each `cargarTema` is a dynamically-imported JSON
chunk; serially that's ~45 sequential round-trips before an exam or daily
session can start — a multi-second stall on a phone. Because the loads are
independent, `Promise.all` makes them concurrent, cutting startup latency
dramatically with no behavior change.

## Current state (four call sites)

All four use the same anti-pattern: `await cargarTema(...)` inside a `for` loop.

1. `src/pages/Examen.tsx` — `iniciarExamen()` (lines 47–53):
```tsx
const todas: PreguntaExt[] = []
for (const m of TEMAS_META) {
  try {
    const tema = await cargarTema(m.id)
    tema.preguntas.forEach(p => todas.push({ ...p, temaId: m.id }))
  } catch { /* skip */ }
}
```

2. `src/pages/Simulacro.tsx` (lines 36–38):
```tsx
for (const m of TEMAS_META) {
  try { (await cargarTema(m.id)).preguntas.forEach(p => todas.push({ ...p, temaId: m.id })) }
  catch { /* skip */ }
}
```

3. `src/pages/SesionDiaria.tsx` — inside the `cargar()` effect, TWO loops
   (lines 41–48 flashcards, lines 53–59 weak-topic questions):
```tsx
const fcs: Flashcard[] = []
for (const meta of TEMAS_META) {
  try {
    const tema = await cargarTema(meta.id)
    tema.flashcards
      .filter(c => sesion.flashcardIds.includes(c.id))
      .forEach(c => fcs.push(c))
  } catch { /* skip */ }
}
// ...
const prgs: PreguntaExt[] = []
for (const temaId of temasDebiles) {
  try {
    const tema = await cargarTema(temaId)
    const shuffled = [...tema.preguntas].sort(() => Math.random() - 0.5).slice(0, 4)
    shuffled.forEach(p => prgs.push({ ...p, temaId }))
  } catch { /* skip */ }
}
```

4. `src/pages/FlashcardsGlobal.tsx` (around line 34):
```tsx
const tema = await cargarTema(meta.id)
```
(inside a similar loop — confirm the surrounding loop shape before editing).

`cargarTema(id)` returns a Promise resolving to a topic object with
`.preguntas` and `.flashcards` arrays. `TEMAS_META` is an array of `{ id, … }`.

## Key correctness constraint

The current code **silently skips** a topic whose load throws (`catch {}`). The
parallel version must preserve that: one failed topic must not reject the whole
batch. Use `Promise.allSettled`, or wrap each load in a `.catch(() => null)` and
filter nulls — do NOT use a bare `Promise.all` that rejects on the first error.

Ordering: the current loops push in `TEMAS_META` order. Where order matters
(it does not for scoring — questions are later selected/shuffled — but keep it
stable to avoid surprising diffs), iterate the settled results in the original
array order, which `Promise.all`/`allSettled` preserve by index.

## Commands you will need

| Purpose   | Command                              | Expected |
|-----------|--------------------------------------|----------|
| Typecheck | `npx tsc --noEmit -p tsconfig.app.json` | exit 0 |
| Tests     | `npm run test:run`                   | all pass |
| Lint      | `npm run lint`                       | exit 0   |
| Build     | `npm run build`                      | exit 0   |

## Scope

**In scope**:
- `src/pages/Examen.tsx` (the load loop only — NOT the timer logic)
- `src/pages/Simulacro.tsx`
- `src/pages/SesionDiaria.tsx` (both loops)
- `src/pages/FlashcardsGlobal.tsx`

**Out of scope**:
- `src/data/topics/*` — the loader itself; do not change `cargarTema`.
- Any scoring/selection logic (`seleccionarPreguntas`, shuffling) — keep as-is;
  only change HOW the topics are fetched, not what's done with them.
- The exam timer in `Examen.tsx` (that's plan 001).

## Git workflow

- Branch: `advisor/005-parallelize-cargartema`.
- Conventional commit, e.g. `perf: cargar temas en paralelo (Promise.allSettled) en examen/simulacro/sesión`.
- Do NOT push or open a PR unless instructed.

## Steps

For each call site, replace the sequential loop with a concurrent load that
preserves the skip-on-error behavior. Pattern (adapt the body per site):

```tsx
const resultados = await Promise.all(
  TEMAS_META.map(m => cargarTema(m.id).then(tema => ({ m, tema })).catch(() => null))
)
for (const r of resultados) {
  if (!r) continue
  r.tema.preguntas.forEach(p => todas.push({ ...p, temaId: r.m.id }))
}
```

### Step 1: Examen.tsx
Convert the `iniciarExamen()` load loop (lines 47–53) to the parallel pattern,
pushing into `todas` exactly as before. Leave everything after the loop
unchanged.

**Verify**: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.

### Step 2: Simulacro.tsx
Convert the loop (lines 36–38) the same way.

**Verify**: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.

### Step 3: SesionDiaria.tsx (both loops)
Convert the flashcards loop (41–48) and the weak-topics loop (53–59). For the
weak-topics loop the iterable is `temasDebiles` (topic IDs), not `TEMAS_META` —
map over `temasDebiles`. Preserve the per-topic shuffle+slice and the final
`prgs.slice(0, 10)`.

**Verify**: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.

### Step 4: FlashcardsGlobal.tsx
Inspect the loop around line 34 and convert it the same way, preserving whatever
filtering it does on the loaded topic.

**Verify**: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.

### Step 5: Full verification
**Verify**:
- `npm run test:run` → all pass.
- `npm run lint` → exit 0.
- `npm run build` → exit 0.
- `grep -rn "await cargarTema" src/pages` → **no matches** (all sequential
  awaits-in-loop removed; the only remaining `cargarTema` uses are inside
  `.map(... )` / `.then(...)`).

## Test plan

The behavior (which questions/flashcards end up loaded) must be unchanged —
only concurrency changes. Existing tests must stay green. If `SesionDiaria` or
`Examen` has a component test that mocks `obtenerTopics`, confirm it still
passes (the mock's `cargarTema` returns resolved promises, which work
identically under `Promise.all`).

No new automated test is required (this is a refactor with preserved
semantics), but document a manual check in the PR: load an exam and a daily
session, confirm the same content appears and startup feels faster.

If you want a guard against the skip-on-error regression: add/confirm a test
where one mocked `cargarTema` rejects and assert the page still loads the
remaining topics (model after any existing `src/pages/*.test.tsx`). Optional.

## Done criteria

ALL must hold:

- [ ] `npx tsc --noEmit -p tsconfig.app.json` exits 0
- [ ] `npm run test:run` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `grep -rn "await cargarTema" src/pages` → no matches
- [ ] Each converted site uses `Promise.all`/`allSettled` with per-topic error
      handling (no bare `Promise.all` that rejects the batch)
- [ ] Only in-scope files modified (`git status`)
- [ ] `plans/README.md` status row for 005 updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- Any file does not match its "Current state" excerpt (drift).
- A converted site changes which questions/flashcards are produced (e.g. a test
  that asserts on content now fails) — the refactor must be behavior-preserving;
  if it isn't, you've changed semantics, stop.
- `FlashcardsGlobal.tsx`'s loop shape is materially different from the others
  and the pattern doesn't map cleanly — report it rather than guessing.
- Any verification fails twice after a reasonable fix attempt.

## Maintenance notes

- If `cargarTema` ever gains side effects or rate-limited remote fetching,
  unbounded `Promise.all` over 45 items could spike concurrency — at that point
  add a small concurrency limit. Today they're local dynamic imports, so full
  parallelism is fine.
- A reviewer should confirm the skip-on-error semantics survived (one bad topic
  must not blank the whole exam) and that load order didn't subtly change in a
  way a test depends on.
- This plan and plan 001 both touch `Examen.tsx` but different functions
  (`iniciarExamen` load loop here; the timer/`finalizarExamen` there). Land 001
  first if both are queued.
