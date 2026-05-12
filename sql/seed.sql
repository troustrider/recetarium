-- Reset
TRUNCATE TABLE recetas, categories RESTART IDENTITY CASCADE;

-- Categories (5 sabores)
INSERT INTO categories (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'salado',  'Platos salados y savory'),
  ('22222222-2222-2222-2222-222222222222', 'dulce',   'Postres y platos dulces'),
  ('33333333-3333-3333-3333-333333333333', 'amargo',  'Platos con sabor amargo o intenso'),
  ('44444444-4444-4444-4444-444444444444', 'umami',   'Platos con sabor umami'),
  ('55555555-5555-5555-5555-555555555555', 'acido',   'Platos con sabor acido');

-- Recetas
INSERT INTO recetas (id, nombre, categoria, tiempo_preparacion, favorita, imagen, precio_por_porcion, porciones, category_id, ingredientes, pasos) VALUES

('a1b2c3d4-0001-4000-8000-000000000001',
 'Paella valenciana', 'arroces', 60, false,
 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=800&q=80&crop=entropy',
 3.50, 4, '11111111-1111-1111-1111-111111111111',
 '[{"nombre":"arroz bomba","cantidad":400,"unidad":"g","familia":"cereales"},{"nombre":"pollo","cantidad":500,"unidad":"g","familia":"carnes"},{"nombre":"conejo","cantidad":400,"unidad":"g","familia":"carnes"},{"nombre":"judia verde plana","cantidad":200,"unidad":"g","familia":"verduras"},{"nombre":"garrofon","cantidad":100,"unidad":"g","familia":"legumbres"},{"nombre":"tomate triturado","cantidad":150,"unidad":"g","familia":"verduras"},{"nombre":"pimenton dulce","cantidad":1,"unidad":"cdta","familia":"especias"},{"nombre":"azafran","cantidad":1,"unidad":"pizca","familia":"especias"},{"nombre":"caldo de pollo","cantidad":1200,"unidad":"ml","familia":"caldos"},{"nombre":"aceite de oliva","cantidad":60,"unidad":"ml","familia":"aceites"}]',
 '["Calienta el aceite en la paellera y sofrie el pollo y el conejo troceados hasta dorarlos bien.","Añade las judias verdes y el garrofon, sofrie 5 minutos.","Incorpora el tomate triturado y el pimenton, remueve rapido para que no se queme.","Vierte el caldo caliente con el azafran disuelto y lleva a ebullicion.","Añade el arroz en forma de cruz y repartelo sin remover.","Cocina a fuego fuerte 8 minutos, luego baja el fuego y cocina 10 minutos mas.","Deja reposar 5 minutos tapado antes de servir."]'),

('a1b2c3d4-0002-4000-8000-000000000002',
 'Ramen de pollo', 'sopas', 50, false,
 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80&crop=entropy',
 4.00, 2, '44444444-4444-4444-4444-444444444444',
 '[{"nombre":"fideos ramen","cantidad":200,"unidad":"g","familia":"cereales"},{"nombre":"caldo de pollo","cantidad":1000,"unidad":"ml","familia":"caldos"},{"nombre":"pechuga de pollo","cantidad":300,"unidad":"g","familia":"carnes"},{"nombre":"salsa de soja","cantidad":40,"unidad":"ml","familia":"salsas"},{"nombre":"miso blanco","cantidad":2,"unidad":"cda","familia":"salsas"},{"nombre":"huevo","cantidad":2,"unidad":"ud","familia":"huevos"},{"nombre":"cebolleta","cantidad":2,"unidad":"ud","familia":"verduras"},{"nombre":"alga nori","cantidad":2,"unidad":"hoja","familia":"otros"},{"nombre":"maiz dulce","cantidad":100,"unidad":"g","familia":"verduras"},{"nombre":"jengibre fresco","cantidad":20,"unidad":"g","familia":"especias"}]',
 '["Cuece los huevos 7 minutos para que queden cremosos, pela y reserva.","Calienta el caldo con el jengibre rallado, la soja y el miso.","Pocha el pollo en el caldo a fuego suave durante 15 minutos, luego desmenuza.","Cuece los fideos segun el paquete y escurrelos.","Sirve los fideos en el caldo caliente y coloca encima el pollo, el huevo partido, el maiz, la cebolleta picada y el nori."]'),

