-- Cierre de la fase 4 (docs/PLAN-multiusuario-auth.md).
--
-- favorita paso a la tabla favoritas, por hogar. La columna se quedo un
-- despliegue como red por si habia que volver atras; a partir de aqui es una
-- fuente de verdad duplicada que nadie lee.
--
-- APLICAR SOLO cuando el catalogo por hogar lleve un rato en vivo sin sorpresas.

BEGIN;

ALTER TABLE recetas DROP COLUMN favorita;

COMMIT;
