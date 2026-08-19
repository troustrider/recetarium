BEGIN;

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

-- Conserva el id de cada identidad ya existente: miembros y hogares apuntan a él.
INSERT INTO usuarios (id, email, nombre, imagen, suspendido, creado_en)
SELECT id::uuid, lower(email), name, image, coalesce(banned, false), "createdAt"
FROM neon_auth."user"
ON CONFLICT (id) DO NOTHING;

CREATE TABLE sesiones (
  token_hash TEXT PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  creada_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_en  TIMESTAMPTZ NOT NULL,
  ip         TEXT,
  agente     TEXT
);

CREATE INDEX idx_sesiones_usuario ON sesiones (usuario_id);
CREATE INDEX idx_sesiones_expira ON sesiones (expira_en);

CREATE TABLE oauth_estados (
  estado      TEXT PRIMARY KEY,
  verificador TEXT NOT NULL,
  destino     TEXT NOT NULL,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
