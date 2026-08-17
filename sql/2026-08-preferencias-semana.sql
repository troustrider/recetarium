-- Cómo quiere comer el hogar: prioridades de salud, cocinas favoritas, cuántos
-- desayunos entran en la semana y los límites duros de la auto-semana.
-- Compartido por el hogar entero, como el plan y la despensa.
ALTER TABLE app_estado
  ADD COLUMN IF NOT EXISTS preferencias JSONB NOT NULL DEFAULT '{}'::jsonb;
