-- Fase 1 del plan multiusuario, paso 1 de 2.
--
-- El estado de la app deja de ser una fila única global y pasa a pertenecer a
-- un hogar. Todavía sin login: el backend usa el hogar por defecto.
--
-- Esta mitad solo AÑADE. Deja la columna id en su sitio, así que el código
-- viejo (WHERE id = 1, ON CONFLICT (id)) sigue funcionando mientras se
-- despliega el nuevo, y producción no se cae en ningún momento.
-- La otra mitad, que quita id, va en 2026-08-multiusuario-contraer.sql y se
-- aplica DESPUÉS de desplegar.

BEGIN;

CREATE TABLE hogares (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre    TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- UUID fijo: es el hogar de Karim y Cloe, y el backend lo referencia como
-- constante hasta que la fase 3 lo saque de la sesión.
INSERT INTO hogares (id, nombre)
VALUES ('00000000-0000-0000-0000-000000000001', 'Karim y Cloe');

ALTER TABLE app_estado DROP CONSTRAINT app_estado_single_row;
ALTER TABLE app_estado ADD COLUMN hogar_id UUID REFERENCES hogares(id) ON DELETE CASCADE;

UPDATE app_estado SET hogar_id = '00000000-0000-0000-0000-000000000001';

ALTER TABLE app_estado ALTER COLUMN hogar_id SET NOT NULL;

-- El ON CONFLICT (hogar_id) del código nuevo necesita este índice único. La
-- clave primaria sigue siendo id hasta la migración de contracción.
ALTER TABLE app_estado ADD CONSTRAINT app_estado_hogar_unico UNIQUE (hogar_id);

COMMIT;
