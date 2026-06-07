# OpoDAM Fase 2 — Cuentas + Trial de 7 días (Design Spec)

**Fecha:** 2026-05-30
**Estado:** aprobado para planificación
**Alcance:** Reactivar autenticación (magic link) y añadir un trial de 7 días con gating de acceso. **Sin Stripe** — el cobro se implementa en una charla posterior.
**Base previa:** [`2026-05-05-registro-usuario-oposiciones-design.md`](./2026-05-05-registro-usuario-oposiciones-design.md) — onboarding, perfil y catálogo de oposiciones ya implementados. Este spec añade la capa de trial/gating encima.

---

## 1. Objetivo

Convertir OpoDAM de app abierta a producto monetizable con este modelo:

- **Registro obligatorio** (opción A): nadie usa el contenido sin sesión.
- **Trial de 7 días** (opción D): acceso total durante 7 días desde que el usuario **activa su primera oposición**.
- Al expirar el trial → **redirección a una URL externa** (`VITE_URL_EXPIRACION`), futura landing de ventas/Stripe.
- `owner` y `beta` tienen acceso ilimitado y gratis.

Stripe, tabla `suscripciones` y webhooks quedan **fuera de alcance** (charla siguiente).

> Nota: el onboarding (magic link + selección de oposiciones) y `RutaProtegida` ya existen en código pero están **desactivados** (`RutaProtegida` es passthrough; rutas de onboarding comentadas en `App.tsx`). Esta fase los reactiva y les añade el gating de trial.

---

## 2. Arquitectura

Cuatro piezas:

1. **Auth** — magic link ya implementado en `services/supabase.ts` (`enviarMagicLink`, `iniciarSesionAnonima`). Se reactivan las rutas de onboarding hoy comentadas en `src/App.tsx`.
2. **Perfil + trial** — tabla `profiles` existente, ampliada con `rol` y `trial_start`. Estado en Supabase, nunca en localStorage (no manipulable).
3. **Gating** — `RutaProtegida` (hoy passthrough) consulta el estado de acceso y decide: entrar / mandar a onboarding / redirigir fuera.
4. **Expiración** — derivada en servidor vía RPC `estado_acceso()`. No requiere cron.

---

## 3. Roles y estados

Columna `rol` en `profiles`:

| Rol | Acceso | Asignación |
|-----|--------|------------|
| `owner` | Total, sin caducar | Manual en Supabase |
| `beta` | Total, sin caducar | Manual en Supabase |
| `trial` | Total 7 días desde `trial_start` | Automático al crear perfil (default) |
| *(expirado)* | Ninguno → fuera | **Derivado**, no se almacena |

El estado de acceso se **deriva**, no se persiste. Tres valores posibles:

- `'activo'` — puede usar la app.
- `'sin-oposicion'` — autenticado pero aún no activó ninguna oposición (`trial_start IS NULL`). Puede navegar `/mis-oposiciones` y elegir.
- `'expirado'` — trial vencido → redirección externa.

---

## 4. Flujo del usuario

```
Visita la app
   │
   ├─ ¿Sesión? ──no──→ Onboarding: email → magic link → vuelve autenticado
   │                                                          │
   yes ←──────────────────────────────────────────────────────┘
   │
   ├─ ¿Perfil? ──no──→ crear profile (rol='trial', trial_start=NULL)
   │
   ├─ estado_acceso() (RPC servidor):
   │     ├─ 'sin-oposicion' → /mis-oposiciones. Al pulsar "Empezar" en una
   │     │                    oposición → set trial_start=now() → arranca cuenta atrás
   │     ├─ 'activo'         → entra normal (+ banner "N días restantes" si rol=trial)
   │     └─ 'expirado'       → window.location = VITE_URL_EXPIRACION
   │
   └─ owner/beta → 'activo' siempre, sin necesidad de trial_start
```

---

## 5. Datos (Supabase)

### Migración

```sql
alter table profiles add column if not exists rol text default 'trial';
alter table profiles add column if not exists trial_start timestamptz;
```

### RPC de gating (verdad en el servidor)

```sql
create or replace function estado_acceso()
returns text language sql security definer as $$
  select case
    when p.rol in ('owner','beta')                  then 'activo'
    when p.trial_start is null                       then 'sin-oposicion'
    when now() < p.trial_start + interval '7 days'   then 'activo'
    else 'expirado'
  end
  from profiles p where p.id = auth.uid();
$$;
```

Usa `now()` del servidor → el reloj del cliente no puede manipular el trial.

### RLS

- El usuario lee/actualiza solo su fila (`id = auth.uid()`) — políticas ya creadas en el spec previo.
- El usuario **no** puede modificar `rol` desde el cliente. Se ajusta la policy de UPDATE para excluir `rol` (o se deja `rol` escribible solo por `service_role`). Evita autoascenso a `beta`/`owner`.
- `trial_start` lo escribe el cliente una sola vez (al activar 1ª oposición); aceptable porque la RPC usa `now()` del servidor para el corte.

---

## 6. Activación de la primera oposición

En `/mis-oposiciones`, el botón "Empezar"/"Entrar" de una oposición:

1. Si `trial_start IS NULL` y `rol='trial'` → `update profiles set trial_start = now() where id = auth.uid()`.
2. Refresca estado y navega al dashboard de la oposición.

Para `owner`/`beta` no se toca `trial_start`.

---

## 7. Banner de cuenta atrás

- Visible en el dashboard cuando `rol='trial'` y estado `'activo'`.
- Texto: "Te quedan N días de prueba" (N = días hasta `trial_start + 7d`, redondeo hacia arriba).
- Solo informativo. El gating real lo decide la RPC, no el banner.
- Oculto para `owner`/`beta`.

---

## 8. Manejo de errores / fail-safe

- **Sin conexión a Supabase / RPC falla** → **fail-open** durante la sesión. No expulsamos por fallo de red; reintento al recuperar visibilidad/conexión. Preferimos falso positivo de acceso a echar a un usuario legítimo.
- **`trial_start` NULL + rol trial** → `'sin-oposicion'`, nunca `'expirado'`.
- **Hora del cliente** → irrelevante para el gating (la RPC usa `now()` servidor). El banner usa hora cliente solo para el conteo visual (tolerable).

---

## 9. Variables de entorno

| Variable | Valor (v1) | Notas |
|----------|-----------|-------|
| `VITE_SUPABASE_URL` | (existente) | |
| `VITE_SUPABASE_ANON_KEY` | (existente) | |
| `VITE_URL_EXPIRACION` | `https://opodam.vercel.app/precios` | Placeholder; dará 404 hasta montar la landing de Stripe |

---

## 10. Fuera de alcance (charla siguiente)

- Stripe Checkout + portal de cliente.
- Tabla `suscripciones` y webhook serverless.
- Página `/precios` real.
- Conversión `trial → pago`.

---

## 11. Archivos afectados (estimado)

- `src/App.tsx` — reactivar rutas onboarding, montar gating.
- `src/components/layout/RutaProtegida.tsx` — lógica real de gating.
- `src/services/supabase.ts` — `estadoAcceso()` (llamada RPC), `activarTrial()`.
- `src/services/suscripcion.ts` *(nuevo)* — helpers de estado/trial/días restantes.
- `src/pages/MisOposiciones.tsx` — activar trial al empezar oposición.
- `src/pages/onboarding/*` — reactivar.
- `src/components/ui/BannerTrial.tsx` *(nuevo)* — cuenta atrás.
- `.env.example` — `VITE_URL_EXPIRACION`.
- Migración SQL (manual por el usuario en Supabase).
