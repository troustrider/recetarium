ALTER TABLE recetas
  ADD COLUMN IF NOT EXISTS borrada_en TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_recetas_vivas ON recetas (id) WHERE borrada_en IS NULL;