('a1b2c3d4-0003-4000-8000-000000000003',
 'Gyozas de cerdo y col', 'asiatica', 45, false,
 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&q=80&crop=entropy',
 2.50, 4, '44444444-4444-4444-4444-444444444444',
 '[{"nombre":"obleas de gyoza","cantidad":24,"unidad":"ud","familia":"cereales"},{"nombre":"carne picada de cerdo","cantidad":300,"unidad":"g","familia":"carnes"},{"nombre":"col china","cantidad":200,"unidad":"g","familia":"verduras"},{"nombre":"cebolleta","cantidad":2,"unidad":"ud","familia":"verduras"},{"nombre":"jengibre fresco","cantidad":15,"unidad":"g","familia":"especias"},{"nombre":"salsa de soja","cantidad":20,"unidad":"ml","familia":"salsas"},{"nombre":"aceite de sesamo","cantidad":10,"unidad":"ml","familia":"aceites"}]',
 '["Pica fina la col, sala y deja 10 minutos. Escurre bien apretando con las manos.","Mezcla la carne con la col, la cebolleta, el jengibre rallado, la soja y el aceite de sesamo.","Coloca una cucharada del relleno en el centro de cada oblea. Moja el borde con agua y cierra formando pliegues.","Calienta aceite en una sarten antiadherente y dora las gyozas por la base 2 minutos.","Añade 60 ml de agua, tapa y cocina al vapor 5 minutos.","Destapa y deja que evapore el agua hasta que la base vuelva a crujir.","Sirve con salsa de soja y vinagre de arroz."]'),

('a1b2c3d4-0004-4000-8000-000000000004',
 'Pad Thai de gambas', 'asiatica', 25, false,
 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80&crop=entropy',
 5.00, 2, '55555555-5555-5555-5555-555555555555',
 '[{"nombre":"fideos de arroz planos","cantidad":200,"unidad":"g","familia":"cereales"},{"nombre":"gambas peladas","cantidad":250,"unidad":"g","familia":"pescados"},{"nombre":"huevo","cantidad":2,"unidad":"ud","familia":"huevos"},{"nombre":"brotes de soja","cantidad":150,"unidad":"g","familia":"verduras"},{"nombre":"cebolleta","cantidad":3,"unidad":"ud","familia":"verduras"},{"nombre":"salsa de tamarindo","cantidad":40,"unidad":"ml","familia":"salsas"},{"nombre":"salsa de pescado","cantidad":30,"unidad":"ml","familia":"salsas"},{"nombre":"azucar de palma","cantidad":20,"unidad":"g","familia":"dulces"},{"nombre":"cacahuetes tostados","cantidad":50,"unidad":"g","familia":"frutos secos"},{"nombre":"lima","cantidad":1,"unidad":"ud","familia":"frutas"}]',
 '["Remoja los fideos en agua fria 30 minutos.","Mezcla el tamarindo, la salsa de pescado y el azucar para la salsa.","Saltea las gambas en wok a fuego muy fuerte hasta que esten rosadas, retira.","En el mismo wok, cuaja los huevos rapidamente y rompelos.","Añade los fideos escurridos y la salsa, saltea 2 minutos.","Incorpora las gambas, los brotes de soja y la cebolleta.","Sirve con cacahuetes picados y lima para exprimir."]'),

('a1b2c3d4-0005-4000-8000-000000000005',
 'Sopa de miso con tofu', 'sopas', 15, false,
 'https://images.unsplash.com/photo-1744116927815-a04ba6629cf3?w=800&q=80&crop=entropy',
 2.00, 2, '44444444-4444-4444-4444-444444444444',
 '[{"nombre":"pasta de miso blanco","cantidad":3,"unidad":"cda","familia":"salsas"},{"nombre":"tofu sedoso","cantidad":200,"unidad":"g","familia":"proteinas"},{"nombre":"alga wakame seca","cantidad":10,"unidad":"g","familia":"otros"},{"nombre":"caldo dashi","cantidad":800,"unidad":"ml","familia":"caldos"},{"nombre":"cebolleta","cantidad":2,"unidad":"ud","familia":"verduras"},{"nombre":"salsa de soja","cantidad":10,"unidad":"ml","familia":"salsas"}]',
 '["Hidrata el alga wakame en agua fria 5 minutos, escurre.","Calienta el dashi a fuego suave sin que llegue a hervir.","Disuelve el miso en un poco de caldo caliente y añadelo al resto.","Incorpora el tofu cortado en dados pequeños y el wakame.","Calienta 2 minutos sin hervir para que no se destruyan los probioticos del miso.","Sirve con la cebolleta picada por encima."]'),

