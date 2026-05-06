-- supabase/migrations/20260505_profiles.sql
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  oposiciones text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'Usuario puede ver su perfil'
  ) then
    create policy "Usuario puede ver su perfil"
      on profiles for select using (auth.uid() = id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'Usuario puede crear su perfil'
  ) then
    create policy "Usuario puede crear su perfil"
      on profiles for insert with check (auth.uid() = id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'Usuario puede actualizar su perfil'
  ) then
    create policy "Usuario puede actualizar su perfil"
      on profiles for update using (auth.uid() = id);
  end if;
end $$;
