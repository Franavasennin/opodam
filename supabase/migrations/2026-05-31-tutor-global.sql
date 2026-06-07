-- Tutor Fase 3 — memoria de la conversación del tutor global (una fila por alumno+oposición)
create table if not exists public.tutor_global_conversaciones (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  oposicion  text not null,
  mensajes   jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, oposicion)
);

alter table public.tutor_global_conversaciones enable row level security;

drop policy if exists "tg_select" on public.tutor_global_conversaciones;
create policy "tg_select" on public.tutor_global_conversaciones
  for select using (auth.uid() = user_id);

drop policy if exists "tg_insert" on public.tutor_global_conversaciones;
create policy "tg_insert" on public.tutor_global_conversaciones
  for insert with check (auth.uid() = user_id);

drop policy if exists "tg_update" on public.tutor_global_conversaciones;
create policy "tg_update" on public.tutor_global_conversaciones
  for update using (auth.uid() = user_id);
