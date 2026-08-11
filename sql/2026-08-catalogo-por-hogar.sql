-- Fase 4 del plan multiusuario.
--
-- El catálogo sigue siendo común, pero cada hogar puede tener sus propias
-- recetas, y las favoritas dejan de ser una bandera global.

BEGIN;

-- NULL = catálogo común, visible para todos. Un UUID = receta privada de ese
-- hogar. Las 268 recetas existentes se quedan en NULL.
ALTER TABLE recetas ADD COLUMN hogar_id UUID REFERENCES hogares(id) ON DELETE CASCADE;
CREATE INDEX idx_recetas_hogar ON recetas (hogar_id);

-- Antes era la columna recetas.favorita, así que marcar una favorita se la
-- marcaba a todo el mundo.
CREATE TABLE favoritas (
  hogar_id  UUID NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (hogar_id, receta_id)
);

CREATE INDEX idx_favoritas_receta ON favoritas (receta_id);

-- Las que ya estaban marcadas pasan al hogar de Karim y Cloe, que es quien las
-- marcó.
INSERT INTO favoritas (hogar_id, receta_id)
SELECT '00000000-0000-0000-0000-000000000001', id
FROM recetas
WHERE favorita AND borrada_en IS NULL;

COMMIT;

-- recetas.favorita se queda un despliegue como red y se borra después, en
-- 2026-08-favorita-columna-fuera.sql.
