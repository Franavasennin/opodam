-- Módulo Psicológico por Cuerpo
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS perfil_psicologico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  oposicion_slug text NOT NULL,
  datos jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, oposicion_slug)
);

ALTER TABLE perfil_psicologico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "usuario ve su perfil"
  ON perfil_psicologico FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "usuario inserta su perfil"
  ON perfil_psicologico FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usuario actualiza su perfil"
  ON perfil_psicologico FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER perfil_psicologico_updated_at
  BEFORE UPDATE ON perfil_psicologico
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
