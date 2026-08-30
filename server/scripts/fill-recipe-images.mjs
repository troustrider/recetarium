import { neon } from '@neondatabase/serverless'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { faltan } from './despensa-match.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
if (!process.env.DATABASE_URL) {
  const envPath = resolve(__dirname, '..', '.env')
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}
const KEY = process.env.UNSPLASH_ACCESS_KEY
const DRY = process.argv.includes('--dry')
const ANALYZE = process.argv.includes('--analyze')
if (!ANALYZE && !KEY) { console.error('Falta UNSPLASH_ACCESS_KEY'); process.exit(1) }
if (!process.env.DATABASE_URL) { console.error('Falta DATABASE_URL'); process.exit(1) }
const sql = neon(process.env.DATABASE_URL)

const RENDER = '&w=800&h=600&q=80&fit=crop&crop=entropy'
const EXTRA = { ø: 'o', æ: 'ae', œ: 'oe', å: 'a', ß: 'ss', đ: 'd', ı: 'i', ð: 'd', þ: 'th', ł: 'l' }
const deaccent = (s) => s.toLowerCase().replace(/[øæœåßđıðþł]/g, (c) => EXTRA[c])
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
const slug = (url) => url.match(/photo-[a-z0-9-]+/i)?.[0] ?? null

const clave = (s) => deaccent(s).replace(/[^a-z0-9]+/g, ' ').trim()

const REVISION_VISUAL = {
  'Arroz con leche': ['creamy rice pudding bowl cinnamon stick', ['rice pudding', 'pudding', 'porridge']],
  'Bacalao gratinado con patata y brocoli': ['baked cod with potato gratin dish', ['cod', 'fish', 'gratin']],
  'Baleadas de huevo, frijoles y queso': ['bean and cheese filled tortilla folded plate', ['beans', 'cheese']],
  'Budin de pan': ['baked bread pudding custard dish', ['pudding', 'custard']],
  'Caldo verde con chorizo': ['green kale soup with sausage bowl', ['soup', 'kale']],
  'Chorba argelina de trigo y garbanzos': ['chickpea vegetable soup bowl', ['soup']],
  'Crema catalana': ['creme brulee caramelized sugar ramekin', ['custard', 'creme brulee', 'dessert']],
  'Doenjang jjigae con cerdo': ['korean stew bubbling stone pot vegetables', ['stew', 'jjigae', 'pot']],
  'Ensalada de garbanzos y atun': ['chickpea salad bowl tomato tuna', ['salad']],
  'Gallo pinto con huevo': ['rice and beans plate with fried egg', ['rice', 'beans']],
  'Gamja jorim': ['braised potatoes soy glaze bowl', ['potatoes', 'braised']],
  'Garbanzos salteados con espinacas y huevo': ['chickpeas and spinach cooked dish plate', ['chickpeas', 'spinach']],
  'Gofres proteicos de avena y platano': ['waffles on a plate with banana', ['waffle', 'waffles']],
  'Gratinado de udon con atun y mayo-miso': ['baked noodle casserole melted cheese', ['casserole', 'baked', 'noodles']],
  'Goi cuon de cerdo': ['vietnamese fresh spring rolls rice paper', ['spring roll', 'spring rolls', 'rolls']],
  'Huevos a la flamenca': ['baked eggs in tomato sauce pan vegetables', ['egg', 'eggs']],
  'Huevos benedictinos': ['eggs benedict hollandaise muffin plate', ['benedict', 'poached', 'hollandaise']],
  'Jianbing': ['chinese egg crepe wrap folded', ['crepe', 'pancake', 'wrap']],
  'Kasha de trigo sarraceno con huevo y setas': ['savoury porridge bowl with mushrooms and egg', ['porridge', 'mushrooms', 'buckwheat']],
  'Larb de pollo': ['minced chicken salad with herbs in a bowl', ['salad']],
  'Lasana bolonesa': ['lasagna slice baked layers plate', ['lasagna', 'lasagne']],
  'Leche asada': ['baked milk custard caramel dessert', ['custard', 'flan', 'dessert']],
  'Lentejas de bote con verduras y huevo': ['cooked lentil stew bowl carrots', ['stew', 'soup', 'cooked']],
  'Locro de calabaza y cerdo': ['pumpkin and corn stew in a bowl', ['stew', 'soup']],
  'Mangu con los tres golpes': ['mashed plantain plate fried egg cheese', ['plantain', 'mash']],
  'Manzanas asadas con nueces y miel': ['baked apples dessert plate cinnamon', ['baked', 'dessert']],
  'Molletes de frijoles y queso': ['open bread with beans and melted cheese', ['bread', 'toast', 'cheese']],
  'Papa a la huancaina': ['boiled potato slices with creamy yellow sauce', ['potato', 'potatoes']],
  'Papas arrugadas con mojo picon': ['papas arrugadas with mojo sauce canary islands', ['mojo', 'arrugadas']],
  'Pastel de choclo': ['corn casserole baked in a dish', ['corn', 'casserole', 'pie']],
  'Peras al vino tinto': ['pears poached in red wine served on a plate', ['poached', 'wine']],
  'Pisto con huevos y pavo': ['stewed peppers tomato vegetables with egg pan', ['egg', 'vegetables', 'stew']],
  'Pollo al ajillo con arroz': ['garlic chicken pieces on a plate with rice', ['chicken']],
  'Pollo al ketjap con brocoli': ['chicken in soy sauce with broccoli plate', ['chicken']],
  'Pao de queijo': ['brazilian cheese bread balls on a plate', ['bread', 'buns', 'cheese']],
  'Rosti con Speck, queso y huevo frito': ['potato rosti with fried egg plate', ['rosti', 'potato']],
  'Salmon glaseado con miel y soja': ['cooked glazed salmon fillet on a plate', ['salmon']],
  'Sloppy joes con pan': ['messy minced meat sandwich in a bun plate', ['sandwich', 'burger', 'bun']],
  'Solomillo de cerdo con champinones y arroz': ['pork tenderloin mushroom sauce plate', ['pork']],
  'Sopa de pollo con verduras y fideos': ['chicken noodle soup bowl vegetables', ['soup']],
  'Thit kho trung': ['vietnamese braised pork with rice and egg', ['pork', 'rice']],
  'Tinga de pollo con arroz': ['shredded chicken tomato sauce with rice plate', ['chicken']],
  'Tofu agridulce con pimiento': ['tofu cubes in sweet and sour sauce peppers', ['tofu']],
  'Tteokgalbi': ['grilled meat patties on a plate korean', ['patty', 'patties', 'grilled']],
  'Verduras asadas con garbanzos y feta': ['tray of roasted vegetables from the oven', ['vegetables']],
  'Zabaione con fresas': ['zabaglione custard cream glass strawberries', ['custard', 'cream', 'dessert']],
}

