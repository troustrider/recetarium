-- Nutrición detallada por porción: hierro y gluten a columna (se filtra y ordena por
-- ellos), el resto de micronutrientes a jsonb. Todo nullable: null = sin analizar.
-- sin_gluten null significa que algún ingrediente no tiene ficha en nutrientes.json,
-- así que no se puede afirmar que la receta no lleve gluten.

ALTER TABLE recetas
  ADD COLUMN IF NOT EXISTS hierro     NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS sin_gluten BOOLEAN,
  ADD COLUMN IF NOT EXISTS micros     JSONB;

CREATE INDEX IF NOT EXISTS idx_recetas_sin_gluten ON recetas (sin_gluten);
