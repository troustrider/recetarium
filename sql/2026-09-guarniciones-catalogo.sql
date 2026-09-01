-- La guarnición deja de vivir copiada dentro de cada receta y pasa a catálogo.
-- Había 386 objetos JSONB para 83 nombres, con seis versiones distintas del
-- arroz blanco: unas en vaso y otras en gramos, unas de 12 min y otras de 15.
-- Con el catálogo, el arroz se arregla una vez.
--
-- La columna `recetas.guarnicion` se queda hasta que el volcado esté verificado;
-- la retira `2026-09-guarniciones-retirar-columna.sql`.

CREATE TABLE IF NOT EXISTS guarniciones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         VARCHAR(150) NOT NULL,
  ingredientes   JSONB NOT NULL DEFAULT '[]'::jsonb,
  pasos          JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Familias de cocina y cocinas sueltas donde la guarnición es de la casa.
  cocinas        TEXT[] NOT NULL DEFAULT '{}',
  -- Qué pone en la mesa: verdura, almidon, proteina. De aquí sale la puerta
  -- de comida completa, que ya no mira si el campo está relleno sino qué trae.
  aporta         TEXT[] NOT NULL DEFAULT '{}',
  calorias       INTEGER,
  proteinas      NUMERIC(5,1),
  carbohidratos  NUMERIC(5,1),
  grasas         NUMERIC(5,1),
  hierro         NUMERIC(5,1),
  sin_gluten     BOOLEAN,
  micros         JSONB,
  apto           JSONB,
  hogar_id       UUID REFERENCES hogares(id) ON DELETE CASCADE,
  borrada_en     TIMESTAMPTZ
);

-- El nombre identifica la guarnición dentro de su hogar; las del catálogo
-- compartido llevan hogar_id NULL, y en Postgres NULL no colisiona en un
-- UNIQUE normal, así que hacen falta dos índices.
CREATE UNIQUE INDEX IF NOT EXISTS idx_guarniciones_nombre_comun
  ON guarniciones (nombre) WHERE hogar_id IS NULL AND borrada_en IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_guarniciones_nombre_hogar
  ON guarniciones (hogar_id, nombre) WHERE hogar_id IS NOT NULL AND borrada_en IS NULL;

CREATE TABLE IF NOT EXISTS receta_guarniciones (
  receta_id     UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  guarnicion_id UUID NOT NULL REFERENCES guarniciones(id) ON DELETE RESTRICT,
  -- 0 es la recomendada: la que el planificador enciende al montar la semana.
  orden         SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (receta_id, guarnicion_id)
);

CREATE INDEX IF NOT EXISTS idx_receta_guarniciones_receta
  ON receta_guarniciones (receta_id, orden);
