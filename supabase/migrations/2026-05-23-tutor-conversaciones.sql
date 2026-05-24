-- Tutor IA (Fase 1): historial de conversaciones por (alumno, oposición, tema).
-- Ejecutar en el SQL Editor de Supabase.

create table if not exists public.tutor_conversaciones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  oposicion   text not null,
  tema_id     int  not null,
  mensajes    jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now(),
  unique (user_id, oposicion, tema_id)
);

alter table public.tutor_conversaciones enable row level security;

drop policy if exists "propias_select" on public.tutor_conversaciones;
drop policy if exists "propias_insert" on public.tutor_conversaciones;
drop policy if exists "propias_update" on public.tutor_conversaciones;

create policy "propias_select" on public.tutor_conversaciones
  for select using (auth.uid() = user_id);
create policy "propias_insert" on public.tutor_conversaciones
  for insert with check (auth.uid() = user_id);
create policy "propias_update" on public.tutor_conversaciones
  for update using (auth.uid() = user_id);
