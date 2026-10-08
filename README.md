# OpoDAM

PWA de estudio para la oposición al Cuerpo General de la Policía Canaria (CGPC) y otras oposiciones relacionadas (Policía Local, Auxiliar de Enfermería).

## Qué hace

- Temario completo organizado por bloques, con esquemas y mapas mentales generados a partir del contenido oficial.
- Generación de preguntas tipo test y simulacros de examen con temporizador, corrección y seguimiento de progreso.
- Tutor y "entrevista" con IA (chat) para resolver dudas y practicar supuestos prácticos.
- Sincronización de progreso entre dispositivos vía Supabase (login por magic link).
- Búsqueda indexada sobre todo el temario.
- Tests E2E con Playwright y unitarios con Vitest.

## Stack

- React + TypeScript + Vite
- Supabase (auth + base de datos + RLS)
- Netlify Functions (backend serverless: chat con IA, generación de preguntas, checkout)
- Groq API (modelos LLM para tutor/entrevista/generación de contenido)
- Stripe (suscripciones)
- Tailwind CSS

## Cómo ejecutarlo en local

```bash
npm install
cp .env.example .env.local   # rellenar con tus propias claves (ver comentarios en el archivo)
npm run dev
```

Variables de servidor (Groq, Stripe, SendGrid) se configuran como variables de entorno en Netlify, no en `.env.local`.

## Tests

```bash
npm run test        # unitarios (Vitest)
npm run test:e2e    # end-to-end (Playwright)
```

## Estado

Proyecto personal en desarrollo activo. El histórico de auditorías y planes de mejora aplicados está en `plans/` y `docs/`.
