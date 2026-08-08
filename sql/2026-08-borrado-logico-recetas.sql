-- Borrado lógico de recetas, para poder deshacer un borrado accidental.
--
-- El borrado duro no se podía deshacer: rehacer la receta con un POST le da un
-- id nuevo, y el plan y las pendientes guardan sus entradas por recetaId, así
-- que la receta volvía pero desenganchada de la semana. Marcando la fila el id
-- sobrevive y restaurar es volver a ponerlo en null.
--
-- null = viva. Las lecturas filtran por borrada_en IS NULL.

ALTER TABLE recetas
  ADD COLUMN IF NOT EXISTS borrada_en TIMESTAMPTZ;

-- Las lecturas del catálogo son todas "las vivas", así que el índice parcial es
-- el que se usa; el total no aportaría nada.
CREATE INDEX IF NOT EXISTS idx_recetas_vivas ON recetas (id) WHERE borrada_en IS NULL;
