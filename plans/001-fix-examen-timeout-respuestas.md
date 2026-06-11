# Plan 001: Exam timeout scores the user's real answers, not a blank map

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d2807f4..HEAD -- src/pages/Examen.tsx`
> If `src/pages/Examen.tsx` changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `d2807f4`, 2026-06-11

## Why this matters

When the exam countdown reaches zero, the app grades the exam against the
**initial all-null answer map** instead of what the user actually answered. A
student who fills in 50 answers but lets the timer run out is scored as if they
left every question blank (nota 0, all "en blanco"). Grading is the core
promise of this product; this silently destroys real results. The fix is small
and well-contained.

## Root cause

`src/pages/Examen.tsx` starts a `setInterval` inside `iniciarExamen()`. On
timeout it calls `finalizarExamen(sel, init)` where:
- `sel` = the selected questions (fine), and
- `init` = a `Record<string, number | null>` built at exam start with **every
  answer set to `null`** and never mutated afterward.

The user's real answers live in the `respuestas` React state, which `init` is
not. So the timeout path grades against `init` (all null). There is also a
second, subtler hazard: the `setInterval` callback closes over the
`finalizarExamen`/`init`/`sel` captured at `iniciarExamen()` time, so even
referencing state directly from the interval would read stale values. The
robust fix is to keep the latest answers/questions in refs and read those at
timeout.

## Current state

- `src/pages/Examen.tsx` — the exam page. Relevant excerpts:

State declarations (lines 34–41):
```tsx
const [preguntas, setPreguntas] = useState<PreguntaExt[]>([])
const [respuestas, setRespuestas] = useState<Record<string, number | null>>({})
const [marcadas, setMarcadas] = useState<Set<string>>(new Set())
const [indice, setIndice] = useState(0)
const [tiempo, setTiempo] = useState(0)
const [cargando, setCargando] = useState(false)
const [resultado, setResultado] = useState<ExamenResultado | null>(null)
const intervalo = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
```

The bug — `iniciarExamen()` timer (lines 56–71) and `finalizarExamen` signature (line 74):
```tsx
const init: Record<string, number | null> = {}
sel.forEach(p => { init[p.id] = null })
setPreguntas(sel)
setRespuestas(init)
// ...
intervalo.current = setInterval(() => {
  setTiempo(t => {
    if (t <= 1) { clearInterval(intervalo.current); finalizarExamen(sel, init); return 0 }
    return t - 1
  })
}, 1000)
```
```tsx
function finalizarExamen(prgs = preguntas, resps = respuestas) {
```

Note: the manual "finish exam" button path (elsewhere in the file) calls
`finalizarExamen()` with no args, which correctly defaults to the live
`preguntas`/`respuestas`. **Only the timeout path is broken** because it passes
`init`.

## Commands you will need

| Purpose   | Command                              | Expected on success |
|-----------|--------------------------------------|---------------------|
| Typecheck | `npx tsc --noEmit -p tsconfig.app.json` | exit 0, no errors |
| Tests     | `npm run test:run`                   | all pass            |
| Lint      | `npm run lint`                       | exit 0              |
| Build     | `npm run build`                      | exit 0 (tsc -b + vite) |

## Scope

**In scope** (the only files you should modify):
- `src/pages/Examen.tsx`
- `src/pages/Examen.test.tsx` (create — see Test plan; only if the mocking is tractable, see STOP conditions)

**Out of scope** (do NOT touch):
- `src/services/examen.ts` — the scoring functions are correct; the bug is only
  *which answers* are passed to them.
- The manual-finish path and any UI/render code beyond what's needed.
- The `marcadas`/`indice` state — unrelated.

## Git workflow

- Branch: `advisor/001-examen-timeout` (repo normally commits to `main`; create
  a branch for review unless the operator says otherwise).
- Conventional commit, matching repo style. Example from `git log`:
  `fix: tipo del fallback de Sentry.ErrorBoundary (error es unknown)`.
  Use e.g. `fix: el temporizador del examen puntúa las respuestas reales (no un mapa en blanco)`.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Add refs that always hold the latest questions and answers

Right after the `intervalo` ref (line 41), add two refs and keep them in sync on
every render:

```tsx
const intervalo = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
// Refs always pointing to the latest state, so the timer reads live values
// (avoids the stale-closure trap inside setInterval).
const respuestasRef = useRef(respuestas)
respuestasRef.current = respuestas
const preguntasRef = useRef(preguntas)
preguntasRef.current = preguntas
```

**Verify**: `npx tsc --noEmit -p tsconfig.app.json` → exit 0.

### Step 2: Make the timeout read the live refs instead of `init`/`sel`

In `iniciarExamen()`, change the timeout call (line 68) from:
```tsx
if (t <= 1) { clearInterval(intervalo.current); finalizarExamen(sel, init); return 0 }
```
to:
```tsx
if (t <= 1) { clearInterval(intervalo.current); finalizarExamen(preguntasRef.current, respuestasRef.current); return 0 }
```

Leave `finalizarExamen`'s signature (`prgs = preguntas, resps = respuestas`) and
the manual-finish callers unchanged.

**Verify**: `npx tsc --noEmit -p tsconfig.app.json` → exit 0, and
`grep -n "finalizarExamen(sel, init)" src/pages/Examen.tsx` → **no matches**.

### Step 3: Confirm `init` is still used for initial state only

`init` must still be passed to `setRespuestas(init)` (it seeds the initial
all-null state — that is correct). Only the timeout call should stop using it.

**Verify**: `grep -n "setRespuestas(init)" src/pages/Examen.tsx` → exactly one match.

### Step 4: Run the full suite and build

**Verify**:
- `npm run test:run` → all pass.
- `npm run lint` → exit 0.
- `npm run build` → exit 0.

## Test plan

Add a regression test if — and only if — mocking the topic loader is tractable
(see STOP conditions). Model it after an existing page test:
`src/pages/Personalidad.test.tsx` (structure) and `src/pages/Entrevista.test.tsx`.

The test must cover the exact regression:
- Mock `../data/topics` `obtenerTopics` so `cargarTema` resolves a small fixed
  set of questions and `TEMAS_META` is short.
- Render `<Examen />`, start an exam, programmatically answer ≥1 question
  (set an answer so `respuestas` differs from the initial null map).
- Advance the timer to expiry using Vitest fake timers
  (`vi.useFakeTimers()` / `vi.advanceTimersByTime(...)`).
- Assert the resulting saved exam (spy on `guardarExamen` from
  `../services/examen`) reflects the answered question as **answered**, not
  blank — i.e. `respuestasUsuario` contains the chosen answer and `enBlanco`
  is less than the total.

Verification: `npm run test:run` → all pass, including the new test.

If a full component test proves too heavy to set up reliably, it is acceptable
to skip the automated test, document why in the PR description, and rely on the
`grep` checks in Steps 2–3 plus manual verification (start a mini exam, answer
questions, let the timer expire, confirm the result is not all-blank).

## Done criteria

ALL must hold:

- [ ] `npx tsc --noEmit -p tsconfig.app.json` exits 0
- [ ] `npm run test:run` exits 0 (with the new test if it was added)
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] `grep -n "finalizarExamen(sel, init)" src/pages/Examen.tsx` returns no matches
- [ ] `grep -n "setRespuestas(init)" src/pages/Examen.tsx` returns exactly one match
- [ ] Only files in the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 001 updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- `src/pages/Examen.tsx` does not match the "Current state" excerpts (drift).
- The manual-finish path turns out to also pass a frozen map (it should not —
  it calls `finalizarExamen()` with no args). If it does, report it; the fix may
  need to widen.
- Setting up the component test requires mocking more than `../data/topics`,
  `../hooks/useProgress`, and `../services/examen`, or fights the jsdom/router
  setup — skip the automated test per the Test plan and report.
- Any verification fails twice after a reasonable fix attempt.

## Maintenance notes

- If exam state is ever lifted into a reducer/context, the refs in Step 1 must
  follow the new source of truth, or the stale-closure bug returns.
- A reviewer should confirm the timeout path and the manual-finish path now
  produce identical results for the same answers — that equivalence is the whole
  point of this fix.
- The same `setInterval`-reading-stale-state pattern does not appear elsewhere
  in this file, but watch for it if more timers are added.
