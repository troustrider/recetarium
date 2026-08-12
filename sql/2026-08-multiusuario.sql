BEGIN;

CREATE TABLE hogares (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre    TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO hogares (id, nombre)
VALUES ('00000000-0000-0000-0000-000000000001', 'Karim y Cloe');

ALTER TABLE app_estado DROP CONSTRAINT app_estado_single_row;
ALTER TABLE app_estado ADD COLUMN hogar_id UUID REFERENCES hogares(id) ON DELETE CASCADE;

UPDATE app_estado SET hogar_id = '00000000-0000-0000-0000-000000000001';

ALTER TABLE app_estado ALTER COLUMN hogar_id SET NOT NULL;

ALTER TABLE app_estado ADD CONSTRAINT app_estado_hogar_unico UNIQUE (hogar_id);

COMMIT;
