-- P2.1 Banco inteligente de preguntas
-- Ejecutar en Supabase SQL Editor
--
-- Regla dura: ninguna pregunta generada por IA llega al alumno sin pasar la
-- auditoría (estado 'borrador' -> 'revisada' -> 'activa'). El frontend SOLO lee
-- las de estado 'activa'. La escritura es siempre service-role (funciones
-- Netlify); los usuarios autenticados solo pueden LEER las activas.

create table if not exists banco_preguntas (
  id               uuid        default gen_random_uuid() primary key,
  oposicion_slug   text        not null,
  tema_id          int         not null,
  enunciado        text        not null,
  opciones         jsonb       not null,                 -- ["A", "B", "C", "D"]
  correcta         int         not null,                 -- índice 0-based en opciones
  explicacion      text,
  dificultad       real        not null default 0.5,     -- 0..1 (% de fallo)
  veces_respondida int         not null default 0,
  veces_fallada    int         not null default 0,
  estado           text        not null default 'borrador',
  -- estado values: borrador | revisada | activa
  created_at       timestamptz default now()
);

alter table banco_preguntas enable row level security;

-- Lectura: cualquier usuario autenticado, SOLO preguntas activas.
create policy "banco_preguntas_select_activas"
  on banco_preguntas for select
  to authenticated
  using (estado = 'activa');

-- (Sin policies de insert/update/delete: solo el service-role escribe,
--  y el service-role salta RLS por diseño.)

create index if not exists idx_banco_oposicion_tema
  on banco_preguntas(oposicion_slug, tema_id, estado);