const MANUAL = Object.fromEntries(Object.entries({
  'Cacio e pepe': ['spaghetti pasta cheese black pepper', ['pasta', 'spaghetti']],
  'Tapsilog': ['filipino breakfast garlic rice fried egg beef', ['rice', 'egg']],
  'Buta no shogayaki': ['japanese ginger pork stir fry', ['pork']],
  'Dakos cretense con feta y tomate': ['greek rusk tomato feta salad', ['tomato', 'feta']],
  'Ful medames con huevo': ['egyptian fava bean stew flatbread', ['bean', 'beans']],
  'Gyeranmari': ['rolled omelette slices japanese tamagoyaki', ['omelette', 'omelet', 'tamagoyaki']],
  'Kapsalon casero al horno': ['dutch kapsalon fries kebab melted cheese', ['fries', 'kebab', 'kapsalon']],
  'Kimchijeon': ['korean kimchi pancake pan', ['kimchi', 'pancake']],
  'Lablabi tunecino': ['chickpea soup bread bowl cumin', ['chickpea', 'chickpeas', 'soup']],
  'Menemen': ['turkish scrambled eggs tomato pepper pan', ['egg', 'eggs']],
  'Mujadara con pollo y yogur': ['lentils rice caramelized onion platter', ['lentils', 'rice']],
  'Poffertjes': ['small fluffy pancakes plate icing sugar', ['pancake', 'pancakes', 'poffertjes']],
  'Salmorejo cordobes con jamon y huevo': ['cold tomato soup bowl spanish', ['tomato', 'soup']],
  'Skyr proteico con frutos rojos': ['yogurt bowl berries breakfast', ['yogurt', 'berries', 'berry']],
  'Stamppot de col rizada con rookworst': ['mashed potato kale sausage plate', ['mashed', 'sausage', 'kale']],
  'Torrijas': ['french toast cinnamon sugar slices', ['toast', 'cinnamon']],
  'Uitsmijter de jamon y queso': ['fried eggs ham cheese on toast', ['egg', 'eggs']],
  'Ajoblanco malagueno con uvas': ['cold almond soup bowl grapes', ['soup', 'almond']],
  'Bircher muesli suizo': ['breakfast bowl yogurt granola grated apple', ['granola', 'muesli', 'oats', 'oat']],
  'Bitoque a portuguesa': ['steak fried egg rice fries plate', ['steak', 'egg']],
  "Bucatini all'amatriciana": ['pasta tomato sauce bacon pecorino', ['pasta', 'spaghetti']],
  'Bulgogi': ['korean grilled marinated beef', ['beef']],
  'Escalivada catalana': ['roasted peppers eggplant grilled vegetables', ['pepper', 'peppers', 'eggplant']],
  'Feijao tropeiro': ['black beans cassava flour sausage skillet', ['bean', 'beans', 'feijao']],
  'Gazpacho andaluz': ['cold tomato soup glass spanish', ['tomato', 'soup', 'gazpacho']],
  'Halva de semola': ['turkish dessert bowl pistachio sweet semolina', ['halva', 'semolina', 'dessert', 'sweet']],
  'Helado proteico de skyr y frutos rojos': ['berry ice cream bowl', ['ice cream', 'berries', 'berry']],
  'Hotteok': ['sweet stuffed pancake plate syrup', ['pancake', 'pancakes']],
  'Kahvalti tabagi': ['turkish breakfast spread table', ['breakfast']],
  'Loco moco': ['beef patty rice fried egg gravy', ['egg', 'rice']],
  'Malva pudding': ['sticky toffee pudding custard', ['pudding', 'cake']],
  'Oyakodon': ['japanese chicken egg rice bowl donburi', ['rice', 'chicken']],
  'Saltimbocca alla romana': ['veal cutlet prosciutto sage pan', ['veal', 'prosciutto', 'cutlet']],
  'Sopa de ajo castellana': ['garlic bread soup paprika bowl', ['soup']],
  'Suya de pollo': ['grilled chicken skewers spice', ['chicken', 'skewers', 'skewer']],
  'Tabule libanes': ['tabbouleh parsley bulgur salad', ['tabbouleh', 'parsley', 'salad']],
  'Vichyssoise': ['cold leek potato soup bowl', ['soup']],
  'Cevapi con ajvar y cebolla': ['grilled minced meat sausages flatbread', ['grilled', 'meat', 'sausage']],
  'Chanpuru de tofu y cerdo': ['okinawa stir fry tofu pork vegetables', ['tofu']],
  'Gemista': ['greek stuffed tomatoes peppers baked', ['stuffed', 'tomatoes', 'tomato']],
  'Mangu con los tres golpes': ['mashed plantain fried egg cheese', ['plantain']],
  'Mapo tofu': ['sichuan tofu chili sauce minced pork', ['tofu']],
  'Muhammara': ['red pepper walnut dip bowl', ['dip', 'pepper']],
  'Nikujaga': ['japanese beef potato stew bowl', ['stew', 'potato', 'beef']],
  'Pastitsio': ['baked pasta layers minced meat bechamel slice', ['pasta']],
  'Roti john': ['egg omelette baguette sandwich griddle', ['sandwich', 'omelette', 'egg']],
  'Suspiro limeno': ['dulce de leche meringue dessert glass', ['meringue', 'dessert', 'caramel']],
  'Tom kha gai': ['thai coconut chicken soup bowl', ['soup', 'coconut']],
  'Tteokgalbi': ['korean grilled beef patty', ['beef', 'patty', 'grilled']],
  'Apfelstrudel': ['apple strudel slice powdered sugar', ['strudel', 'apple']],
  'Borek de carne': ['turkish phyllo pastry minced meat', ['pastry', 'phyllo', 'borek']],
  'Harira': ['moroccan tomato lentil chickpea soup', ['soup']],
  'Kanafeh': ['middle eastern cheese pastry syrup pistachio', ['pastry', 'dessert', 'knafeh', 'kunafa']],
  'Lahmacun casero': ['turkish flatbread minced meat lemon', ['flatbread', 'bread']],
  'Pabellon criollo': ['shredded beef rice black beans plantain', ['beef', 'rice']],
  'Panzanella': ['tuscan bread tomato salad bowl', ['salad', 'tomato']],
  'Porkolt hungaro con nokedli': ['hungarian beef stew paprika', ['stew', 'beef']],
  'Ropa vieja': ['cuban shredded beef stew rice', ['beef', 'stew']],
  'Youvetsi de ternera con orzo': ['greek orzo beef bake', ['orzo', 'beef']],
  'Cochinita pibil expres': ['mexican pulled pork tacos', ['pork', 'taco', 'tacos']],
  'Erwtensoep': ['dutch split pea soup sausage', ['soup', 'pea']],
  'Ezme': ['turkish tomato pepper salad spicy', ['salad', 'tomato']],
  'Fasolada griega con feta': ['greek white bean soup bowl', ['bean', 'beans', 'soup']],
  'Fattoush': ['tomato cucumber lettuce salad bowl herbs', ['salad', 'cucumber', 'lettuce']],
  'Gado-gado': ['indonesian vegetable salad peanut sauce', ['salad', 'peanut', 'vegetables']],
  'Kartoffelsalat aleman': ['german potato salad bowl', ['potato', 'salad']],
  'Locro de calabaza y cerdo': ['pumpkin stew corn pork bowl', ['pumpkin', 'stew']],
  'Andong jjimdak': ['korean braised chicken noodles soy', ['chicken']],
  'Boeuf bourguignon expres': ['beef stew red wine carrots', ['beef', 'stew']],
  'Galbijjim': ['korean braised short ribs', ['ribs', 'rib', 'beef']],
  'Smorrebrod de rookvlees remolacha y huttenkase': ['rye bread slice toppings plate scandinavian', ['rye', 'bread', 'sandwich']],
  'Bigos polaco': ['sauerkraut cabbage stew pot polish', ['sauerkraut', 'cabbage', 'stew']],
  'Empanadas argentinas de carne': ['baked empanadas on a plate', ['empanada', 'empanadas', 'pastry']],
  'Papas arrugadas con mojo picon': ['wrinkled potatoes mojo sauce plate', ['potatoes', 'potato']],
  'Pad Thai de gambas': ['pad thai noodles shrimp lime peanuts', ['pad thai', 'noodles']],
  'Croquetas de jamon': ['fried croquettes on a plate', ['croquette', 'croquettes', 'croqueta']],
  'Kofte turco': ['grilled minced meat kebab skewers plate', ['kebab', 'kofte', 'meatballs']],
  'Crema batida de requeson platano y nueces': ['cottage cheese bowl banana walnuts', ['banana', 'cottage cheese', 'walnuts', 'yogurt']],
  'Falafel al horno con salsa de yogur': ['falafel balls plate yogurt sauce', ['falafel']],
  'Menestra de verduras con jamon y huevo': ['cooked mixed vegetables plate', ['vegetables']],
  'Oeufs cocotte con espinacas': ['baked eggs ramekin spinach cream', ['egg', 'eggs']],
  'Salmon glaseado con miel y soja': ['glazed salmon fillet cooked plate', ['salmon']],
  'Milanesa napolitana con patatas': ['breaded cutlet melted cheese tomato plate', ['cutlet', 'schnitzel', 'breaded', 'milanesa', 'parmigiana']],
  'Frango piri-piri con arroz': ['grilled peri peri chicken plate rice', ['chicken']],
  'Enchiladas de pollo': ['enchiladas tortillas red sauce melted cheese', ['enchiladas', 'enchilada', 'tortillas']],
  'Moussaka de ternera': ['moussaka slice baked eggplant bechamel', ['moussaka', 'eggplant']],
  'Tacos de ternera': ['beef tacos plate lime coriander', ['taco', 'tacos']],
  'Pollo en pepitoria': ['chicken stew almond sauce plate', ['chicken']],
  'Tarta de queso al horno con quark': ['baked cheesecake slice plate', ['cheesecake', 'cake']],
  'Verduras asadas con garbanzos y feta': ['roasted vegetables chickpeas feta tray', ['roasted', 'vegetables', 'chickpeas']],
  'Ternera a la pimienta negra con arroz': ['beef stir fry black pepper sauce rice', ['beef']],
  'Mercimek corbasi': ['red lentil soup bowl lemon', ['lentil', 'soup']],
  'Lentejas de bote con verduras y huevo': ['lentil stew bowl vegetables', ['lentil', 'lentils', 'stew']],
  'Mazemen de ternera picada con yema': ['ramen noodles minced beef egg yolk bowl', ['noodles', 'ramen']],
  'Karniyarik': ['stuffed eggplant minced meat baked', ['eggplant', 'stuffed']],
  'Soto ayam': ['yellow chicken soup bowl herbs turmeric', ['soup']],
  'Char kway teow de cerdo': ['stir fried flat rice noodles wok', ['noodles', 'noodle']],
  'Char siu de cerdo': ['sliced char siu pork with rice plate', ['pork']],
  'Congee de pollo': ['chinese breakfast rice porridge scallion bowl', ['congee', 'porridge', 'rice']],
  'Gyudon': ['japanese beef bowl rice onion donburi', ['beef', 'donburi', 'rice']],
  'Doenjang jjigae con cerdo': ['korean soybean paste stew earthenware pot', ['stew', 'jjigae', 'tofu']],
  'Ensaladilla rusa': ['potato salad mayonnaise bowl peas carrot', ['potato', 'salad']],
  'Flan proteico de huevo': ['caramel flan custard plate', ['flan', 'custard', 'caramel']],
  'Huevos rancheros': ['fried eggs tortilla tomato salsa plate', ['egg', 'eggs']],
  'Goulash hungaro': ['hungarian goulash soup bowl paprika', ['goulash', 'soup', 'stew']],
  'Burek de queso': ['cheese filled phyllo pastry rolls plate', ['pastry', 'phyllo', 'burek', 'borek']],
  'Banh mi de huevo frito': ['vietnamese baguette sandwich filling', ['sandwich', 'baguette', 'banh mi']],
  'Carnitas de cerdo con tortillas': ['pulled pork tacos corn tortillas plate', ['taco', 'tacos', 'pork']],
  'Basbousa de semola y coco': ['semolina cake syrup coconut slice', ['cake', 'semolina']],
  'Atun oriental con cuscus perla': ['seared tuna with couscous plate', ['tuna']],
  'Arayes de ternera': ['grilled stuffed pita minced meat', ['pita', 'flatbread', 'meat']],
  'Ayam kecap': ['indonesian braised chicken soy sauce plate', ['chicken']],
  'Pierogi de patata y queso': ['boiled dumplings plate sour cream', ['dumplings', 'dumpling', 'pierogi']],
  'Polenta con ragu de setas': ['polenta with mushroom sauce plate', ['polenta']],
  'Maqluba de ternera': ['middle eastern rice beef eggplant platter', ['rice']],
  'Minestrone': ['italian vegetable soup bowl', ['soup', 'vegetable', 'minestrone']],
  'Galette bretona de huevo y queso': ['buckwheat galette folded egg cheese plate', ['galette', 'crepe']],
  'Harcha con queso fresco': ['moroccan semolina flatbread griddle plate', ['harcha', 'semolina', 'flatbread']],
  'Jangjorim con arroz y huevo': ['korean soy braised beef side dish rice', ['jangjorim', 'braised beef', 'soy braised']],
  'Lobio de alubias rojas y nueces': ['georgian red bean stew walnuts bowl', ['lobio', 'bean stew', 'red bean']],
  'Aloo paratha con yogur': ['indian stuffed flatbread paratha with yogurt', ['paratha']],
  'Boxty con huevo': ['irish potato pancake plate fried egg', ['boxty', 'potato pancake', 'potato cake']],
  'Migas extremenas con huevo': ['spanish migas fried breadcrumbs pan', ['migas', 'breadcrumb']],
  'Pan con chicharron': ['peruvian pork sandwich bread plate', ['chicharron', 'pork sandwich']],
  'Akara con pan': ['west african bean fritters plate', ['akara', 'bean fritter', 'fritter']],
  'Sopa a la minuta': ['peruvian beef noodle soup bowl', ['minuta', 'beef noodle soup', 'noodle soup']],
  'Fette biscottate con ricotta y miel': ['rusk toast topped ricotta honey', ['rusk', 'biscottate', 'toast']],
  'Melanzane ripiene di ricotta': ['baked stuffed eggplant halves ricotta', ['stuffed eggplant', 'stuffed aubergine']],
  'Molokhia con pollo': ['egyptian molokhia green stew chicken rice', ['molokhia', 'mulukhiyah', 'green stew']],
  'Jok con tofu crujiente': ['thai rice congee bowl porridge', ['jok', 'congee', 'porridge']],
  'Tofu hanbagu': ['japanese hamburg steak patty plate sauce', ['hanbagu', 'hamburg steak', 'tofu patty']],
  'Tofu no kabayaki don': ['glazed tofu rice bowl donburi', ['kabayaki', 'glazed tofu', 'tofu rice']],
  'Orecchiette con brocoli y salchicha': ['orecchiette pasta broccoli sausage plate', ['orecchiette']],
  'Pasta e ceci': ['italian pasta and chickpea soup bowl', ['pasta e ceci', 'chickpea pasta', 'chickpea soup']],
  'Chiles rellenos de queso': ['mexican stuffed poblano peppers cheese plate', ['chiles rellenos', 'stuffed pepper', 'stuffed poblano']],
  'Kao fu hong shao': ['chinese braised wheat gluten mushrooms bowl', ['kao fu', 'wheat gluten', 'braised gluten']],
  'Nasi lemak vegetariano': ['nasi lemak coconut rice banana leaf plate', ['nasi lemak']],
  'Tempeh goreng con nasi y sambal': ['fried tempeh rice sambal plate', ['tempeh', 'tempe']],
  'Nasi uduk con huevo': ['indonesian coconut rice plate egg', ['nasi uduk', 'coconut rice']],
  'Pasta alla Norma': ['pasta alla norma eggplant tomato basil', ['alla norma', 'eggplant pasta']],
  'Acorda alentejana': ['portuguese bread soup egg coriander bowl', ['acorda', 'bread soup']],
  'Afelia': ['cypriot pork stew red wine coriander', ['afelia', 'pork stew']],
  'Biftekia gemista': ['greek stuffed burger patties baked plate', ['biftekia', 'stuffed burger', 'stuffed patty']],
  'Oeufs a la coque con mouillettes': ['soft boiled egg in egg cup toast soldiers', ['soft boiled egg', 'boiled egg', 'egg cup']],
  'Tavuklu pilav': ['turkish chicken rice pilaf plate', ['pilav', 'pilaf', 'chicken rice']],
  'Bissara': ['moroccan fava bean soup olive oil bowl', ['bissara', 'fava bean soup', 'bean soup']],
  'Cerkez tavugu': ['circassian chicken walnut sauce plate', ['circassian', 'walnut sauce', 'chicken walnut']],
  'Coliflor gratinada': ['cauliflower cheese gratin baked dish', ['cauliflower']],
  'Fakes': ['greek lentil soup bowl', ['fakes', 'lentil soup']],
  'Gyeran jjim': ['korean steamed egg custard bowl', ['gyeran', 'steamed egg', 'egg custard']],
  'Keftedes tiganites': ['greek fried meatballs plate', ['keftedes', 'fried meatball', 'meatball']],
  'Bo luc lac': ['vietnamese shaking beef cubes plate', ['shaking beef', 'luc lac', 'beef cubes']],
  'Pad see ew jay': ['thai stir fried wide rice noodles plate', ['pad see ew', 'wide rice noodle', 'stir fried noodle']],
  'Bun bo Nam Bo': ['vietnamese rice noodle salad bowl herbs', ['bun bo', 'noodle salad', 'rice noodle']],
  'Dau hu sot ca chua': ['tofu in tomato sauce bowl vietnamese', ['tofu tomato', 'tofu in tomato']],
  'Xoi man': ['vietnamese savoury sticky rice bowl', ['xoi', 'sticky rice']],
  'Pad krapow tao hu': ['thai basil stir fry tofu rice fried egg', ['krapow', 'basil tofu', 'thai basil']],
  'Tostada de crema de cacahuete y platano': ['peanut butter banana toast slices plate', ['peanut butter toast', 'banana toast', 'peanut butter']],
  'Cuscus marroqui de ternera y siete verduras': ['moroccan couscous vegetables platter', ['couscous']],
  'Lentejas de Puy con huevo mollet': ['puy lentils soft boiled egg plate', ['puy lentil', 'lentil']],
  'Mi can kho tieu': ['braised seitan black pepper claypot', ['seitan', 'wheat gluten']],
  'Sopa de lentejas con platano macho': ['lentil soup bowl plantain', ['lentil soup', 'lentil']],
  'Dan dan mian vegetariano': ['dan dan noodles bowl chili sesame', ['dan dan', 'sesame noodle']],
  'Guiso de lentejas argentino': ['lentil stew bowl chorizo', ['lentil stew', 'lentil']],
  'Pot-au-feu': ['french pot au feu boiled beef vegetables broth', ['pot au feu', 'beef broth', 'boiled beef']],
  'Egg banjo': ['british fried egg sandwich white bread', ['egg sandwich', 'fried egg']],
  'Perico': ['venezuelan scrambled eggs tomato onion', ['scrambled egg', 'perico']],
  'Tacu tacu con salsa criolla': ['peruvian tacu tacu rice beans patty plate', ['tacu tacu', 'rice and beans']],
  'Doro wat': ['ethiopian doro wat chicken stew injera', ['doro wat', 'ethiopian stew', 'injera']],
  'Hirino sto fourno me patates lemonates': ['greek roast pork lemon potatoes tray', ['roast pork', 'pork potatoes']],
  'Tas kebabi': ['turkish beef stew rice plate', ['tas kebab', 'beef stew']],
  'Ga kho gung': ['vietnamese braised chicken ginger claypot', ['braised chicken', 'chicken ginger']],
  'Doufu gan chao qincai': ['stir fried tofu strips celery plate', ['tofu celery', 'tofu strips', 'dried tofu']],
  'Dau hu chien sa ot': ['fried tofu lemongrass chili vietnamese', ['lemongrass tofu', 'fried tofu']],
  'Kare-kare de verduras': ['filipino kare kare peanut stew vegetables', ['kare kare', 'peanut stew']],
  'Adobong manok': ['filipino chicken adobo soy vinegar rice plate', ['adobo', 'braised chicken']],
  'Adobong tokwa at kabute': ['braised tofu mushrooms soy sauce bowl', ['braised tofu', 'tofu mushroom']],
  'Agedashi dofu': ['agedashi tofu crispy cubes broth bowl', ['agedashi', 'fried tofu']],
  'Anali kizli': ['turkish soup bulgur meatballs chickpeas bowl', ['meatball soup', 'chickpea soup']],
  'Anda bhurji': ['indian spiced scrambled eggs masala plate', ['bhurji', 'spiced scrambled', 'masala egg']],
  'Arpa sehriyeli tavuk sote': ['chicken saute with orzo pasta plate', ['orzo']],
  'Ash-e mast': ['persian yogurt soup herbs legumes bowl', ['yogurt soup', 'persian soup']],
  'Ash-e reshteh': ['persian noodle and bean soup herbs bowl', ['persian soup', 'bean soup', 'noodle soup']],
  'Bableves': ['hungarian bean soup sour cream bowl', ['bean soup']],
  'Barbunya pilaki': ['turkish borlotti beans olive oil cold dish', ['borlotti', 'beans in olive oil']],
  'Bauernfruhstuck': ['german potato bacon egg skillet breakfast', ['potato omelette', 'farmer breakfast', 'potato and egg']],
  'Bekri meze': ['greek pork stew peppers tomato bowl', ['pork stew']],
  'Beoseot bulgogi': ['korean mushroom bulgogi stir fry pan', ['mushroom bulgogi', 'bulgogi']],
  'Beoseot deopbap': ['korean rice bowl mushrooms vegetables', ['deopbap', 'mushroom rice bowl']],
  'Bindaetteok': ['korean mung bean pancake plate', ['mung bean pancake', 'bindaetteok']],
  'Bistek Tagalog': ['filipino beef steak onions rice plate', ['beef steak onion', 'bistek']],
  'Brunswick stew': ['southern brunswick stew bowl corn beans', ['brunswick', 'chicken stew']],
  'Burghul bi dfeen': ['bulgur with chickpeas and beef platter', ['bulgur']],
  'Calentado paisa': ['colombian rice beans breakfast fried egg plate', ['calentado', 'rice and beans']],
  'Canja de galinha': ['chicken and rice soup bowl lemon', ['chicken soup', 'chicken rice soup']],
  'Cazuela de vacuno': ['chilean beef pumpkin corn soup bowl', ['beef soup', 'pumpkin soup']],
  'Chakhokhbili': ['georgian chicken tomato herb stew pot', ['chicken stew']],
  'Chapati con maharagwe': ['chapati flatbread with coconut bean stew', ['chapati', 'bean stew']],
  'Charquican': ['chilean charquican mashed pumpkin stew plate', ['charquican', 'pumpkin stew']],
  'Chashushuli': ['georgian beef tomato stew bowl', ['beef stew']],
  'Chirbuli': ['eggs poached in tomato walnut sauce pan', ['eggs in tomato', 'poached egg tomato']],
  'Ca ri chay': ['vietnamese vegetarian coconut curry tofu bowl', ['coconut curry', 'vegetarian curry']],
  'Dak gomtang': ['korean clear chicken soup bowl', ['gomtang', 'chicken soup']],
  'Dakbokkeumtang': ['korean spicy braised chicken potatoes pot', ['spicy chicken', 'braised chicken']],
  'Doenjang jjigae de tofu y calabacin': ['korean soybean paste stew tofu stone pot', ['jjigae', 'soybean paste stew']],
  'Domatokeftedes': ['greek tomato fritters plate', ['tomato fritter', 'fritters']],
  'Egg podimas': ['south indian scrambled egg curry leaves plate', ['podimas', 'scrambled egg curry']],
  'Eggah de puerro': ['baked herb omelette slices plate', ['omelette', 'frittata']],
  'Eiersalade broodje': ['egg salad sandwich on bread plate', ['egg salad sandwich', 'egg salad']],
  'Elarji': ['georgian cheese cornmeal porridge bowl', ['elarji', 'cheese polenta', 'cornmeal']],
  'Enfrijoladas': ['mexican tortillas in black bean sauce plate', ['enfrijoladas', 'bean sauce']],
  'Entomatadas de queso': ['mexican tortillas in tomato sauce cheese plate', ['entomatadas', 'tomato sauce tortilla']],
  'Etli bamya': ['okra stew with beef and tomato bowl', ['okra stew', 'okra']],
  'Etli nohut yemegi': ['chickpea stew with beef tomato bowl', ['chickpea stew']],
  'Etli turlu': ['turkish vegetable and meat casserole baked', ['turlu', 'vegetable stew', 'vegetable casserole']],
  'Fasolakia me kima': ['green beans stewed with minced meat tomato', ['green bean stew', 'green beans tomato']],
  'Fasolia bi lahme': ['white bean stew with beef tomato bowl', ['bean stew']],
  'Fasolka po bretonsku': ['polish white beans sausage tomato bowl', ['baked beans', 'bean stew']],
  'Fattet batenjan': ['levantine eggplant chickpea yogurt platter pita', ['fatteh', 'eggplant yogurt']],
  'Fava santorini': ['greek yellow split pea puree olive oil onion', ['split pea puree', 'fava dip']],
  'Fideos a la cazuela con costilla y chorizo': ['spanish noodle stew with ribs and chorizo pot', ['noodle stew', 'fideos']],
  'Freekeh bi djej': ['freekeh green wheat pilaf with chicken platter', ['freekeh']],
  'Frijoles charros': ['mexican charro beans bacon chorizo bowl', ['charro beans', 'bean soup']],
  'Ful medames': ['egyptian fava bean stew bowl olive oil bread', ['ful medames', 'fava bean']],
  'Gaeng keow wan jay': ['thai green curry tofu vegetables bowl', ['green curry']],
  'Gibanica': ['serbian filo cheese pie slice baked', ['gibanica', 'cheese pie', 'filo pie']],
  'Gigantes plaki': ['greek baked giant beans tomato sauce dish', ['giant beans', 'baked beans']],
  'Goma dare soba': ['cold soba noodles sesame sauce bowl', ['soba']],
  'Griessbrei': ['semolina milk pudding bowl cinnamon', ['semolina pudding', 'semolina porridge']],
  'Gulyasleves': ['hungarian goulash soup bowl paprika', ['goulash']],
  'Hirino me prasa': ['greek pork and leek stew pot', ['pork stew', 'pork leek']],
  'Hirino me selino avgolemono': ['greek pork celery lemon egg sauce stew', ['pork stew', 'avgolemono']],
  'Ispanakli borek': ['turkish spinach feta filo pastry slices', ['borek', 'spinach pie', 'filo pastry']],
  'Jia chang doufu': ['sichuan home style tofu peppers plate', ['home style tofu', 'braised tofu']],
  'Kadinbudu kofte': ['turkish fried meat and rice croquettes plate', ['kofte', 'meat croquette', 'fried meatball']],
  'Kaisersemmel con Liptauer': ['austrian bread roll with paprika cheese spread', ['liptauer', 'cheese spread', 'bread roll']],
  'Kenchinjiru': ['japanese clear vegetable tofu soup bowl', ['vegetable soup', 'tofu soup']],
  'Khagineh': ['persian sweet saffron omelette plate', ['sweet omelette', 'saffron egg']],
  'Khai krata': ['thai skillet eggs with sausage pan', ['skillet egg', 'pan eggs', 'fried egg pan']],
  'Kharcho': ['georgian beef rice walnut soup bowl', ['beef soup', 'rice soup']],
  'Kibbet lakteen': ['pumpkin bulgur kibbeh baked tray', ['kibbeh', 'bulgur pie']],
  'Kik alicha': ['ethiopian yellow split pea stew injera', ['split pea stew', 'ethiopian stew', 'injera']],
  'Kokoras krasatos': ['greek rooster in red wine sauce with pasta', ['rooster wine', 'chicken red wine', 'chicken stew']],
  'Kolokithakia gemista me kima': ['stuffed zucchini with rice and meat baked', ['stuffed zucchini', 'stuffed courgette']],
  'Kolokithokeftedes': ['greek zucchini feta fritters plate', ['zucchini fritter', 'courgette fritter']],
  'Kongbiji jjigae': ['korean ground soybean stew pot kimchi', ['jjigae', 'soybean stew']],
  'Kotopoulo kapama': ['greek braised chicken tomato cinnamon pot', ['braised chicken', 'chicken tomato']],
  'Kotopoulo me bamies': ['chicken with okra in tomato sauce pot', ['okra', 'okra stew']],
  'Kotopoulo me fasolakia': ['chicken with green beans tomato stew', ['green bean stew', 'chicken stew']],
  'Kotosoupa avgolemono': ['greek chicken lemon rice soup bowl', ['avgolemono', 'chicken soup']],
  'Koupepia': ['stuffed vine leaves rolls on a plate', ['vine leaves', 'dolma', 'stuffed grape leaves']],
  'Kousa mahshi bi laban': ['stuffed zucchini in yogurt sauce platter', ['stuffed zucchini', 'yogurt sauce']],
  'Kreatopita': ['greek meat filo pie slice baked', ['meat pie', 'filo pie']],
  'Kuru fasulye': ['turkish white bean stew tomato bowl rice', ['bean stew', 'white beans']],
  'Kefir con muesli y twarog': ['bowl of kefir with granola and cottage cheese', ['granola', 'muesli', 'kefir']],
  'Kiymali karnabahar': ['cauliflower with minced meat tomato bake', ['cauliflower']],
  'Kiymali pirasa': ['braised leeks with minced meat and rice pot', ['leek', 'braised leek']],
  'Linsensuppe mit Wurstchen': ['german lentil soup with sausage bowl', ['lentil soup']],
  'Maghmour': ['lebanese eggplant chickpea tomato stew bowl', ['eggplant stew', 'eggplant chickpea']],
  'Massaman jay': ['thai massaman curry potatoes tofu bowl', ['massaman']],
  'Matar paneer': ['indian paneer and pea curry bowl', ['matar paneer', 'paneer curry', 'paneer']],
  'Mercimek koftesi': ['turkish red lentil bulgur patties lettuce plate', ['lentil kofte', 'lentil balls', 'lentil patties']],
  'Michirones': ['spanish stewed dried broad beans chorizo bowl', ['broad bean', 'fava bean stew']],
  'Mirza ghasemi': ['persian smoked eggplant tomato egg dish', ['eggplant egg', 'smoked eggplant']],
  'Misir wot': ['ethiopian spicy red lentil stew injera', ['lentil stew', 'ethiopian stew', 'injera']],
  'Miyeokguk': ['korean seaweed soup bowl with beef', ['seaweed soup']],
  'Moros y cristianos': ['cuban black beans and rice plate', ['black beans and rice', 'rice and beans']],
  'Moschari lemonato': ['greek lemon braised veal with potatoes plate', ['braised veal', 'lemon beef', 'beef stew']],
  'Msabbaha': ['whole chickpeas with tahini olive oil plate', ['msabbaha', 'chickpea plate', 'hummus']],
  'Mujaddara': ['lentils and rice with caramelized onions platter', ['mujaddara', 'lentils and rice']],
  'Mucver': ['turkish zucchini fritters plate with yogurt', ['zucchini fritter', 'courgette fritter']],
  'Nalesniki con requeson': ['polish crepes filled with cottage cheese plate', ['crepe', 'pancake roll', 'blintz']],
  'Nargesi': ['persian spinach and eggs skillet', ['spinach egg', 'eggs spinach']],
  'Nohutlu bulgur pilavi': ['bulgur pilaf with chickpeas plate', ['bulgur', 'bulgur pilaf']],
  'Ontbijtkoek con huttenkase': ['dutch spiced cake slices with cottage cheese', ['spiced cake', 'gingerbread slice', 'cottage cheese']],
  'Orman kebabi': ['turkish beef stew with potatoes and peas plate', ['beef stew']],
  'Palacsinta con turo': ['hungarian pancakes filled with cottage cheese plate', ['pancake', 'crepe']],
  'Papadzules': ['yucatan tortillas in pumpkin seed sauce plate', ['papadzules', 'pumpkin seed sauce']],
  'Papas arrugadas con mojo picon': ['canary wrinkled potatoes with mojo sauce', ['wrinkled potato', 'mojo', 'papas arrugadas']],
  'Papaz yahnisi': ['turkish beef and shallot stew bowl', ['beef stew', 'onion stew']],
  'Pasta e fagioli': ['italian pasta and bean soup bowl', ['pasta e fagioli', 'bean soup', 'pasta bean']],
  'Pastitsada de pollo': ['corfu chicken in spiced tomato sauce with pasta', ['pastitsada', 'chicken tomato pasta']],
  'Peynirli gozleme': ['turkish gozleme flatbread with cheese griddle', ['gozleme', 'stuffed flatbread']],
  'Pipian verde de pepitas': ['mexican green pumpkin seed sauce plate', ['pipian', 'green mole', 'pumpkin seed sauce']],
  'Placki ziemniaczane': ['polish potato pancakes with sour cream plate', ['potato pancake', 'potato fritter']],
  'Porotos granados': ['chilean bean pumpkin and corn stew bowl', ['bean stew', 'pumpkin stew']],
  'Poulet basquaise': ['french basque chicken with peppers tomato pot', ['basquaise', 'chicken peppers', 'chicken stew']],
  'Pozole rojo': ['mexican red pozole soup bowl hominy garnish', ['pozole', 'hominy']],
  'Puuro con leche y bayas': ['oat porridge bowl with berries', ['porridge', 'oatmeal']],
  'Rajas con crema y elote': ['mexican poblano strips in cream with corn', ['rajas', 'pepper strips cream']],
  'Rakott krumpli': ['hungarian layered potato egg sour cream bake', ['layered potato', 'potato casserole', 'potato bake']],
  'Revithada de Sifnos': ['greek baked chickpeas in clay pot lemon', ['baked chickpeas', 'chickpea stew']],
  'Ribollita': ['tuscan bread and bean soup bowl kale', ['ribollita', 'bread soup', 'bean soup']],
  'Sac kavurma': ['turkish beef saute with peppers in iron pan', ['kavurma', 'beef saute', 'meat pan']],
  'Shchi': ['russian cabbage soup bowl sour cream', ['cabbage soup']],
  'Shiro wot': ['ethiopian chickpea flour stew injera platter', ['shiro', 'ethiopian stew', 'injera']],
  'Sinigang na baboy': ['filipino sour tamarind pork soup bowl vegetables', ['sinigang', 'tamarind soup', 'sour soup']],
  'Skyr con rugbraud y arandanos': ['skyr yogurt bowl with rye bread and blueberries', ['skyr', 'yogurt bowl', 'rye bread']],
  'Sofrito corfiota': ['greek veal in garlic parsley white sauce plate', ['veal', 'beef garlic sauce']],
  'Sopa azteca': ['mexican tortilla soup bowl with strips', ['tortilla soup']],
  'Sopa da pedra': ['portuguese bean and pork soup bowl', ['bean soup']],
  'Soutzoukakia Smyrneika': ['greek baked meat rolls in tomato sauce', ['meatball tomato', 'meat rolls', 'meatballs sauce']],
  'Stifado de ternera': ['greek beef and shallot stew pot cinnamon', ['stifado', 'beef stew', 'onion stew']],
  'Strammer Max': ['german open sandwich ham fried egg rye bread', ['open sandwich', 'ham and egg', 'fried egg bread']],
  'Suan la tang': ['chinese hot and sour soup bowl tofu', ['hot and sour soup']],
  'Sucuklu yumurta': ['turkish eggs with sucuk sausage in a pan', ['sucuk', 'eggs sausage pan']],
  'Sulu kofte': ['turkish meatball soup with bulgur bowl', ['meatball soup']],
  'Tallarines verdes con bistec apanado': ['peruvian green basil spaghetti with breaded steak', ['green spaghetti', 'pesto pasta steak', 'basil pasta']],
  'Tantanmen vegano': ['japanese tantanmen sesame ramen bowl', ['tantanmen', 'sesame ramen', 'ramen']],
  'Tavuk guvec': ['turkish chicken casserole clay pot vegetables', ['guvec', 'chicken casserole']],
  'Tavuk kanat izgara': ['grilled chicken wings on a plate', ['chicken wings']],
  'Tavuk kavurma': ['turkish chicken saute with peppers pan', ['chicken saute', 'chicken pan']],
  'Tavuklu firik pilavi': ['freekeh pilaf with chicken platter', ['freekeh', 'pilaf']],
  'Tavce gravce': ['macedonian baked beans in clay pot paprika', ['baked beans', 'bean stew']],
  'Tempe orek': ['indonesian sweet fried tempeh strips plate', ['tempeh', 'tempe']],
  'Terbiyeli kofte': ['turkish meatballs in lemon egg sauce bowl', ['meatball', 'meatballs sauce']],
  'Tibs': ['ethiopian sauteed beef strips with peppers pan', ['tibs', 'beef saute', 'ethiopian']],
  'Tigania hirini': ['greek pan fried pork pieces with peppers skillet', ['pork pan', 'fried pork']],
  'Tigrillo': ['ecuadorian mashed plantain with egg and cheese plate', ['plantain egg', 'mashed plantain', 'tigrillo']],
  'Tinola': ['filipino ginger chicken soup bowl greens', ['tinola', 'chicken ginger soup', 'chicken soup']],
  'Torta pasqualina': ['italian savoury chard ricotta egg pie slice', ['savory pie', 'chard pie', 'spinach pie']],
  'Tortang talong': ['filipino eggplant omelette on a plate', ['eggplant omelette', 'eggplant egg']],
  'Tteokguk': ['korean rice cake soup bowl egg', ['tteokguk', 'rice cake soup']],
  'Tvorog con smetana y miel': ['bowl of cottage cheese with sour cream honey walnuts', ['cottage cheese', 'quark bowl']],
  'Xihongshi chao jidan': ['chinese scrambled eggs with tomato plate', ['egg and tomato', 'tomato egg']],
  'Yachaejeon': ['korean vegetable pancake sliced plate', ['vegetable pancake', 'jeon']],
  'Yayla corbasi': ['turkish yogurt and rice soup bowl mint', ['yogurt soup']],
  'Youvarlakia avgolemono': ['greek meatball soup with lemon egg sauce bowl', ['meatball soup', 'avgolemono']],
  'Yogurtlu makarna con nueces': ['pasta with garlic yogurt sauce and walnuts plate', ['yogurt pasta', 'pasta yogurt']],
  'Yudofu': ['japanese simmered tofu in clear broth pot', ['simmered tofu', 'tofu pot', 'tofu broth']],
  'Yumurtali ispanak': ['turkish spinach with eggs and yogurt pan', ['spinach egg', 'eggs spinach']],
  'Yuxiang qiezi con tofu': ['sichuan fish fragrant eggplant with tofu plate', ['eggplant garlic sauce', 'braised eggplant']],
  'Zacusca con huevo': ['romanian roasted eggplant pepper spread with egg', ['zacusca', 'eggplant spread', 'pepper spread']],
  'Zarangollo murciano': ['spanish scrambled zucchini onion egg pan', ['zucchini egg', 'courgette egg']],
  'Aeggekage': ['danish thick omelette with bacon and tomato pan', ['omelette', 'egg cake']],
  'Cokertme kebabi': ['turkish beef strips with straw potatoes yogurt plate', ['kebab yogurt', 'beef potato yogurt']],
  'Islama kofte': ['turkish meatballs with soaked bread plate', ['kofte', 'meatball']],
  'Izmir kofte': ['turkish baked meatballs with potatoes tomato sauce', ['kofte', 'meatball potato']],
  'Icli kofte al horno': ['stuffed bulgur kibbeh baked on a plate', ['kibbeh', 'bulgur ball']],
  'Gnocchi alla romana': ['roman semolina gnocchi baked discs parmesan', ['semolina gnocchi', 'gnocchi alla romana', 'baked semolina']],
  'Kuku sabzi': ['persian herb frittata green slices plate', ['herb frittata', 'kuku', 'herb omelette']],
  ...REVISION_VISUAL,
}).map(([k, v]) => [clave(k), v]))

