-- La cebolla se cuenta en piezas, no se pesa: 150 g = 1 ud.
-- Pasa a 'ud' las 39 recetas que aun la pedian en gramos y reescribe el paso
-- donde se pica, para que lista e instrucciones digan lo mismo.
BEGIN;

WITH nuevas(receta_id, ingrediente, uds) AS (VALUES
  ('0ecc72ab-7cb2-4f4d-9231-e45b797929dd'::uuid, 'cebolla', 0.75::float8),
  ('1148cb8b-329f-4dab-93cc-aa1a4be2a7e0'::uuid, 'cebolla', 1.5::float8),
  ('73c99e9a-6562-4c52-8c07-3600a9dc6793'::uuid, 'cebolla roja', 0.75::float8),
  ('8686d682-c2e8-4f86-943c-82804178a860'::uuid, 'cebolla', 1::float8),
  ('7689dade-2b0f-4713-b278-3ff09cac8360'::uuid, 'cebolla', 1::float8),
  ('938d595f-6e37-49fd-9c21-65ff110bc7b5'::uuid, 'cebolla', 1::float8),
  ('4defada8-e5cb-4848-95f7-6d2382858378'::uuid, 'cebolla', 1::float8),
  ('c51d54af-4394-4839-bada-3a3d9339b213'::uuid, 'cebolla', 2::float8),
  ('90ad3e3a-7d50-44c5-9736-7d476481ac16'::uuid, 'cebolla', 1.5::float8),
  ('daac7a4a-8099-4efe-a95f-a366fc163658'::uuid, 'cebolla', 2.5::float8),
  ('109e05b0-c65a-41f5-be57-a6875ebe6cad'::uuid, 'cebolla', 1::float8),
  ('20ecbb9a-00c3-4311-8bef-dc7a3bdc8e5c'::uuid, 'cebolla', 0.75::float8),
  ('dc02dbfa-366b-4e1e-96a4-f84901d6a9dd'::uuid, 'cebolla', 0.75::float8),
  ('a3ff6c29-8058-4b10-aa44-6592a66a6fae'::uuid, 'cebolla', 1.5::float8),
  ('36e84115-1e98-41f4-8879-d8fbe645558e'::uuid, 'cebolla', 1::float8),
  ('bb741f6b-1d04-4f68-80fd-06dac5da2b33'::uuid, 'cebolla', 1::float8),
  ('2a1a812d-5d7d-45ae-b723-e14802bfc9fc'::uuid, 'cebolla', 1::float8),
  ('ea9c6b10-5a96-477f-8d14-68e7df834dff'::uuid, 'cebolla', 1::float8),
  ('6842428f-03d5-4a05-b021-36eb549f8ded'::uuid, 'cebolla', 1::float8),
  ('2aaafee4-e506-4108-a044-942caf8737dd'::uuid, 'cebolla', 1::float8),
  ('5ba2f843-ea13-43a0-9e44-5b1f9b6a344c'::uuid, 'cebolla', 0.75::float8),
  ('f423f3e0-0371-4234-b693-2f9a284e5f69'::uuid, 'cebolla', 0.75::float8),
  ('a70101c7-0454-49ac-838a-80600a2fbe58'::uuid, 'cebolla', 0.75::float8),
  ('c36acff5-b6cf-4aa7-9151-d6b3d38ad120'::uuid, 'cebolla', 0.75::float8),
  ('37b8bd0f-fab9-4e31-aaf9-014ea663844e'::uuid, 'cebolla', 0.5::float8),
  ('38e61f38-2b2a-4359-91a0-669eb432b42b'::uuid, 'cebolla roja', 0.75::float8),
  ('4e49e691-ed07-4a98-af21-c1fa3ccff6c4'::uuid, 'cebolla', 0.75::float8),
  ('9295f461-4b80-4266-aebc-6b7efa677c7a'::uuid, 'cebolla', 0.75::float8),
  ('6199b74d-6f85-4058-91ad-893d1b47d00c'::uuid, 'cebolla', 0.75::float8),
  ('d43180e4-1ac3-4dab-b6b4-e3873d540028'::uuid, 'cebolla', 0.75::float8),
  ('4e4bcdec-bc69-4706-b7c5-58d380d0c39c'::uuid, 'cebolla', 0.5::float8),
  ('7c52d666-22fb-49f4-8b93-f7139ba55c58'::uuid, 'cebolla', 0.75::float8),
  ('615274ad-569f-4810-8fc7-9ba24ddb3db4'::uuid, 'cebolla', 0.5::float8),
  ('8c94464e-4b73-4f7e-bee3-ecc9d9c16c56'::uuid, 'cebolla roja', 0.25::float8),
  ('cc8086ca-a9bd-46c3-88e3-0d34cafe06dd'::uuid, 'cebolla', 0.25::float8),
  ('ce26054c-6944-4ddc-a02b-4a906e4f2775'::uuid, 'cebolla roja', 0.25::float8),
  ('e16b9b15-33b1-4faf-9154-c40718bd6191'::uuid, 'cebolla', 0.75::float8),
  ('f8824767-3a9d-493d-84f6-b35815b2c1ba'::uuid, 'cebolla', 0.5::float8),
  ('b80b82ea-48b6-4372-9fd6-3ab0fe6f8b64'::uuid, 'cebolla', 1::float8)
)
UPDATE recetas r
SET ingredientes = (
  SELECT jsonb_agg(
           CASE WHEN i->>'nombre' = n.ingrediente AND i->>'unidad' = 'g'
                THEN i || jsonb_build_object('unidad', 'ud', 'cantidad', n.uds)
                ELSE i END
           ORDER BY o)
  FROM jsonb_array_elements(r.ingredientes) WITH ORDINALITY t(i, o)
)
FROM nuevas n
WHERE r.id = n.receta_id;

