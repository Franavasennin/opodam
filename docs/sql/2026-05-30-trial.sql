-- OpoDAM Fase 2 — tabla profiles + columnas de trial + RPC de gating
-- Ejecutar en Supabase → SQL Editor (idempotente: se puede re-ejecutar)

-- 1) Tabla profiles (incluye las columnas que ya usa el código: email, oposiciones)
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null default '',
  oposiciones text[] not null default '{}',
  created_at  timestamptz not null default now(),
  rol         text default 'trial',
  trial_start timestamptz
);

-- Por si la tabla ya existía sin estas columnas:
alter table profiles add column if not exists email       text not null default '';
alter table profiles add column if not exists oposiciones text[] not null default '{}';
alter table profiles add column if not exists rol         text default 'trial';
alter table profiles add column if not exists trial_start timestamptz;

-- 2) RLS: el usuario solo ve/edita su propia fila
alter table profiles enable row level security;

drop policy if exists "Usuario puede ver su perfil" on profiles;
create policy "Usuario puede ver su perfil"
  on profiles for select using (auth.uid() = id);

drop policy if exists "Usuario puede crear su perfil" on profiles;
create policy "Usuario puede crear su perfil"
  on profiles for insert with check (auth.uid() = id);

drop policy if exists "Usuario puede actualizar su perfil" on profiles;
create policy "Usuario puede actualizar su perfil"
  on profiles for update using (auth.uid() = id);

-- 3) Función de estado de acceso (verdad en el servidor)
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

grant execute on function estado_acceso() to authenticated;

-- 4) Evitar que el usuario se autoascienda: el trigger conserva el rol salvo service_role
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