const DISH = {
  bibimbap: 'bibimbap', katsudon: 'katsudon', gyudon: 'gyudon', oyakodon: 'oyakodon',
  bulgogi: 'bulgogi', mapo: 'mapo tofu', ramen: 'ramen', gyozas: 'gyoza', gyoza: 'gyoza',
  risotto: 'risotto', tiramisu: 'tiramisu', teriyaki: 'teriyaki', satay: 'satay',
  yakitori: 'yakitori', shawarma: 'shawarma', shoarma: 'shawarma', shakshuka: 'shakshuka',
  menemen: 'menemen', skyr: 'skyr', souvlaki: 'souvlaki', gyros: 'gyros', kofte: 'kofte',
  piccata: 'piccata', quesadillas: 'quesadilla', poke: 'poke bowl',
  miso: 'miso', kung: 'kung pao', pesto: 'pesto', chili: 'chili con carne', larb: 'larb',
  bolonesa: 'bolognese', kapsalon: 'kapsalon', stamppot: 'stamppot', uitsmijter: 'uitsmijter',
  maafe: 'peanut stew', sundubu: 'sundubu jjigae', lomo: 'lomo saltado', frittata: 'frittata',
  fajitas: 'fajitas', burrito: 'burrito', gratinado: 'gratin', gratinados: 'gratin',
  graten: 'gratin', tzatziki: 'tzatziki',
  griega: 'greek salad', frita: 'fried custard',
  udon: 'udon', rendang: 'rendang', gado: 'gado gado', soto: 'soto ayam',
  mie: 'mie goreng', tikka: 'tikka masala', dal: 'dal', falafel: 'falafel',
  harira: 'harira', char: 'char siu', chow: 'chow mein', ropa: 'ropa vieja',
  goulash: 'goulash', minestrone: 'minestrone', carbonara: 'carbonara', panzanella: 'panzanella',
  gazpacho: 'gazpacho', salmorejo: 'salmorejo', ajoblanco: 'ajoblanco', vichyssoise: 'vichyssoise',
  hummus: 'hummus', tabule: 'tabbouleh', fattoush: 'fattoush', baba: 'baba ganoush',
  muhammara: 'muhammara', labneh: 'labneh', dolma: 'dolma', sarma: 'sarma', borek: 'borek',
  burek: 'borek', lahmacun: 'lahmacun', kanafeh: 'knafeh', baklava: 'baklava',
  okonomiyaki: 'okonomiyaki', omurice: 'omurice', yakisoba: 'yakisoba', karaage: 'karaage',
  tamagoyaki: 'tamagoyaki', japchae: 'japchae', kimbap: 'kimbap', tteokbokki: 'tteokbokki',
  kimchi: 'kimchi', jjigae: 'jjigae', pierogi: 'pierogi', latkes: 'latkes', borscht: 'borscht',
  koshari: 'koshari', mujadara: 'mujadara', maqluba: 'maqluba', kabsa: 'kabsa',
  tajine: 'tagine', arepa: 'arepa', arepas: 'arepa', empanadas: 'empanadas',
  guacamole: 'guacamole', chilaquiles: 'chilaquiles', carnitas: 'carnitas',
  cochinita: 'cochinita pibil', ceviche: 'ceviche', moqueca: 'moqueca',
  brigadeiros: 'brigadeiro', pavlova: 'pavlova', clafoutis: 'clafoutis', strudel: 'strudel',
  apfelstrudel: 'apfelstrudel', kaiserschmarrn: 'kaiserschmarrn', panna: 'panna cotta',
  zabaione: 'zabaglione', banoffee: 'banoffee pie', tatin: 'tarte tatin', brownie: 'brownie',
  crumble: 'crumble', torrijas: 'torrijas', flan: 'flan', natillas: 'custard',
  churros: 'churros', poffertjes: 'poffertjes', rosti: 'rosti', croque: 'croque monsieur',
  saltimbocca: 'saltimbocca', pastitsio: 'pastitsio', youvetsi: 'youvetsi',
  cacciatora: 'cacciatore', amatriciana: 'amatriciana', cacio: 'cacio e pepe',
  noquis: 'gnocchi', polenta: 'polenta', caponata: 'caponata', escalivada: 'escalivada',
  ensaladilla: 'russian salad', coleslaw: 'coleslaw', erwtensoep: 'pea soup',
  smorrebrod: 'smorrebrod', bagel: 'bagel', congee: 'congee', bao: 'bao bun',
  banh: 'banh mi', pho: 'pho', tom: 'tom kha gai', suya: 'suya', jollof: 'jollof rice',
  ful: 'ful medames', fatteh: 'fatteh', ezme: 'ezme', dakos: 'dakos', saganaki: 'saganaki',
  gemista: 'gemista', fasolada: 'fasolada', iskender: 'iskender kebab', cevapi: 'cevapi',
  khachapuri: 'khachapuri', pelmeni: 'pelmeni', bigos: 'bigos', porkolt: 'porkolt',
  tapsilog: 'tapsilog', adobo: 'filipino adobo', gyeranmari: 'gyeranmari',
  jajangmyeon: 'jajangmyeon', yukgaejang: 'yukgaejang', galbijjim: 'galbijjim',
  jjimdak: 'jjimdak', doenjang: 'doenjang jjigae', tteokgalbi: 'tteokgalbi',
  hotteok: 'hotteok', kimchijeon: 'kimchijeon', nikujaga: 'nikujaga', shogayaki: 'shogayaki',
  katsu: 'katsu curry', kare: 'japanese curry', chanpuru: 'goya chanpuru',
  loco: 'loco moco', pabellon: 'pabellon criollo', feijao: 'feijao', locro: 'locro',
  humita: 'humita', alfajores: 'alfajores', tres: 'tres leches',
}
const LEX = {
  albondigas: 'meatballs', arroz: 'rice', caldoso: 'rice', bacalao: 'cod', atun: 'tuna',
  salmon: 'salmon', pescado: 'fish', pavo: 'turkey', pollo: 'chicken', jamon: 'ham',
  huevo: 'egg', huevos: 'eggs', gambas: 'shrimp', ternera: 'beef', cerdo: 'pork',
  solomillo: 'pork', carne: 'meat', picadillo: 'beef', chorizo: 'chorizo',
  rookworst: 'sausage', caballa: 'mackerel', tofu: 'tofu', ayam: 'chicken',
  bacon: 'bacon', costilla: 'ribs', mortadela: 'mortadella', hamburguesa: 'burger',
  berenjena: 'eggplant', berenjenas: 'eggplant', parmesana: 'parmesan',
  garbanzos: 'chickpeas', alubias: 'beans', judias: 'beans', lentejas: 'lentils',
  frijoles: 'beans', frejoles: 'beans', edamame: 'edamame', quinoa: 'quinoa',
  estofado: 'stew', guisado: 'stew', guiso: 'stew', sopa: 'soup', ensalada: 'salad',
  caldo: 'soup', crema: 'soup', pure: 'mashed potato', braseado: 'braised',
  curry: 'curry', pasta: 'pasta', macarrones: 'macaroni', noodles: 'noodles',
  tagliatelle: 'tagliatelle', bucatini: 'bucatini', orzo: 'orzo', cuscus: 'couscous',
  fideos: 'noodles', tortilla: 'omelette', omelette: 'omelette', tortitas: 'pancakes',
  bowl: 'bowl', quesadilla: 'quesadilla', wrap: 'wrap', wraps: 'wrap',
  tosta: 'toast', tostada: 'toast', toast: 'toast', sandwich: 'sandwich',
  sanduiche: 'sandwich', bocadillo: 'sandwich', pan: 'bread', pita: 'pita',
  batido: 'smoothie', hamburguesas: 'burger', brochetas: 'skewers', pinchos: 'skewers',
  espinacas: 'spinach', brocoli: 'broccoli', patata: 'potato', patatas: 'potatoes',
  papas: 'potatoes', papa: 'potato', boniato: 'sweet potato', calabaza: 'pumpkin',
  tomate: 'tomato', tomates: 'tomatoes', feta: 'feta', queso: 'cheese', halloumi: 'halloumi',
  ricotta: 'ricotta', tvorog: 'cottage cheese', huttenkase: 'cottage cheese',
  champinones: 'mushrooms', setas: 'mushrooms', esparragos: 'asparagus',
  champinon: 'mushroom', coco: 'coconut', maiz: 'corn', guisantes: 'peas', aguacate: 'avocado',
  avena: 'oatmeal', platano: 'banana', fruta: 'fruit', col: 'cabbage', verduras: 'vegetables',
  remolacha: 'beetroot', naranja: 'orange', manzana: 'apple', manzanas: 'apples',
  peras: 'pears', cerezas: 'cherries', fresas: 'strawberries', mango: 'mango',
  uvas: 'grapes', nueces: 'walnuts', almendra: 'almond', almendras: 'almonds',
  ciruelas: 'prunes', pasas: 'raisins', frutos: 'berries',
  cacahuete: 'peanut', pinones: 'pine nuts',
  sesamo: 'sesame', semillas: 'seeds', pepino: 'cucumber', cebolla: 'onion',
  cebolleta: 'spring onion', zanahoria: 'carrot', pimiento: 'pepper', pak: 'pak choi',
  ajo: 'garlic', ajillo: 'garlic', limon: 'lemon', mostaza: 'mustard', albahaca: 'basil',
  kwark: 'yogurt', quark: 'yogurt', yogur: 'yogurt', nata: 'cream', chia: 'chia',
  cacao: 'chocolate', chocolate: 'chocolate', vainilla: 'vanilla', miel: 'honey',
  semola: 'semolina', mijo: 'millet', sarraceno: 'buckwheat', tahini: 'tahini',
  soja: 'soy', agridulce: 'sweet and sour', chimichurri: 'chimichurri', ajvar: 'ajvar',
  frito: 'fried', fritos: 'fried', salteado: 'stir fry', saltado: 'stir fry',
  empanado: 'breaded', panko: 'panko', asado: 'roasted', asada: 'roasted',
  asadas: 'roasted', horno: 'baked', plancha: 'grilled', glaseado: 'glazed',
  revueltos: 'scrambled', revuelto: 'scrambled', rellenos: 'stuffed', rellenas: 'stuffed',
  relleno: 'stuffed', escalfados: 'poached', escalfado: 'poached', cocido: 'boiled',
  cesar: 'caesar', picante: 'spicy', ahumada: 'smoked', ahumado: 'smoked',
  helado: 'ice cream', mousse: 'mousse', pudin: 'pudding', budin: 'pudding',
  tarta: 'cake', pastel: 'cake', pie: 'pie', croquetas: 'croquettes',
  porridge: 'porridge', gachas: 'porridge', muesli: 'muesli', oats: 'oats',
}
const ADJ = {
  coreano: 'korean', coreana: 'korean', japones: 'japanese', japonesa: 'japanese',
  chino: 'chinese', china: 'chinese', vietnamita: 'vietnamese', vietnamitas: 'vietnamese',
  tailandes: 'thai', tailandesa: 'thai', indonesio: 'indonesian', indonesia: 'indonesian',
  filipino: 'filipino', turco: 'turkish', turca: 'turkish', griego: 'greek',
  libanes: 'lebanese', libanesa: 'lebanese', persa: 'persian', egipcio: 'egyptian',
  tunecino: 'tunisian', argelina: 'algerian', marroqui: 'moroccan',
  italiano: 'italian', italiana: 'italian', siciliana: 'sicilian', romana: 'roman',
  frances: 'french', francesa: 'french', aleman: 'german', alemana: 'german',
  suizo: 'swiss', suiza: 'swiss', holandes: 'dutch', holandesa: 'dutch',
  portugues: 'portuguese', portuguesa: 'portuguese', polaco: 'polish', polaca: 'polish',
  hungaro: 'hungarian', ucraniano: 'ukrainian', ucraniana: 'ukrainian',
  ruso: 'russian', rusa: 'russian', georgiano: 'georgian', cretense: 'cretan',
  mexicano: 'mexican', mexicana: 'mexican', peruano: 'peruvian', peruana: 'peruvian',
  argentino: 'argentinian', argentinas: 'argentinian', brasileno: 'brazilian',
  criollo: 'creole', cubano: 'cuban', venezolano: 'venezuelan', limeno: 'peruvian',
  espanola: 'spanish', espanol: 'spanish', catalana: 'catalan', andaluz: 'andalusian',
  castellana: 'castilian', gallego: 'galician', malagueno: 'malaga', cordobes: 'cordoba',
  africano: 'african', arabe: 'arabic',
}
const STOP = new Set(['de', 'del', 'con', 'y', 'en', 'al', 'a', 'la', 'el', 'los', 'las',
  'por', 'para', 'sin', 'e', 'o', 'un', 'una', 'blancas', 'blanca', 'negro', 'negra',
  'oriental', 'casero', 'casera', 'caseros', 'caseras', 'rapido', 'rapida', 'proteica',
  'proteico', 'bote', 'estilo', 'verdes', 'fresca', 'tres', 'golpes',
  'fresco', 'especiado', 'desmechado', 'picada', 'perla', 'exprs', 'expres', 'express',
  'krapow', 'goreng', 'pao', 'sis', 'leche', 'frio', 'fria', 'salado', 'salada',
  'dulce', 'tipo', 'mini', 'grande', 'pequeno', 'suave', 'ligero', 'clasico', 'clasica',
  'tradicional', 'sorrentina', 'vera', 'pimenton', 'mayo', 'spicy', 'facil', 'simple',
  'alla', 'all', 'aux', 'les', 'des'])