('a1b2c3d4-0006-4000-8000-000000000006',
 'Risotto de setas', 'arroces', 40, false,
 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80&crop=entropy',
 4.50, 4, '44444444-4444-4444-4444-444444444444',
 '[{"nombre":"arroz arborio","cantidad":320,"unidad":"g","familia":"cereales"},{"nombre":"setas variadas","cantidad":400,"unidad":"g","familia":"verduras"},{"nombre":"cebolla","cantidad":1,"unidad":"ud","familia":"verduras"},{"nombre":"ajo","cantidad":2,"unidad":"dientes","familia":"verduras"},{"nombre":"vino blanco seco","cantidad":120,"unidad":"ml","familia":"bebidas"},{"nombre":"caldo de verduras","cantidad":1200,"unidad":"ml","familia":"caldos"},{"nombre":"parmesano rallado","cantidad":80,"unidad":"g","familia":"lacteos"},{"nombre":"mantequilla","cantidad":40,"unidad":"g","familia":"lacteos"},{"nombre":"aceite de oliva","cantidad":30,"unidad":"ml","familia":"aceites"}]',
 '["Sofrie la cebolla y el ajo picados en aceite a fuego suave hasta que esten transparentes.","Añade las setas y saltea a fuego fuerte hasta que evapore el agua.","Incorpora el arroz y tuestalo 2 minutos.","Vierte el vino y remueve hasta que se absorba.","Añade el caldo caliente cazo a cazo, removiendo constantemente y esperando que se absorba antes de añadir mas.","Fuera del fuego, añade la mantequilla y el parmesano. Remueve con energia y sirve inmediatamente."]'),

('a1b2c3d4-0007-4000-8000-000000000007',
 'Tiramisu', 'postres', 30, false,
 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80&crop=entropy',
 3.00, 6, '33333333-3333-3333-3333-333333333333',
 '[{"nombre":"mascarpone","cantidad":500,"unidad":"g","familia":"lacteos"},{"nombre":"huevos","cantidad":4,"unidad":"ud","familia":"huevos"},{"nombre":"azucar","cantidad":100,"unidad":"g","familia":"dulces"},{"nombre":"bizcochos savoiardi","cantidad":24,"unidad":"ud","familia":"cereales"},{"nombre":"cafe expreso","cantidad":300,"unidad":"ml","familia":"bebidas"},{"nombre":"cacao en polvo","cantidad":30,"unidad":"g","familia":"dulces"},{"nombre":"amaretto","cantidad":30,"unidad":"ml","familia":"bebidas"}]',
 '["Prepara el cafe y dejalo enfriar con el amaretto.","Separa las yemas de las claras. Bate las yemas con el azucar hasta que blanqueen.","Incorpora el mascarpone a las yemas con movimientos envolventes.","Monta las claras a punto de nieve e incorporalas a la mezcla.","Moja los bizcochos rapidamente en el cafe y colocalos en la base del molde.","Extiende la mitad de la crema, otra capa de bizcochos y termina con crema.","Refrigera minimo 4 horas y espolvorea cacao antes de servir."]'),

