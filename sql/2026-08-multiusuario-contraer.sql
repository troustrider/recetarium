BEGIN;

ALTER TABLE app_estado DROP CONSTRAINT app_estado_pkey;
ALTER TABLE app_estado DROP COLUMN id;
ALTER TABLE app_estado ADD PRIMARY KEY (hogar_id);

ALTER TABLE app_estado DROP CONSTRAINT app_estado_hogar_unico;

COMMIT;
