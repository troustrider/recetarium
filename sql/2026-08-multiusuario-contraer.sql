-- Fase 1 del plan multiusuario (docs/PLAN-multiusuario-auth.md), paso 2 de 2.
--
-- Quita la columna id y pasa la clave primaria a hogar_id.
--
-- APLICAR SOLO DESPUÉS de que el código nuevo esté desplegado y verificado.
-- Una vez ejecutada, cualquier código que haga WHERE id = 1 deja de funcionar.
--
-- app_estado tiene una fila por hogar y de momento solo hay un hogar, así que
-- cambiarle la clave primaria es seguro.

BEGIN;

ALTER TABLE app_estado DROP CONSTRAINT app_estado_pkey;
ALTER TABLE app_estado DROP COLUMN id;
ALTER TABLE app_estado ADD PRIMARY KEY (hogar_id);

-- Redundante con la clave primaria recién creada.
ALTER TABLE app_estado DROP CONSTRAINT app_estado_hogar_unico;

COMMIT;
