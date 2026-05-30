-- OpoDAM Fase 2 — columnas de trial + RPC de gating
-- Ejecutar en Supabase → SQL Editor

alter table profiles add column if not exists rol text default 'trial';
alter table profiles add column if not exists trial_start timestamptz;

-- Función de estado de acceso (verdad en el servidor)
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

-- Permitir que el rol authenticated ejecute la función
grant execute on function estado_acceso() to authenticated;

-- Evitar que el usuario se autoascienda: la policy de UPDATE existente permite
-- actualizar la fila propia; añadimos un trigger que conserva el rol salvo service_role.
create or replace function proteger_rol()
returns trigger language plpgsql as $$
begin
  if auth.role() <> 'service_role' then
    new.rol := old.rol;  -- ignora cualquier cambio de rol desde el cliente
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_rol on profiles;
create trigger trg_proteger_rol
  before update on profiles
  for each row execute function proteger_rol();
