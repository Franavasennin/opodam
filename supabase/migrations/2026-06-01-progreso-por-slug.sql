-- Progreso por oposición: la tabla `progreso` pasa de 1 fila por usuario
-- a 1 fila por (usuario, oposición). Evita que estudiar 2 oposiciones mezcle el progreso.
-- Ejecutar en Supabase → SQL Editor (idempotente).

-- 1) Columna slug (las filas existentes eran de CGPC).
alter table public.progreso add column if not exists slug text not null default 'cgpc';

-- 2) Reemplazar la PK de (user_id) por unicidad (user_id, slug).
--    El nombre por defecto de la PK es progreso_pkey; si difiere, ajústalo.
alter table public.progreso drop constraint if exists progreso_pkey;

-- Unicidad por (user_id, slug) para que el upsert con onConflict 'user_id,slug' funcione.
create unique index if not exists progreso_user_slug_uq on public.progreso (user_id, slug);

-- (Opcional) si prefieres PK compuesta en vez de índice único:
-- alter table public.progreso add primary key (user_id, slug);

-- RLS: las políticas por user_id siguen valiendo (slug no cambia la pertenencia).
