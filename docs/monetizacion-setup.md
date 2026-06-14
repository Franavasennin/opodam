# Activar cobro real — Stripe + Netlify (paso a paso)

> El código de suscripción por oposición (19,90 €/mes) ya está completo:
> `stripe-checkout.cjs`, `stripe-webhook.cjs`, tabla `oposicion_subscriptions`,
> `BannerPaywall` y gating `RutaOposicion`. **Solo falta configuración.**
> Esta guía NO contiene secretos: todos los valores son placeholders. Pon los
> reales únicamente en el panel de Netlify y en tu gestor de contraseñas.

## 0. Requisitos previos
- Tabla `oposicion_subscriptions` creada en Supabase (`docs/sql/2026-06-06-oposicion-subscriptions.sql`). ✅ ya ejecutada.
- Dominio de producción conocido (ej. `https://opodam.netlify.app`).

## 1. Stripe — crear producto y precio (modo LIVE)
1. Stripe Dashboard → conmuta a **Live mode** (arriba a la derecha).
2. **Products → Add product**:
   - Nombre: `OpoDAM — <Oposición>` (o uno genérico si compartes price).
   - Pricing: **Recurring**, `19,90 EUR`, intervalo **Monthly**.
   - Guarda y copia el **Price ID** → `price_live_XXXXXXXX`.
3. (Opcional, precio distinto por oposición) crea un price por cada slug y usa
   `STRIPE_PRICE_ID_<SLUG>` (ver paso 3). Si no, un único `STRIPE_PRICE_ID` sirve para todas.
4. **Developers → API keys** → copia la **Secret key** live → `sk_live_XXXXXXXX`.

## 2. Stripe — webhook
1. **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://<TU-DOMINIO>/.netlify/functions/stripe-webhook`
3. Eventos a escuchar (los 3):
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Crea el endpoint y copia el **Signing secret** → `whsec_live_XXXXXXXX`.

## 3. Netlify — variables de entorno
Site → **Site configuration → Environment variables**. Marca scope
**Functions/Runtime** (Production). Nombres EXACTOS (los lee el código):

| Variable | Valor (placeholder) | Obligatoria |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_XXXXXXXX` | ✅ |
| `STRIPE_PRICE_ID` | `price_live_XXXXXXXX` | ✅ (o usa las por-slug) |
| `STRIPE_PRICE_ID_<SLUG>` | `price_live_...` | opcional, por oposición (ej. `STRIPE_PRICE_ID_CGPC`) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_live_XXXXXXXX` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | (service role de Supabase) | ✅ |
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | ✅ |
| `VITE_SUPABASE_ANON_KEY` | (anon key de Supabase) | ✅ |
| `ALLOWED_ORIGINS` | `https://<TU-DOMINIO>` | recomendada (CORS fail-closed) |
| `BETA_TESTERS` | `correo1@x.com,correo2@x.com` | opcional (bypass de pago) |
| `SEND_EMAIL_SECRET` | (secreto de send-email) | opcional (email de confirmación) |

> Nota: `<SLUG>` se mayusculiza y los guiones pasan a `_`
> (ej. `policia-local` → `STRIPE_PRICE_ID_POLICIA_LOCAL`).

Tras guardar las variables, **redeploy** del sitio (las functions leen env en arranque).

## 4. Prueba de extremo a extremo
1. Inicia sesión en producción con una cuenta NO incluida en `BETA_TESTERS`.
2. Entra en una oposición sin suscripción → debe verse el **BannerPaywall**;
   intentar abrir `/oposicion/<slug>/tests` debe **redirigir al dashboard** (gating OK).
3. Pulsa **Suscribirme** → completa el checkout de Stripe (tarjeta real en live,
   o usa **modo test** primero con `4242 4242 4242 4242`).
4. Stripe → Webhooks → **Event deliveries**: confirma `200` en `checkout.session.completed`.
5. Supabase → tabla `oposicion_subscriptions`: debe aparecer la fila con `status='active'`.
6. Recarga la app: el banner desaparece y el contenido queda accesible.

## 5. Cancelaciones / impagos (automático)
- El webhook ya maneja `customer.subscription.updated` (→ `past_due`/`active`) y
  `customer.subscription.deleted` (→ `canceled`). El gating usa `active|past_due`
  como acceso válido; `canceled`/`inactive` → vuelve a mostrar el paywall.

## 6. Antes de cobrar de verdad (checklist legal/producto)
- [ ] Términos de uso, privacidad y política de reembolsos publicados.
- [ ] Stripe pasado de **test → live** (claves, price y webhook live).
- [ ] Verificación de contenido jurídico (riesgo de producto).
- [ ] Email de confirmación de pago operativo (`SEND_EMAIL_SECRET` + sender verificado).

---
*Generado 2026-06-14. Sin secretos: rellena los valores reales solo en Netlify/Stripe.*