const MODO = new Set(['fried', 'stir fry', 'breaded', 'panko', 'roasted', 'baked',
  'grilled', 'glazed', 'scrambled', 'stuffed', 'poached', 'boiled', 'smoked',
  'braised', 'spicy', 'sweet and sour', 'caesar', 'soup', 'stew', 'salad', 'bowl',
  'cake', 'pie', 'pudding', 'bread', 'meat', 'fish', 'fruit', 'vegetables',
  'cream', 'honey', 'garlic', 'onion', 'spring onion', 'lemon', 'basil', 'mustard',
  'seeds', 'sesame', 'soy', 'berries', 'raisins'])

function analyze(nombre) {
  const plano = deaccent(nombre).toLowerCase()
  const cabeza = plano.split('(')[0]
  const tokens = (s) => s.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean)
  const propios = new Set(tokens(cabeza))

  const en = [], named = [], adj = []
  let dish = null, pos = 0
  for (const t of tokens(plano)) {
    if (STOP.has(t) || t.length < 3) continue
    pos++
    if (ADJ[t]) { if (!adj.includes(ADJ[t])) adj.push(ADJ[t]); continue }
    const tr = DISH[t] || LEX[t]
    if (tr) {
      for (const w of tr.split(' ')) if (!en.includes(w)) en.push(w)
      if (DISH[t] && !dish) dish = tr
      continue
    }
    if (t.length >= 4 && propios.has(t) && pos <= 2 && !named.includes(t)) named.push(t)
  }

  const planes = []
  const manual = MANUAL[clave(cabeza)]
  if (manual) return [{ query: manual[0], require: manual[1], terms: manual[0].split(' ') }]
  if (named.length) {
    planes.push({
      query: [...named, ...adj, ...en.slice(0, 2)].join(' '),
      require: named,
      terms: [...named, ...en],
    })
  }
  if (dish) {
    planes.push({
      query: `${en.join(' ')} ${adj[0] ?? ''} food`.replace(/\s+/g, ' ').trim(),
      require: dish.split(' ').slice(0, 1),
      terms: en,
    })
    if (en.length > 1) {
      planes.push({
        query: `${dish} ${adj[0] ?? ''} food`.replace(/\s+/g, ' ').trim(),
        require: dish.split(' ').slice(0, 1),
        terms: [dish],
      })
    }
  }
  return planes.length ? planes : null
}