('a1b2c3d4-0008-4000-8000-000000000008',
 'Fabada asturiana', 'legumbres', 120, false,
 'https://images.unsplash.com/photo-1512003867696-6d5ce6835040?w=800&q=80&crop=entropy',
 3.80, 6, '11111111-1111-1111-1111-111111111111',
 '[{"nombre":"fabes asturianas","cantidad":500,"unidad":"g","familia":"legumbres"},{"nombre":"chorizo asturiano","cantidad":200,"unidad":"g","familia":"carnes"},{"nombre":"morcilla asturiana","cantidad":200,"unidad":"g","familia":"carnes"},{"nombre":"lacon","cantidad":200,"unidad":"g","familia":"carnes"},{"nombre":"panceta curada","cantidad":150,"unidad":"g","familia":"carnes"},{"nombre":"azafran","cantidad":1,"unidad":"pizca","familia":"especias"},{"nombre":"pimenton","cantidad":1,"unidad":"cdta","familia":"especias"}]',
 '["Pon las fabes a remojo en agua fria la noche anterior.","Escurre y cubre con agua fria. Añade todas las carnes y lleva a ebullicion.","Espuma bien y baja el fuego. Cuece a fuego muy suave durante 2 horas.","A mitad de coccion añade el azafran disuelto en un poco de caldo caliente.","Comprueba la sazon al final, las carnes ya aportan sal.","Sirve en cazuela de barro con las carnes en rodajas."]'),

('a1b2c3d4-0009-4000-8000-000000000009',
 'Croquetas de jamon', 'tapas', 90, false,
 'https://images.unsplash.com/photo-1751199393315-fbcae4eabd4c?w=800&q=80&crop=entropy',
 2.20, 4, '11111111-1111-1111-1111-111111111111',
 '[{"nombre":"jamon serrano","cantidad":150,"unidad":"g","familia":"carnes"},{"nombre":"harina","cantidad":100,"unidad":"g","familia":"cereales"},{"nombre":"mantequilla","cantidad":80,"unidad":"g","familia":"lacteos"},{"nombre":"leche entera","cantidad":700,"unidad":"ml","familia":"lacteos"},{"nombre":"nuez moscada","cantidad":1,"unidad":"pizca","familia":"especias"},{"nombre":"huevo","cantidad":2,"unidad":"ud","familia":"huevos"},{"nombre":"pan rallado","cantidad":150,"unidad":"g","familia":"cereales"},{"nombre":"aceite de girasol","cantidad":500,"unidad":"ml","familia":"aceites"}]',
 '["Derrite la mantequilla y sofrie el jamon picado fino durante 2 minutos.","Añade la harina y cocina 3 minutos removiendo para que no sepa a crudo.","Incorpora la leche caliente poco a poco sin dejar de remover hasta obtener una bechamel espesa.","Sazona con sal y nuez moscada, vierte en una fuente y deja enfriar en la nevera al menos 2 horas.","Forma las croquetas, pasalas por huevo batido y pan rallado.","Frie en aceite bien caliente hasta que esten doradas."]'),

('a1b2c3d4-0010-4000-8000-000000000010',
 'Ensalada griega', 'ensaladas', 10, false,
 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80&crop=entropy',
 2.50, 2, '55555555-5555-5555-5555-555555555555',
 '[{"nombre":"tomate","cantidad":3,"unidad":"ud","familia":"verduras"},{"nombre":"pepino","cantidad":1,"unidad":"ud","familia":"verduras"},{"nombre":"cebolla roja","cantidad":1,"unidad":"ud","familia":"verduras"},{"nombre":"queso feta","cantidad":200,"unidad":"g","familia":"lacteos"},{"nombre":"aceitunas kalamata","cantidad":100,"unidad":"g","familia":"otros"},{"nombre":"pimiento verde","cantidad":1,"unidad":"ud","familia":"verduras"},{"nombre":"aceite de oliva virgen extra","cantidad":50,"unidad":"ml","familia":"aceites"},{"nombre":"oregano seco","cantidad":1,"unidad":"cdta","familia":"especias"},{"nombre":"vinagre de vino tinto","cantidad":20,"unidad":"ml","familia":"acidos"}]',
 '["Corta los tomates en gajos gruesos y el pepino en medias lunas.","Trocea la cebolla en aros finos y el pimiento en tiras.","Coloca todo en una fuente. Añade las aceitunas y el feta en un bloque encima.","Aliña con aceite de oliva, vinagre, oregano y sal.","Sirve inmediatamente sin remover demasiado para que el feta se mantenga entero."]'),

