ALTER TABLE recetas
  ADD COLUMN IF NOT EXISTS hierro     NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS sin_gluten BOOLEAN,
  ADD COLUMN IF NOT EXISTS micros     JSONB;

CREATE INDEX IF NOT EXISTS idx_recetas_sin_gluten ON recetas (sin_gluten);