const CACHE_PATH = resolve(__dirname, 'unsplash-cache.json')
const cache = new Map(existsSync(CACHE_PATH)
  ? Object.entries(JSON.parse(readFileSync(CACHE_PATH, 'utf8')))
  : [])
const guardarCache = () =>
  writeFileSync(CACHE_PATH, JSON.stringify(Object.fromEntries(cache)))

let requests = 0
async function candidates(query, page = 1) {
  const key = page === 1 ? query : `${query}#${page}`
  if (cache.has(key)) return cache.get(key)
  const url = `https://api.unsplash.com/search/photos?per_page=30&page=${page}&content_filter=high&query=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${KEY}` } })
  requests++
  if (res.status === 403) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`Unsplash ${res.status}`)
  const results = ((await res.json()).results || []).map((p) => ({
    id: p.id, width: p.width, height: p.height, raw: p.urls.raw,
    description: p.description, alt_description: p.alt_description,
    tags: (p.tags || []).map((t) => ({ title: t.title })),
  }))
  cache.set(key, results)
  guardarCache()
  return results
}

const meta = (p) => deaccent([
  p.description, p.alt_description, ...(p.tags || []).map((t) => t.title),
].filter(Boolean).join(' ').toLowerCase()).replace(/[-_]/g, ' ')

