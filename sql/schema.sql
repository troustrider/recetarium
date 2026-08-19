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
    imagen              TEXT,
    ingredientes        JSONB NOT NULL DEFAULT '[]'::jsonb,
    pasos               JSONB NOT NULL DEFAULT '[]'::jsonb,
    consejos            JSONB NOT NULL DEFAULT '[]'::jsonb,
    precio_por_porcion  NUMERIC(10,2) NOT NULL CHECK (precio_por_porcion > 0),
    porciones           INTEGER NOT NULL DEFAULT 1,
    calorias            INTEGER,
    proteinas           NUMERIC(5,1),
    carbohidratos       NUMERIC(5,1),
    grasas              NUMERIC(5,1),
    hierro              NUMERIC(5,1),
    sin_gluten          BOOLEAN,
    micros              JSONB,
    guarnicion          JSONB,
    tipo                VARCHAR(30) NOT NULL DEFAULT 'principal',
    borrada_en          TIMESTAMPTZ,
    hogar_id            UUID REFERENCES hogares(id) ON DELETE CASCADE,
    category_id         UUID NOT NULL,
    CONSTRAINT fk_category FOREIGN KEY (category_id)
      REFERENCES categories(id) ON DELETE RESTRICT
  );

  CREATE INDEX idx_recetas_vivas ON recetas (id) WHERE borrada_en IS NULL;

  CREATE TABLE hogares (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre    TEXT NOT NULL,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE favoritas (
    hogar_id  UUID NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
    receta_id UUID NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    creada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (hogar_id, receta_id)
  );

  CREATE TABLE app_estado (
    hogar_id   UUID PRIMARY KEY REFERENCES hogares(id) ON DELETE CASCADE,
    plan       JSONB NOT NULL DEFAULT '[]'::jsonb,
    despensa   JSONB NOT NULL DEFAULT '[]'::jsonb,
    extras     JSONB NOT NULL DEFAULT '[]'::jsonb,
    pendientes JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE miembros (
    usuario_id UUID PRIMARY KEY,
    hogar_id   UUID NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
    rol        TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
    creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE invitados (
    email       TEXT PRIMARY KEY CHECK (email = lower(email)),
    hogar_id    UUID REFERENCES hogares(id) ON DELETE CASCADE,
    rol         TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
    invitado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    usado_en    TIMESTAMPTZ
  );

  CREATE TABLE usuarios (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT NOT NULL UNIQUE CHECK (email = lower(email)),
    nombre     TEXT,
    imagen     TEXT,
    google_sub TEXT UNIQUE,
    suspendido BOOLEAN NOT NULL DEFAULT false,
    creado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
    visto_en   TIMESTAMPTZ
  );

  CREATE TABLE sesiones (
    token_hash TEXT PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    creada_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expira_en  TIMESTAMPTZ NOT NULL,
    ip         TEXT,
    agente     TEXT
  );

  CREATE TABLE oauth_estados (
    estado      TEXT PRIMARY KEY,
    verificador TEXT NOT NULL,
    destino     TEXT NOT NULL,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
  );
