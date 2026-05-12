 CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
  );

  CREATE TABLE recetas (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre              VARCHAR(150) NOT NULL,
    precio_por_porcion  NUMERIC(10,2) NOT NULL CHECK (precio_por_porcion > 0),
    porciones           INTEGER NOT NULL DEFAULT 1,
    category_id         UUID NOT NULL,
    CONSTRAINT fk_category FOREIGN KEY (category_id)
      REFERENCES categories(id) ON DELETE RESTRICT