const RECHAZO = new RegExp(`\\b(${[
  'raw', 'uncooked', 'ingredient', 'ingredients', 'isolated', 'white background',
  'market', 'farmers market', 'storefront', 'shopfront', 'grocery', 'supermarket',
  'packaging', 'package', 'packet', 'label', 'labeled', 'logo', 'menu', 'signage',
  'price', 'harvest', 'harvested', 'crop', 'field', 'farm', 'seeds', 'unpeeled',
].join('|')})\\b`)

const SERVIDO = new RegExp(`\\b(${[
  'plate', 'plated', 'bowl', 'dish', 'served', 'serving', 'meal', 'dinner', 'lunch',
  'breakfast', 'table', 'garnish', 'garnished', 'sauce', 'cooked', 'baked', 'roasted',
  'fried', 'stew', 'soup', 'salad', 'sandwich', 'dessert', 'pan', 'skillet', 'pot',
  'recipe', 'homemade', 'delicious', 'tasty', 'food',
].join('|')})\\b`)

function pick(cands, { require, terms }, used) {
  let best = null, bestScore = 0
  for (const p of cands) {
    if (used.has(p.id) || used.has(slug(p.raw))) continue
    const m = meta(p)
    if (RECHAZO.test(m)) continue
    if (!SERVIDO.test(m)) continue
    if (!require.some((r) => m.includes(r))) continue
    const score = terms.filter((k) => m.includes(k)).length
      + (p.width >= p.height ? 0.5 : 0)
    if (score > bestScore) { best = p; bestScore = score }
  }
  return best
}

