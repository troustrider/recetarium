-- Origen animal de la receta, derivado de los ingredientes igual que sin_gluten:
-- { vegetariana, vegana, animal: [{ nombre, origen, certeza }] }. null en
-- vegetariana/vegana = no se puede afirmar (falta ficha de algún ingrediente o
-- alguno depende de la marca).
ALTER TABLE recetas
  ADD COLUMN IF NOT EXISTS apto JSONB;

-- El filtro duro del planificador solo acepta true, así que el índice cubre
-- justo esa consulta.
CREATE INDEX IF NOT EXISTS idx_recetas_vegetariana
  ON recetas (((apto->>'vegetariana')::boolean))
  WHERE borrada_en IS NULL;
