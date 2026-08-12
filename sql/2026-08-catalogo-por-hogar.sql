BEGIN;

ALTER TABLE recetas ADD COLUMN hogar_id UUID REFERENCES hogares(id) ON DELETE CASCADE;
CREATE INDEX idx_recetas_hogar ON recetas (hogar_id);

CREATE TABLE favoritas (
  hogar_id  UUID NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (hogar_id, receta_id)
);

CREATE INDEX idx_favoritas_receta ON favoritas (receta_id);

INSERT INTO favoritas (hogar_id, receta_id)
SELECT '00000000-0000-0000-0000-000000000001', id
FROM recetas
WHERE favorita AND borrada_en IS NULL;

COMMIT;