const used = new Set()
for (const r of await sql`SELECT imagen FROM recetas WHERE imagen IS NOT NULL AND borrada_en IS NULL`) {
  const s = slug(r.imagen)
  if (s) used.add(s)
}
const BLOCK_PATH = resolve(__dirname, 'image-blocklist.json')
if (existsSync(BLOCK_PATH)) {
  for (const s of JSON.parse(readFileSync(BLOCK_PATH, 'utf8'))) used.add(s)
}

const arg = (flag) => { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : null }
const onlyIds = arg('--only')?.split(',').map((s) => s.trim()).filter(Boolean) ?? null
const priorityIds = new Set((arg('--priority')?.split(',').map((s) => s.trim()) ?? []).filter(Boolean))
const maxReq = Number(arg('--limit')) || Infinity

const LOOP = process.argv.includes('--loop')
const ESPERA = 61 * 60 * 1000

const [estado] = await sql`SELECT despensa FROM app_estado LIMIT 1`
const despensa = estado?.despensa ?? []

async function pendientesDeFoto() {
  let rows = (await sql`SELECT id, nombre, ingredientes FROM recetas WHERE imagen IS NULL AND borrada_en IS NULL`)
    .map((r) => ({ ...r, faltan: faltan(r, despensa) }))
  if (onlyIds) rows = rows.filter((r) => onlyIds.includes(r.id))
  rows.sort((a, b) =>
    (priorityIds.has(b.id) ? 1 : 0) - (priorityIds.has(a.id) ? 1 : 0)
    || a.faltan - b.faltan || a.nombre.localeCompare(b.nombre))
  return rows
}