('a1b2c3d4-0011-4000-8000-000000000011',
 'Hamburguesa smash', 'americana', 20, false,
 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80&crop=entropy',
 5.50, 2, '11111111-1111-1111-1111-111111111111',
 '[{"nombre":"carne picada de ternera 80/20","cantidad":400,"unidad":"g","familia":"carnes"},{"nombre":"panecillos brioche","cantidad":2,"unidad":"ud","familia":"cereales"},{"nombre":"queso cheddar","cantidad":4,"unidad":"lonchas","familia":"lacteos"},{"nombre":"cebolla","cantidad":1,"unidad":"ud","familia":"verduras"},{"nombre":"lechuga","cantidad":4,"unidad":"hojas","familia":"verduras"},{"nombre":"tomate","cantidad":1,"unidad":"ud","familia":"verduras"},{"nombre":"mayonesa","cantidad":2,"unidad":"cda","familia":"salsas"},{"nombre":"mostaza americana","cantidad":1,"unidad":"cda","familia":"salsas"},{"nombre":"sal y pimienta","cantidad":1,"unidad":"al gusto","familia":"especias"}]',
 '["Forma bolas de 100 g con la carne sin aplastar todavia.","Calienta una plancha de hierro a fuego muy fuerte hasta que humee.","Coloca la bola y aplastala con una espatula firme hasta obtener una hamburguesa muy fina.","Sazona con sal y pimienta. Cocina 2 minutos sin mover.","Da la vuelta, coloca el queso y deja fundir 1 minuto.","Tuesta el panecillo en la misma plancha. Monta con la salsa, la lechuga, el tomate y la cebolla."]'),

('a1b2c3d4-0012-4000-8000-000000000012',
 'Brownies de chocolate', 'postres', 40, false,
 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&q=80&crop=entropy',
 1.50, 9, '33333333-3333-3333-3333-333333333333',
 '[{"nombre":"chocolate negro 70%","cantidad":200,"unidad":"g","familia":"dulces"},{"nombre":"mantequilla","cantidad":120,"unidad":"g","familia":"lacteos"},{"nombre":"huevos","cantidad":3,"unidad":"ud","familia":"huevos"},{"nombre":"azucar","cantidad":200,"unidad":"g","familia":"dulces"},{"nombre":"harina","cantidad":80,"unidad":"g","familia":"cereales"},{"nombre":"cacao en polvo","cantidad":30,"unidad":"g","familia":"dulces"},{"nombre":"nueces","cantidad":100,"unidad":"g","familia":"frutos secos"},{"nombre":"sal","cantidad":1,"unidad":"pizca","familia":"especias"}]',
 '["Precalienta el horno a 175C. Forra un molde cuadrado de 20 cm con papel de horno.","Funde el chocolate con la mantequilla al baño maria. Deja templar.","Bate los huevos con el azucar hasta que blanqueen y doblen su volumen.","Incorpora el chocolate fundido a los huevos con movimientos envolventes.","Tamiza la harina, el cacao y la sal sobre la mezcla e integra sin sobremezclar.","Añade las nueces, vierte en el molde y hornea 25 minutos. El centro debe quedar ligeramente humedo."]'),

('a1b2c3d4-0013-4000-8000-000000000013',
 'Macarons de frambuesa', 'postres', 60, false,
 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=800&q=80&crop=entropy',
 2.00, 12, '22222222-2222-2222-2222-222222222222',
 '[{"nombre":"almendra molida tamizada","cantidad":125,"unidad":"g","familia":"frutos secos"},{"nombre":"azucar glas tamizado","cantidad":225,"unidad":"g","familia":"dulces"},{"nombre":"claras de huevo envejecidas","cantidad":100,"unidad":"g","familia":"huevos"},{"nombre":"azucar","cantidad":75,"unidad":"g","familia":"dulces"},{"nombre":"colorante rojo","cantidad":2,"unidad":"gotas","familia":"otros"},{"nombre":"frambuesas","cantidad":150,"unidad":"g","familia":"frutas"},{"nombre":"nata para montar","cantidad":100,"unidad":"ml","familia":"lacteos"},{"nombre":"chocolate blanco","cantidad":100,"unidad":"g","familia":"dulces"}]',
 '["Mezcla la almendra molida con el azucar glas y tamiza dos veces.","Monta las claras a punto de nieve firme añadiendo el azucar poco a poco.","Añade el colorante y aplica el macaronage: mezcla con espatula hasta que caiga en cinta.","Escudilla circulos de 3,5 cm en bandejas con papel de horno. Deja reposar 30 minutos.","Hornea a 145C durante 14 minutos. Deja enfriar completamente.","Para el ganache: calienta la nata, vierte sobre el chocolate troceado, mezcla. Deja enfriar y monta.","Añade las frambuesas trituradas al ganache. Rellena los macarons y deja reposar 24 horas en nevera."]'),

