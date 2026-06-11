-- Habilita RLS y políticas por usuario en la tabla `progreso`.
-- El cliente lee/escribe `progreso` con la clave anon (src/services/supabase.ts),
-- así que sin RLS un usuario podría leer/modificar el progreso de otros.
-- Idempotente: seguro de re-ejecutar. Ejecutar en Supabase → SQL Editor.
--
-- ANTES de aplicar, diagnostica el estado actual:
--   select relname, relrowsecurity from pg_class where relname = 'progreso';
--   select policyname, cmd, qual, with_check from pg_policies where tablename = 'progreso';
-- Si ya hay RLS=true con políticas por auth.uid()=user_id, no hace falta esta migración.

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
