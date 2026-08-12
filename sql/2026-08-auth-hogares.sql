BEGIN;

CREATE TABLE miembros (
  usuario_id UUID PRIMARY KEY,
  hogar_id   UUID NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  rol        TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_miembros_hogar ON miembros (hogar_id);

CREATE TABLE invitados (
  email       TEXT PRIMARY KEY CHECK (email = lower(email)),
  hogar_id    UUID REFERENCES hogares(id) ON DELETE CASCADE,
  rol         TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
  invitado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  usado_en    TIMESTAMPTZ
);

COMMIT;
