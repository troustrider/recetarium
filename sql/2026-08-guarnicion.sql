-- Guarnición opcional del plato, en columna propia y no dentro de `ingredientes`.
--
-- Va aparte a propósito. Hay once sitios que recorren `receta.ingredientes`
-- (lista de la compra, consumo de despensa, buscador, modo cocina, precio); si
-- la guarnición viviera ahí dentro, todos empezarían a verla y el que se
-- olvidara de filtrarla fallaría en silencio y hacia el lado malo, metiéndote en
-- la compra el arroz de una guarnición que no vas a hacer. En columna aparte, el
-- que no la conoce simplemente no la ofrece.
--
-- Y sobre todo: `calorias`, `sin_gluten` y `micros` los calcula el servidor desde
-- `ingredientes` en cada guardado. Si la guarnición entrara ahí, un arroz o una
-- pasta marcarían el plato entero como con gluten aunque no la prepares.
--
-- Forma del jsonb (la nutrición la calcula el servidor al guardar, no el cliente):
--   { nombre, ingredientes: [...], pasos: [...],
--     calorias, proteinas, carbohidratos, grasas, hierro, sinGluten, micros }
--
-- null = el plato no lleva guarnición. Las recetas existentes se quedan así.

ALTER TABLE recetas
  ADD COLUMN IF NOT EXISTS guarnicion JSONB;
