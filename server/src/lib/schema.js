import { pgTable, uuid, varchar, numeric, integer, boolean, text, jsonb } from 'drizzle-orm/pg-core'

export const categories = pgTable('categories', {
  id:          uuid('id').primaryKey().defaultRandom(),
  name:        varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
})

export const recetas = pgTable('recetas', {
  id:                uuid('id').primaryKey().defaultRandom(),
  nombre:            varchar('nombre', { length: 150 }).notNull(),
  categoria:         varchar('categoria', { length: 100 }),
  tiempoPreparacion: integer('tiempo_preparacion'),
  favorita:          boolean('favorita').notNull().default(false),
  imagen:            text('imagen'),
  precioPorPorcion:  numeric('precio_por_porcion', { precision: 10, scale: 2 }).notNull(),
  porciones:         integer('porciones').notNull().default(1),
  categoryId:        uuid('category_id').notNull().references(() => categories.id),
  ingredientes:      jsonb('ingredientes'),
  pasos:             jsonb('pasos'),
})