let rows = await pendientesDeFoto()
console.log(`Pendientes: ${rows.length} | disponibles (faltan 0): ${rows.filter((r) => r.faltan === 0).length}`)

if (ANALYZE) {
  let n = 0
  for (const r of rows) {
    const planes = analyze(r.nombre)
    if (planes) {
      n++
      console.log(`  ${r.nombre}`)
      planes.forEach((p, i) => console.log(`      ${i + 1}. "${p.query}"  requiere [${p.require.join('|')}]`))
    } else console.log(`   NULL  ${r.nombre}`)
  }
  console.log(`\ntraducidas: ${n} | sin traducir: ${rows.length - n}`)
  process.exit(0)
}

const VOLCAR = Number(arg('--volcar')) || 0
const PAGINAS = (arg('--paginas') || '1').split(',').map(Number)
if (VOLCAR) {
  const salida = []
  for (const r of rows) {
    if (requests >= VOLCAR) break
    const planes = analyze(r.nombre)
    if (!planes) continue
    let cands = []
    try {
      for (const pag of PAGINAS) cands = cands.concat(await candidates(planes[0].query, pag))
    }
    catch (e) { if (e.message === 'RATE_LIMIT') break; else continue }
    const scored = cands
      .filter((p) => !used.has(p.id) && !used.has(slug(p.raw)))
      .map((p) => {
        const m = meta(p)
        return {
          p,
          ok: !RECHAZO.test(m) && SERVIDO.test(m) && planes[0].require.some((t) => m.includes(t)),
          score: planes[0].terms.filter((k) => m.includes(k)).length + (p.width >= p.height ? 0.5 : 0),
        }
      })
      .sort((a, b) => (b.ok - a.ok) || (b.score - a.score))
      .slice(0, 4)
    salida.push({
      id: r.id,
      nombre: r.nombre,
      query: planes[0].query,
      cands: scored.map((s) => ({
        id: s.p.id,
        raw: s.p.raw,
        ok: s.ok,
        txt: (s.p.description || s.p.alt_description || '').slice(0, 80),
      })),
    })
  }
  writeFileSync(resolve(__dirname, 'candidatos.json'), JSON.stringify(salida, null, 2))
  console.log(`volcadas ${salida.length} recetas con candidatos | peticiones: ${requests}`)
  process.exit(0)
}

const map = []
const sinMatch = new Map()
let done = 0, agotado = false

async function pasada(lote) {
  for (const r of lote) {
    if (requests >= maxReq) { agotado = true; return }
    const planes = analyze(r.nombre)
    if (!planes) { sinMatch.set(r.nombre, 'sin traducir'); continue }
    let photo = null, plan = null
    try {
      for (const p of planes) {
        photo = pick(await candidates(p.query), p, used)
        if (photo) { plan = p; break }
        if (requests >= maxReq) break
      }
      for (let page = 2; !photo && page <= 4 && requests < maxReq; page++) {
        photo = pick(await candidates(planes[0].query, page), planes[0], used)
        if (photo) plan = planes[0]
      }
    } catch (e) {
      if (e.message === 'RATE_LIMIT') { agotado = true; return }
      console.log(`  ! error ${r.nombre}: ${e.message}`)
      continue
    }
    if (!photo) {
      sinMatch.set(r.nombre, planes.map((p) => p.query).join(' / '))
      continue
    }
    used.add(photo.id)
    used.add(slug(photo.raw))
    const img = photo.raw + RENDER
    map.push({ id: r.id, nombre: r.nombre, query: plan.query, imagen: img })
    if (!DRY) await sql`UPDATE recetas SET imagen = ${img} WHERE id = ${r.id}`
    done++
    sinMatch.delete(r.nombre)
    console.log(`  ✓ ${r.nombre}  [${plan.query}]`)
    await new Promise((s) => setTimeout(s, 150))
  }
}

await pasada(rows)
while (LOOP && agotado && !DRY) {
  console.log(`\n[${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}] Rate limit tras ${done} fotos (${requests} peticiones). Espero 61 min.`)
  await new Promise((s) => setTimeout(s, ESPERA))
  requests = 0
  agotado = false
  rows = (await pendientesDeFoto()).filter((r) => !sinMatch.has(r.nombre))
  if (!rows.length) break
  console.log(`\n[${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}] Nueva tanda. Pendientes: ${rows.length}`)
  await pasada(rows)
}

writeFileSync(resolve(__dirname, 'image-map.json'), JSON.stringify(map, null, 2))
if (sinMatch.size) {
  console.log(`\nSiguen en watermark (${sinMatch.size}):`)
  for (const [nombre, q] of sinMatch) console.log(`  · ${nombre} — ${q}`)
}
console.log(`\n${DRY ? '[DRY] ' : ''}Actualizadas: ${done} | watermark: ${sinMatch.size}${agotado ? ' | corte por rate limit' : ''} | peticiones ultima tanda: ${requests}`)
