-- supabase/migrations/20260604_subscriptions.sql
-- Tabla de suscripciones: vincula usuario Supabase ↔ cliente Stripe.
-- Solo el servidor (service_role) puede escribir; el usuario solo lee la suya.

create table if not exists subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text,
  plan                   text not null default 'free',      -- 'free' | 'premium'
  status                 text not null default 'inactive',  -- 'active' | 'canceled' | 'past_due' | 'inactive'
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table subscriptions enable row level security;

-- El usuario solo puede LEER su propia suscripción
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'subscriptions' and policyname = 'Usuario puede ver su suscripción'
  ) then
    create policy "Usuario puede ver su suscripción"
      on subscriptions for select using (auth.uid() = user_id);
  end if;
end $$;

-- INSERT y UPDATE solo via service_role (webhook de Stripe).
-- No se crean policies de INSERT/UPDATE para anon/authenticated.
