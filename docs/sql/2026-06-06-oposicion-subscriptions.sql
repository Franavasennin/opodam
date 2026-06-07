-- Monetización por oposición: tabla oposicion_subscriptions
-- Ejecutar en Supabase SQL Editor

create table if not exists oposicion_subscriptions (
  id                    uuid        default gen_random_uuid() primary key,
  user_id               uuid        references auth.users(id) on delete cascade not null,
  oposicion_slug        text        not null,
  stripe_customer_id    text,
  stripe_subscription_id text,
  status                text        not null default 'inactive',
  -- status values: active | inactive | canceled | past_due
  current_period_end    timestamptz,
  updated_at            timestamptz default now(),
  unique(user_id, oposicion_slug)
);

alter table oposicion_subscriptions enable row level security;

create policy "oposicion_subscriptions_select"
  on oposicion_subscriptions for select
  using (auth.uid() = user_id);

create index if not exists idx_oposub_customer
  on oposicion_subscriptions(stripe_customer_id);