('a1b2c3d4-0014-4000-8000-000000000014',
 'Tarta de zanahoria', 'postres', 55, false,
 'https://images.unsplash.com/photo-1566121933407-3c7ccdd26763?w=800&q=80&crop=entropy',
 3.50, 8, '22222222-2222-2222-2222-222222222222',
 '[{"nombre":"zanahoria rallada","cantidad":300,"unidad":"g","familia":"verduras"},{"nombre":"harina","cantidad":250,"unidad":"g","familia":"cereales"},{"nombre":"azucar moreno","cantidad":200,"unidad":"g","familia":"dulces"},{"nombre":"aceite de girasol","cantidad":180,"unidad":"ml","familia":"aceites"},{"nombre":"huevos","cantidad":3,"unidad":"ud","familia":"huevos"},{"nombre":"canela molida","cantidad":2,"unidad":"cdta","familia":"especias"},{"nombre":"nuez moscada","cantidad":0.5,"unidad":"cdta","familia":"especias"},{"nombre":"levadura","cantidad":1.5,"unidad":"cdta","familia":"cereales"},{"nombre":"queso crema","cantidad":300,"unidad":"g","familia":"lacteos"},{"nombre":"azucar glas","cantidad":150,"unidad":"g","familia":"dulces"}]',
 '["Precalienta el horno a 180C. Engrasa dos moldes redondos de 20 cm.","Bate los huevos con el azucar y el aceite hasta integrar.","Tamiza la harina, la levadura, la canela y la nuez moscada sobre la mezcla.","Incorpora la zanahoria rallada y mezcla hasta obtener una masa homogenea.","Reparte en los moldes y hornea 30-35 minutos. Enfria completamente.","Para el frosting: bate el queso crema con el azucar glas hasta obtener una crema suave.","Rellena y cubre la tarta con el frosting de queso crema."]'),

('a1b2c3d4-0015-4000-8000-000000000015',
 'Mousse de chocolate negro', 'postres', 25, false,
 'https://images.unsplash.com/photo-1744988870979-43fcbfdd0804?w=800&q=80&crop=entropy',
 2.80, 4, '33333333-3333-3333-3333-333333333333',
 '[{"nombre":"chocolate negro 70%","cantidad":200,"unidad":"g","familia":"dulces"},{"nombre":"huevos","cantidad":4,"unidad":"ud","familia":"huevos"},{"nombre":"azucar","cantidad":60,"unidad":"g","familia":"dulces"},{"nombre":"mantequilla","cantidad":30,"unidad":"g","familia":"lacteos"},{"nombre":"nata para montar","cantidad":200,"unidad":"ml","familia":"lacteos"},{"nombre":"sal","cantidad":1,"unidad":"pizca","familia":"especias"}]',
 '["Funde el chocolate con la mantequilla al baño maria y deja templar.","Separa yemas y claras. Bate las yemas con la mitad del azucar hasta blanquear e incorpora al chocolate.","Monta la nata y reservala en la nevera.","Monta las claras con el resto del azucar y una pizca de sal a punto de nieve firme.","Incorpora la nata al chocolate con movimientos envolventes, luego las claras en tres veces.","Reparte en copas y refrigera minimo 3 horas."]'),

