-- Fase 2 del plan multiusuario.
-- Une los usuarios de Neon Auth con los hogares, y la lista blanca de acceso.
--
-- Los usuarios viven en neon_auth.user, que gestiona Neon. No se les pone
-- FOREIGN KEY a propósito: es el esquema de un servicio gestionado y puede
-- recrear sus tablas en cualquier migración suya, lo que dejaría la nuestra
-- bloqueada o rota. El JOIN sí funciona, que es lo que necesitamos.

BEGIN;

-- Quién pertenece a qué hogar. Varios usuarios en el mismo hogar es el caso
-- normal, no la excepción: Karim y Cloe comparten despensa y plan.
CREATE TABLE miembros (
  usuario_id UUID PRIMARY KEY,
  hogar_id   UUID NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  rol        TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_miembros_hogar ON miembros (hogar_id);

-- Lista blanca. Sin fila aquí no se entra, aunque se tenga cuenta de Google.
--
-- hogar_id NULL significa "créale un hogar propio y vacío al entrar". Relleno
-- significa "métele en ese hogar", que es como se invita a la pareja de alguien
-- que ya está dentro.
--
-- El email se guarda siempre en minúsculas; quien consulte esta tabla debe
-- normalizar antes de comparar.
CREATE TABLE invitados (
  email       TEXT PRIMARY KEY CHECK (email = lower(email)),
  hogar_id    UUID REFERENCES hogares(id) ON DELETE CASCADE,
  rol         TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario')),
  invitado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  usado_en    TIMESTAMPTZ
);

COMMIT;

-- Las invitaciones NO van aquí. Este repositorio es público y un correo es dato
-- personal, así que la lista blanca se rellena con:
--
--   node server/scripts/invitar.mjs <correo> --compartido --admin
--   node server/scripts/invitar.mjs <correo> --propio
