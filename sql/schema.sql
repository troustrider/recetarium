 CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
  );

  CREATE TABLE recetas (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre              VARCHAR(150) NOT NULL,
    categoria           VARCHAR(100),
    tiempo_preparacion  INTEGER,
    favorita            BOOLEAN NOT NULL DEFAULT false,
    imagen              TEXT,
    ingredientes        JSONB NOT NULL DEFAULT '[]'::jsonb,
    pasos               JSONB NOT NULL DEFAULT '[]'::jsonb,
    consejos            JSONB NOT NULL DEFAULT '[]'::jsonb,
    precio_por_porcion  NUMERIC(10,2) NOT NULL CHECK (precio_por_porcion > 0),
    porciones           INTEGER NOT NULL DEFAULT 1,
    -- Nutrición por porción (opcional)
    calorias            INTEGER,
    proteinas           NUMERIC(5,1),
    carbohidratos       NUMERIC(5,1),
    grasas              NUMERIC(5,1),
    -- Hierro mg/porción. En columna para poder filtrar y ordenar por él.
    hierro              NUMERIC(5,1),
    -- true = sin gluten, false = lleva, null = algún ingrediente sin ficha (no afirmable)
    sin_gluten          BOOLEAN,
    -- Resto de micros por porción: {fibra, azucares, saturadas, sal, hierroHemo,
    -- vitaminaC, calcio, b12, folato, gluten: {fuentes, evitable}, estimadoDe}
    micros              JSONB,
    -- Tipo de plato: principal | postre | desayuno | entrante
    tipo                VARCHAR(30) NOT NULL DEFAULT 'principal',
    category_id         UUID NOT NULL,
    CONSTRAINT fk_category FOREIGN KEY (category_id)
      REFERENCES categories(id) ON DELETE RESTRICT
  );

  -- Un hogar es el dueño del estado: uno o varios usuarios que comparten
  -- despensa, plan y lista de la compra.
  CREATE TABLE hogares (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre    TEXT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- Estado de la app, una fila por hogar. Guarda el plan semanal como
  -- [{dia, recetaId, raciones}], la despensa, los extras de la lista y las
  -- recetas compradas pendientes de planificar como [{recetaId, raciones}].
  CREATE TABLE app_estado (
    hogar_id   UUID PRIMARY KEY REFERENCES hogares(id) ON DELETE CASCADE,
    plan       JSONB NOT NULL DEFAULT '[]'::jsonb,
    despensa   JSONB NOT NULL DEFAULT '[]'::jsonb,
    extras     JSONB NOT NULL DEFAULT '[]'::jsonb,
    pendientes JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