('a1b2c3d4-0016-4000-8000-000000000016',
 'Leche frita', 'postres', 40, false,
 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80&crop=entropy',
 1.80, 6, '22222222-2222-2222-2222-222222222222',
 '[{"nombre":"leche entera","cantidad":600,"unidad":"ml","familia":"lacteos"},{"nombre":"harina","cantidad":80,"unidad":"g","familia":"cereales"},{"nombre":"maicena","cantidad":40,"unidad":"g","familia":"cereales"},{"nombre":"azucar","cantidad":120,"unidad":"g","familia":"dulces"},{"nombre":"canela en rama","cantidad":1,"unidad":"ud","familia":"especias"},{"nombre":"piel de limon","cantidad":1,"unidad":"tira","familia":"frutas"},{"nombre":"huevo","cantidad":2,"unidad":"ud","familia":"huevos"},{"nombre":"aceite de girasol","cantidad":300,"unidad":"ml","familia":"aceites"},{"nombre":"canela molida y azucar para rebozar","cantidad":50,"unidad":"g","familia":"dulces"}]',
 '["Infusiona la leche con la canela en rama y la piel de limon. Retira y cuela.","Mezcla la harina, maicena y azucar con un poco de leche fria hasta disolver.","Añade el resto de la leche caliente poco a poco y cuece a fuego suave removiendo hasta que espese mucho.","Vierte en una bandeja engrasada de 2 cm de grosor. Refrigera 3 horas.","Corta en rectangulos, pasa por huevo batido y frie hasta dorar.","Reboza en azucar con canela molida y sirve caliente."]'),

('a1b2c3d4-0017-4000-8000-000000000017',
 'Tacos de pollo al pastor', 'mexicana', 35, false,
 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80&crop=entropy',
 4.00, 4, '11111111-1111-1111-1111-111111111111',
 '[{"nombre":"pechuga de pollo","cantidad":500,"unidad":"g","familia":"carnes"},{"nombre":"tortillas de maiz","cantidad":8,"unidad":"ud","familia":"cereales"},{"nombre":"chile guajillo seco","cantidad":3,"unidad":"ud","familia":"especias"},{"nombre":"piña en rodajas","cantidad":150,"unidad":"g","familia":"frutas"},{"nombre":"cebolla","cantidad":1,"unidad":"ud","familia":"verduras"},{"nombre":"cilantro fresco","cantidad":20,"unidad":"g","familia":"hierbas"},{"nombre":"ajo","cantidad":2,"unidad":"dientes","familia":"verduras"},{"nombre":"vinagre de manzana","cantidad":30,"unidad":"ml","familia":"acidos"},{"nombre":"achiote en pasta","cantidad":1,"unidad":"cda","familia":"especias"},{"nombre":"lima","cantidad":2,"unidad":"ud","familia":"frutas"}]',
 '["Hidrata los chiles en agua caliente 20 minutos. Escurre y tritura con el ajo, el achiote y el vinagre.","Marina el pollo en la salsa roja durante al menos 2 horas.","Asa el pollo en plancha o parrilla a fuego fuerte hasta que este bien dorado. Reposa 5 minutos y pica.","Calienta las tortillas en comal o sarten seca.","Asa la piña en la plancha hasta que caramelice.","Monta los tacos con el pollo, la piña, la cebolla picada y el cilantro. Sirve con lima."]'),

('a1b2c3d4-0018-4000-8000-000000000018',
 'Sushi rolls de salmon', 'asiatica', 45, false,
 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80&crop=entropy',
 6.50, 2, '44444444-4444-4444-4444-444444444444',
 '[{"nombre":"arroz para sushi","cantidad":300,"unidad":"g","familia":"cereales"},{"nombre":"salmon fresco para sashimi","cantidad":200,"unidad":"g","familia":"pescados"},{"nombre":"hojas de nori","cantidad":4,"unidad":"ud","familia":"otros"},{"nombre":"vinagre de arroz","cantidad":50,"unidad":"ml","familia":"acidos"},{"nombre":"azucar","cantidad":20,"unidad":"g","familia":"dulces"},{"nombre":"sal","cantidad":5,"unidad":"g","familia":"especias"},{"nombre":"aguacate","cantidad":1,"unidad":"ud","familia":"frutas"},{"nombre":"pepino","cantidad":0.5,"unidad":"ud","familia":"verduras"},{"nombre":"salsa de soja","cantidad":50,"unidad":"ml","familia":"salsas"},{"nombre":"wasabi","cantidad":1,"unidad":"cdta","familia":"especias"}]',
 '["Lava el arroz hasta que el agua salga clara. Cuece con la misma cantidad de agua, tapa y cuece 12 minutos. Reposa 10 minutos.","Mezcla el vinagre, el azucar y la sal hasta disolver. Incorpora al arroz caliente con movimientos de corte. Abanica para enfriar.","Corta el salmon, el aguacate y el pepino en tiras.","Coloca el nori en la esterilla, extiende una capa fina de arroz dejando 2 cm en el extremo.","Coloca el relleno en el centro y enrolla con firmeza usando la esterilla.","Moja el cuchillo y corta en 8 piezas. Sirve con soja y wasabi."]'),

