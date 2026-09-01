-- Segunda mitad de la migración a catálogo. Se corre cuando el reparto de
-- `receta_guarniciones` esté verificado en producción y la app desplegada:
-- hasta entonces la columna vieja se queda como red, aunque ya no la lea nadie.
--
--   SELECT count(*) FROM recetas WHERE guarnicion IS NOT NULL;   -- lo que había
--   SELECT count(DISTINCT receta_id) FROM receta_guarniciones;   -- lo que hay

ALTER TABLE recetas DROP COLUMN IF EXISTS guarnicion;