WITH cambios(receta_id, viejo, nuevo) AS (VALUES
  ('0ecc72ab-7cb2-4f4d-9231-e45b797929dd'::uuid, 'pica {120 g} de cebolla en dados pequeños', 'pica {0,75 de cebolla} en dados pequeños'),
  ('1148cb8b-329f-4dab-93cc-aa1a4be2a7e0'::uuid, 'cortas las {250 g} de cebolla en aros', 'cortas {1,5 cebollas} en aros'),
  ('73c99e9a-6562-4c52-8c07-3600a9dc6793'::uuid, 'Corta los {100 g} de cebolla roja en aros muy finos y ponlos 10 min en un bol con el zumo del {1 limón} y una pizca de sal, para que pierdan el picor.', 'Corta {0,75 de cebolla roja} en aros muy finos y ponla 10 min en un bol con el zumo del {1 limón} y una pizca de sal, para que pierda el picor.'),
  ('8686d682-c2e8-4f86-943c-82804178a860'::uuid, 'pica los {150 g} de cebolla en dados pequeños', 'pica {1 cebolla} en dados pequeños'),
  ('7689dade-2b0f-4713-b278-3ff09cac8360'::uuid, 'Pica los {150 g} de cebolla en dados pequeños', 'Pica {1 cebolla} en dados pequeños'),
  ('938d595f-6e37-49fd-9c21-65ff110bc7b5'::uuid, 'los {150 g} de cebolla en juliana gruesa', '{1 cebolla} en juliana gruesa'),
  ('4defada8-e5cb-4848-95f7-6d2382858378'::uuid, 'pica los {150 g} de cebolla fina', 'pica {1 cebolla} fina'),
  ('c51d54af-4394-4839-bada-3a3d9339b213'::uuid, 'Corta las {300 g} de cebolla en juliana gruesa', 'Corta {2 cebollas} en juliana gruesa'),
  ('90ad3e3a-7d50-44c5-9736-7d476481ac16'::uuid, 'Corta las {200 g} de cebolla en juliana', 'Corta {1,5 cebollas} en juliana'),
  ('daac7a4a-8099-4efe-a95f-a366fc163658'::uuid, 'Pica las {400 g} de cebolla en dados muy pequeños, a cuchillo y no en picadora, porque la picadora la deja aguada.', 'Pica {2,5 cebollas} en dados muy pequeños, a cuchillo y no en picadora, porque la picadora las deja aguadas.'),
  ('109e05b0-c65a-41f5-be57-a6875ebe6cad'::uuid, 'Corta las {150 g} de cebolla en juliana gruesa', 'Corta {1 cebolla} en juliana gruesa'),
  ('20ecbb9a-00c3-4311-8bef-dc7a3bdc8e5c'::uuid, 'Pica las {120 g} de cebolla fina', 'Pica {0,75 de cebolla} fina'),
  ('dc02dbfa-366b-4e1e-96a4-f84901d6a9dd'::uuid, 'pica las {120 g} de cebolla.', 'pica {0,75 de cebolla}.'),
  ('a3ff6c29-8058-4b10-aa44-6592a66a6fae'::uuid, 'las {200 g} de cebolla en dados pequeños', '{1,5 cebollas} en dados pequeños'),
  ('36e84115-1e98-41f4-8879-d8fbe645558e'::uuid, 'Corta las {150 g} de cebolla en juliana fina', 'Corta {1 cebolla} en juliana fina'),
  ('bb741f6b-1d04-4f68-80fd-06dac5da2b33'::uuid, 'pica las {150 g} de cebolla y corta', 'pica {1 cebolla} y corta'),
  ('2a1a812d-5d7d-45ae-b723-e14802bfc9fc'::uuid, 'las {150 g} de cebolla en juliana', '{1 cebolla} en juliana'),
  ('ea9c6b10-5a96-477f-8d14-68e7df834dff'::uuid, 'media {120 g} de cebolla', '{0,5 de cebolla}'),
  ('6842428f-03d5-4a05-b021-36eb549f8ded'::uuid, 'la mitad de las {120 g} de cebolla', '{0,5 de cebolla}'),
  ('2aaafee4-e506-4108-a044-942caf8737dd'::uuid, 'las {120 g} de cebolla en cuartos', 'la {1 cebolla} en cuartos'),
  ('5ba2f843-ea13-43a0-9e44-5b1f9b6a344c'::uuid, 'pica las {120 g} de cebolla,', 'pica {0,75 de cebolla},'),
  ('f423f3e0-0371-4234-b693-2f9a284e5f69'::uuid, 'Pica las {120 g} de cebolla,', 'Pica {0,75 de cebolla},'),
  ('a70101c7-0454-49ac-838a-80600a2fbe58'::uuid, 'Pica las {120 g} de cebolla y corta', 'Pica {0,75 de cebolla} y corta'),
  ('c36acff5-b6cf-4aa7-9151-d6b3d38ad120'::uuid, 'pica las {120 g} de cebolla,', 'pica {0,75 de cebolla},'),
  ('37b8bd0f-fab9-4e31-aaf9-014ea663844e'::uuid, '{60 g} de cebolla en pluma', '{0,5 de cebolla} en pluma'),
  ('38e61f38-2b2a-4359-91a0-669eb432b42b'::uuid, 'corta {100 g} de cebolla roja en aros finos', 'corta {0,75 de cebolla roja} en aros finos'),
  ('4e49e691-ed07-4a98-af21-c1fa3ccff6c4'::uuid, 'Pica las {120 g} de cebolla en dados pequeños', 'Pica {0,75 de cebolla} en dados pequeños'),
  ('9295f461-4b80-4266-aebc-6b7efa677c7a'::uuid, 'Pica las {120 g} de cebolla en dados pequeños', 'Pica {0,75 de cebolla} en dados pequeños'),
  ('6199b74d-6f85-4058-91ad-893d1b47d00c'::uuid, 'Pica las {120 g} de cebolla,', 'Pica {0,75 de cebolla},'),
  ('d43180e4-1ac3-4dab-b6b4-e3873d540028'::uuid, 'pica las {120 g} de cebolla.', 'pica {0,75 de cebolla}.'),
  ('4e4bcdec-bc69-4706-b7c5-58d380d0c39c'::uuid, 'Ralla {80 g} de cebolla por el lado grueso', 'Ralla {0,5 de cebolla} por el lado grueso'),
  ('7c52d666-22fb-49f4-8b93-f7139ba55c58'::uuid, 'Pica las {120 g} de cebolla y los {3 dientes}', 'Pica {0,75 de cebolla} y los {3 dientes}'),
  ('615274ad-569f-4810-8fc7-9ba24ddb3db4'::uuid, '{80 g} de cebolla en pluma', '{0,5 de cebolla} en pluma'),
  ('8c94464e-4b73-4f7e-bee3-ecc9d9c16c56'::uuid, 'Corta {40 g} de cebolla roja en aros finos', 'Corta {0,25 de cebolla roja} en aros finos'),
  ('cc8086ca-a9bd-46c3-88e3-0d34cafe06dd'::uuid, '{40 g} de cebolla picada muy fina', '{0,25 de cebolla} picada muy fina'),
  ('ce26054c-6944-4ddc-a02b-4a906e4f2775'::uuid, 'corta {40 g} de cebolla roja en aros muy finos', 'corta {0,25 de cebolla roja} en aros muy finos'),
  ('e16b9b15-33b1-4faf-9154-c40718bd6191'::uuid, 'Pica {100 g} de cebolla en dados muy pequeños.', 'Pica {0,75 de cebolla} en dados muy pequeños.'),
  ('f8824767-3a9d-493d-84f6-b35815b2c1ba'::uuid, 'Pica {60 g} de cebolla en dados muy pequeños.', 'Pica {0,5 de cebolla} en dados muy pequeños.')
)
UPDATE recetas r
SET pasos = (
  SELECT jsonb_agg(replace(p, c.viejo, c.nuevo) ORDER BY o)
  FROM jsonb_array_elements_text(r.pasos) WITH ORDINALITY t(p, o)
)
FROM cambios c
WHERE r.id = c.receta_id;

COMMIT;