('a1b2c3d4-0019-4000-8000-000000000019',
 'Pizza margherita', 'italiana', 90, false,
 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80&crop=entropy',
 3.20, 4, '11111111-1111-1111-1111-111111111111',
 '[{"nombre":"harina de fuerza W300","cantidad":500,"unidad":"g","familia":"cereales"},{"nombre":"agua tibia","cantidad":325,"unidad":"ml","familia":"otros"},{"nombre":"levadura seca","cantidad":3,"unidad":"g","familia":"cereales"},{"nombre":"sal","cantidad":10,"unidad":"g","familia":"especias"},{"nombre":"tomates san marzano","cantidad":400,"unidad":"g","familia":"verduras"},{"nombre":"mozzarella fior di latte","cantidad":300,"unidad":"g","familia":"lacteos"},{"nombre":"hojas de albahaca fresca","cantidad":10,"unidad":"ud","familia":"hierbas"},{"nombre":"aceite de oliva virgen extra","cantidad":30,"unidad":"ml","familia":"aceites"}]',
 '["Disuelve la levadura en el agua. Mezcla con la harina y la sal hasta obtener una masa. Amasa 10 minutos.","Deja fermentar en un bol tapado 24 horas en la nevera.","Saca la masa 2 horas antes. Divide en dos bolas y deja reposar.","Precalienta el horno al maximo (250C o mas) con la bandeja dentro.","Tritura los tomates a mano con sal. Estira la masa a mano desde el centro hacia fuera.","Añade la salsa de tomate, la mozzarella desmenuzada y hornea 8-10 minutos.","Termina con las hojas de albahaca fresca y un hilo de aceite."]'),

('a1b2c3d4-0020-4000-8000-000000000020',
 'Curry de garbanzos y espinacas', 'india', 30, false,
 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80&crop=entropy',
 2.80, 4, '11111111-1111-1111-1111-111111111111',
 '[{"nombre":"garbanzos cocidos","cantidad":400,"unidad":"g","familia":"legumbres"},{"nombre":"espinacas frescas","cantidad":200,"unidad":"g","familia":"verduras"},{"nombre":"tomates triturados","cantidad":400,"unidad":"g","familia":"verduras"},{"nombre":"cebolla","cantidad":1,"unidad":"ud","familia":"verduras"},{"nombre":"ajo","cantidad":3,"unidad":"dientes","familia":"verduras"},{"nombre":"jengibre fresco","cantidad":20,"unidad":"g","familia":"especias"},{"nombre":"leche de coco","cantidad":200,"unidad":"ml","familia":"lacteos"},{"nombre":"curry en polvo","cantidad":2,"unidad":"cda","familia":"especias"},{"nombre":"garam masala","cantidad":1,"unidad":"cdta","familia":"especias"},{"nombre":"aceite de girasol","cantidad":30,"unidad":"ml","familia":"aceites"}]',
 '["Sofrie la cebolla en aceite a fuego medio hasta que este dorada, unos 8 minutos.","Añade el ajo y el jengibre rallados, cocina 2 minutos.","Incorpora el curry y el garam masala, tuesta 1 minuto sin dejar de remover.","Añade el tomate triturado y cocina 5 minutos hasta que reduzca.","Incorpora los garbanzos y la leche de coco. Cuece 10 minutos a fuego suave.","Añade las espinacas al final y remueve hasta que se marchiten. Ajusta de sal y sirve con arroz basmati."]');
