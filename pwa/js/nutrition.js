/* ══════════════════════════════════════════════════════════════
   FULL NUTRITION TRACKER
   - Food diary by meal (Breakfast / Lunch / Dinner / Snacks)
   - Built-in food database (80+ common foods)
   - Custom food creation
   - SVG macro progress rings
   - Water intake tracker (8-glass goal)
   - 7-day compliance history (tappable to navigate dates)
══════════════════════════════════════════════════════════════ */

/* ── FOOD DATABASE ─────────────────────────────────────────────
   cal / p / c / f — per one standard serving (qty = 1)
────────────────────────────────────────────────────────────── */
const FOOD_DB = [
  // Proteins
  // Chicken (raw unless noted)
  { id:'chicken_breast',  cat:'Protein', name:'Chicken Breast (Raw)',   cal:120, p:22,  c:0,   f:2.6, serving:'100g' },
  { id:'chk_breast_ckd',  cat:'Protein', name:'Chicken Breast (Cooked)',cal:165, p:31,  c:0,   f:3.6, serving:'100g' },
  { id:'chk_breast_6oz',  cat:'Protein', name:'Chicken Breast (6oz)',   cal:281, p:53,  c:0,   f:6.1, serving:'170g' },
  { id:'chk_breast_8oz',  cat:'Protein', name:'Chicken Breast (8oz)',   cal:374, p:70,  c:0,   f:8.2, serving:'227g' },
  { id:'chicken_thigh',   cat:'Protein', name:'Chicken Thigh (Boneless)',cal:209,p:26,  c:0,   f:11,  serving:'100g' },
  { id:'chk_thigh_skin',  cat:'Protein', name:'Chicken Thigh (With Skin)',cal:247,p:22, c:0,   f:17,  serving:'100g' },
  { id:'chk_drumstick',   cat:'Protein', name:'Chicken Drumstick',      cal:172, p:28,  c:0,   f:5.7, serving:'100g (no bone)' },
  { id:'chk_wing',        cat:'Protein', name:'Chicken Wing (Cooked)',  cal:203, p:30,  c:0,   f:8.1, serving:'1 wing (55g)' },
  { id:'chk_tenders',     cat:'Protein', name:'Chicken Tenders',        cal:131, p:23,  c:0,   f:3.5, serving:'100g' },
  // Ground beef by lean/fat ratio
  { id:'gb_97_3',         cat:'Protein', name:'Ground Beef 97/3',      cal:130, p:25,  c:0,   f:3,   serving:'100g' },
  { id:'gb_96_4',         cat:'Protein', name:'Ground Beef 96/4',      cal:137, p:24,  c:0,   f:4,   serving:'100g' },
  { id:'gb_93_7',         cat:'Protein', name:'Ground Beef 93/7',      cal:152, p:22,  c:0,   f:7,   serving:'100g' },
  { id:'gb_90_10',        cat:'Protein', name:'Ground Beef 90/10',     cal:176, p:20,  c:0,   f:10,  serving:'100g' },
  { id:'ground_beef',     cat:'Protein', name:'Ground Beef 85/15',     cal:215, p:19,  c:0,   f:15,  serving:'100g' },
  { id:'gb_80_20',        cat:'Protein', name:'Ground Beef 80/20',     cal:254, p:17,  c:0,   f:20,  serving:'100g' },
  { id:'gb_75_25',        cat:'Protein', name:'Ground Beef 75/25',     cal:292, p:15,  c:0,   f:25,  serving:'100g' },

  // Beef cuts (raw, 100g)
  { id:'beef_sirloin',    cat:'Protein', name:'Sirloin Steak',         cal:207, p:26,  c:0,   f:10,  serving:'100g' },
  { id:'beef_ribeye',     cat:'Protein', name:'Ribeye Steak',          cal:291, p:24,  c:0,   f:21,  serving:'100g' },
  { id:'beef_ny_strip',   cat:'Protein', name:'NY Strip Steak',        cal:271, p:25,  c:0,   f:18,  serving:'100g' },
  { id:'beef_tenderloin', cat:'Protein', name:'Beef Tenderloin (Filet)',cal:219, p:26,  c:0,   f:12,  serving:'100g' },
  { id:'beef_tbone',      cat:'Protein', name:'T-Bone Steak',          cal:249, p:24,  c:0,   f:16,  serving:'100g' },
  { id:'beef_flank',      cat:'Protein', name:'Flank Steak',           cal:192, p:28,  c:0,   f:8.4, serving:'100g' },
  { id:'beef_skirt',      cat:'Protein', name:'Skirt Steak',           cal:220, p:26,  c:0,   f:12,  serving:'100g' },
  { id:'beef_chuck',      cat:'Protein', name:'Chuck Roast',           cal:232, p:25,  c:0,   f:14,  serving:'100g' },
  { id:'beef_brisket',    cat:'Protein', name:'Brisket (Lean)',        cal:241, p:26,  c:0,   f:15,  serving:'100g' },
  { id:'beef_short_rib',  cat:'Protein', name:'Short Ribs (Braised)',  cal:295, p:22,  c:0,   f:22,  serving:'100g' },
  { id:'beef_top_round',  cat:'Protein', name:'Top Round (Eye of Round)',cal:169,p:27,  c:0,   f:5,   serving:'100g' },
  { id:'beef_bottom_round',cat:'Protein',name:'Bottom Round',          cal:182, p:27,  c:0,   f:7,   serving:'100g' },
  // Ground turkey by lean ratio
  { id:'gt_99_1',         cat:'Protein', name:'Ground Turkey 99/1',    cal:104, p:22,  c:0,   f:1,   serving:'100g' },
  { id:'gt_97_3',         cat:'Protein', name:'Ground Turkey 97/3',    cal:120, p:22,  c:0,   f:3,   serving:'100g' },
  { id:'ground_turkey',   cat:'Protein', name:'Ground Turkey 93/7',    cal:170, p:22,  c:0,   f:9,   serving:'100g' },
  { id:'gt_85_15',        cat:'Protein', name:'Ground Turkey 85/15',   cal:218, p:19,  c:0,   f:15,  serving:'100g' },
  { id:'turkey_breast',   cat:'Protein', name:'Turkey Breast (Cooked)',cal:135, p:30,  c:0,   f:1,   serving:'100g' },
  { id:'turkey_cutlet',   cat:'Protein', name:'Turkey Cutlet',         cal:147, p:32,  c:0,   f:1.4, serving:'100g' },
  // Fish & Seafood (specific)
  { id:'salmon_atlantic',  cat:'Protein', name:'Atlantic Salmon (Farmed)',cal:208,p:20,  c:0,   f:13,  serving:'100g' },
  { id:'salmon_wild',      cat:'Protein', name:'Wild Salmon (Sockeye)', cal:168, p:23,  c:0,   f:7.7, serving:'100g' },
  { id:'salmon_fillet_6oz',cat:'Protein', name:'Salmon Fillet (6oz)',   cal:354, p:38,  c:0,   f:22,  serving:'170g' },
  { id:'tuna_canned',      cat:'Protein', name:'Tuna (Canned, Water)',  cal:109, p:25,  c:0,   f:0.5, serving:'100g' },
  { id:'tuna_albacore',    cat:'Protein', name:'Albacore Tuna (Canned)',cal:123, p:27,  c:0,   f:1.6, serving:'100g' },
  { id:'tuna_yellowfin',   cat:'Protein', name:'Yellowfin Tuna (Raw)',  cal:109, p:24,  c:0,   f:0.5, serving:'100g' },
  { id:'tilapia',          cat:'Protein', name:'Tilapia (Fillet)',      cal:129, p:26,  c:0,   f:2.7, serving:'100g' },
  { id:'shrimp',           cat:'Protein', name:'Shrimp (Cooked)',       cal:99,  p:24,  c:0,   f:0.3, serving:'100g' },
  { id:'shrimp_large',     cat:'Protein', name:'Jumbo Shrimp (5 pieces)',cal:50, p:12,  c:0,   f:0.2, serving:'5 jumbo (85g)' },
  { id:'egg_whole',       cat:'Protein', name:'Egg (Large)',           cal:78,  p:6,   c:0.6, f:5,   serving:'1 egg' },
  { id:'egg_whites',      cat:'Protein', name:'Egg Whites',            cal:52,  p:11,  c:0.7, f:0.2, serving:'100g' },
  { id:'greek_yogurt',    cat:'Protein', name:'Greek Yogurt (0%)',     cal:59,  p:10,  c:3.6, f:0.4, serving:'100g' },
  { id:'cottage_cheese',  cat:'Protein', name:'Cottage Cheese',        cal:90,  p:12,  c:3,   f:2.5, serving:'100g' },
  { id:'whey_protein',    cat:'Protein', name:'Whey Protein (1 scoop)',cal:120, p:24,  c:3,   f:2,   serving:'30g scoop' },
  { id:'protein_bar',     cat:'Protein', name:'Protein Bar',           cal:210, p:20,  c:21,  f:8,   serving:'1 bar' },
  { id:'edamame',         cat:'Protein', name:'Edamame',               cal:122, p:11,  c:9.9, f:5.2, serving:'100g' },

  // Grains & Carbs
  { id:'white_rice',      cat:'Carbs',   name:'White Rice (Cooked)',   cal:130, p:2.7, c:28,  f:0.3, serving:'100g' },
  { id:'brown_rice',      cat:'Carbs',   name:'Brown Rice (Cooked)',   cal:111, p:2.6, c:23,  f:0.9, serving:'100g' },
  { id:'oats_dry',        cat:'Carbs',   name:'Oats (Dry)',            cal:150, p:5,   c:27,  f:2.7, serving:'40g' },
  { id:'oatmeal_cooked',  cat:'Carbs',   name:'Oatmeal (Cooked)',      cal:166, p:5.9, c:28,  f:3.6, serving:'1 cup' },
  { id:'pasta_cooked',    cat:'Carbs',   name:'Pasta (Cooked)',        cal:131, p:5,   c:25,  f:1.1, serving:'100g' },
  { id:'sweet_potato',    cat:'Carbs',   name:'Sweet Potato (Baked)',  cal:90,  p:2,   c:21,  f:0.1, serving:'100g' },
  { id:'white_potato',    cat:'Carbs',   name:'White Potato (Baked)',  cal:86,  p:1.9, c:20,  f:0.1, serving:'100g' },
  { id:'quinoa_cooked',   cat:'Carbs',   name:'Quinoa (Cooked)',       cal:120, p:4.4, c:21,  f:1.9, serving:'100g' },
  { id:'bread_ww',        cat:'Carbs',   name:'Whole Wheat Bread',     cal:79,  p:4,   c:13,  f:1.1, serving:'1 slice' },
  { id:'bread_white',     cat:'Carbs',   name:'White Bread',           cal:79,  p:2.7, c:15,  f:1,   serving:'1 slice' },
  { id:'tortilla_flour',  cat:'Carbs',   name:'Flour Tortilla',        cal:146, p:3.8, c:25,  f:3.5, serving:'1 medium' },
  { id:'bagel',           cat:'Carbs',   name:'Bagel (Plain)',         cal:270, p:10,  c:53,  f:1.5, serving:'1 bagel' },
  { id:'rice_cakes',      cat:'Carbs',   name:'Rice Cakes (Plain)',    cal:35,  p:0.7, c:7.3, f:0.3, serving:'1 cake' },

  // Fruits
  { id:'banana',          cat:'Fruit',   name:'Banana (Medium)',       cal:105, p:1.3, c:27,  f:0.4, serving:'1 medium' },
  { id:'apple',           cat:'Fruit',   name:'Apple (Medium)',        cal:95,  p:0.5, c:25,  f:0.3, serving:'1 medium' },
  { id:'blueberries',     cat:'Fruit',   name:'Blueberries',           cal:57,  p:0.7, c:14,  f:0.3, serving:'100g' },
  { id:'strawberries',    cat:'Fruit',   name:'Strawberries',          cal:32,  p:0.7, c:7.7, f:0.3, serving:'100g' },
  { id:'orange',          cat:'Fruit',   name:'Orange (Medium)',       cal:62,  p:1.2, c:15,  f:0.2, serving:'1 medium' },
  { id:'mango',           cat:'Fruit',   name:'Mango (1 cup)',         cal:99,  p:1.4, c:25,  f:0.6, serving:'1 cup' },
  { id:'grapes',          cat:'Fruit',   name:'Grapes',                cal:69,  p:0.7, c:18,  f:0.2, serving:'100g' },

  // Vegetables
  { id:'broccoli',        cat:'Veggie',  name:'Broccoli',              cal:34,  p:2.8, c:6.6, f:0.4, serving:'100g' },
  { id:'spinach',         cat:'Veggie',  name:'Spinach',               cal:23,  p:2.9, c:3.6, f:0.4, serving:'100g' },
  { id:'carrots',         cat:'Veggie',  name:'Carrots',               cal:41,  p:0.9, c:9.6, f:0.2, serving:'100g' },
  { id:'bell_pepper',     cat:'Veggie',  name:'Bell Pepper',           cal:31,  p:1,   c:6,   f:0.3, serving:'100g' },
  { id:'cucumber',        cat:'Veggie',  name:'Cucumber',              cal:15,  p:0.6, c:3.6, f:0.1, serving:'100g' },
  { id:'tomato',          cat:'Veggie',  name:'Tomato',                cal:18,  p:0.9, c:3.9, f:0.2, serving:'100g' },
  { id:'green_beans',     cat:'Veggie',  name:'Green Beans',           cal:31,  p:1.8, c:7,   f:0.2, serving:'100g' },
  { id:'asparagus',       cat:'Veggie',  name:'Asparagus',             cal:20,  p:2.2, c:3.9, f:0.1, serving:'100g' },
  { id:'kale',            cat:'Veggie',  name:'Kale',                  cal:49,  p:4.3, c:8.8, f:0.9, serving:'100g' },
  { id:'cauliflower',     cat:'Veggie',  name:'Cauliflower',           cal:25,  p:1.9, c:5,   f:0.3, serving:'100g' },
  { id:'zucchini',        cat:'Veggie',  name:'Zucchini',              cal:17,  p:1.2, c:3.1, f:0.3, serving:'100g' },
  { id:'mushrooms',       cat:'Veggie',  name:'Mushrooms',             cal:22,  p:3.1, c:3.3, f:0.3, serving:'100g' },

  // Dairy
  { id:'milk_whole',      cat:'Dairy',   name:'Whole Milk',            cal:61,  p:3.2, c:4.8, f:3.3, serving:'100ml' },
  { id:'milk_skim',       cat:'Dairy',   name:'Skim Milk',             cal:34,  p:3.4, c:5,   f:0.1, serving:'100ml' },
  { id:'cheddar',         cat:'Dairy',   name:'Cheddar Cheese',        cal:113, p:7,   c:0.4, f:9.3, serving:'28g (1oz)' },
  { id:'mozzarella',      cat:'Dairy',   name:'Mozzarella',            cal:85,  p:6.3, c:1,   f:6.3, serving:'28g (1oz)' },
  { id:'cream_cheese',    cat:'Dairy',   name:'Cream Cheese',          cal:99,  p:1.7, c:1.2, f:9.8, serving:'28g (2 tbsp)' },

  // Fats & Nuts
  { id:'avocado_half',    cat:'Fats',    name:'Avocado (Half)',        cal:120, p:1.5, c:6.4, f:11,  serving:'1 half' },
  { id:'almonds',         cat:'Fats',    name:'Almonds',               cal:164, p:6,   c:6.1, f:14,  serving:'28g (1oz)' },
  { id:'peanut_butter',   cat:'Fats',    name:'Peanut Butter',         cal:190, p:7,   c:7,   f:16,  serving:'2 tbsp' },
  { id:'almond_butter',   cat:'Fats',    name:'Almond Butter',         cal:196, p:6.7, c:6.1, f:18,  serving:'2 tbsp' },
  { id:'olive_oil',       cat:'Fats',    name:'Olive Oil',             cal:119, p:0,   c:0,   f:13.5,serving:'1 tbsp' },
  { id:'walnuts',         cat:'Fats',    name:'Walnuts',               cal:185, p:4.3, c:3.9, f:18,  serving:'28g (1oz)' },
  { id:'cashews',         cat:'Fats',    name:'Cashews',               cal:157, p:5.2, c:8.6, f:12,  serving:'28g (1oz)' },
  { id:'chia_seeds',      cat:'Fats',    name:'Chia Seeds',            cal:138, p:4.7, c:12,  f:8.7, serving:'28g (1oz)' },

  // Snacks & Bars
  { id:'granola_bar',     cat:'Snacks',  name:'Granola Bar',           cal:200, p:6,   c:22,  f:11,  serving:'1 bar' },
  { id:'hummus',          cat:'Snacks',  name:'Hummus',                cal:50,  p:2.4, c:4.9, f:2.7, serving:'2 tbsp' },
  { id:'dark_chocolate',  cat:'Snacks',  name:'Dark Chocolate (70%)',  cal:172, p:2.2, c:13,  f:12,  serving:'30g' },
  { id:'trail_mix',       cat:'Snacks',  name:'Trail Mix',             cal:130, p:3,   c:13,  f:8,   serving:'28g (1oz)' },
  { id:'popcorn',         cat:'Snacks',  name:'Popcorn (Air-Popped)', cal:31,  p:1,   c:6.2, f:0.4, serving:'1 cup' },
  { id:'rice_cakes_cf',   cat:'Snacks',  name:'Rice Cakes (Flavored)',cal:45,  p:1,   c:9,   f:0.5, serving:'1 cake' },

  // Prepared
  { id:'scrambled_2eggs', cat:'Prepared',name:'Scrambled Eggs (2)',   cal:200, p:14,  c:2,   f:15,  serving:'2 eggs' },
  { id:'pancake',         cat:'Prepared',name:'Pancake (Medium)',      cal:83,  p:2.4, c:15,  f:1.4, serving:'1 pancake' },
  { id:'oatmeal_ready',   cat:'Prepared',name:'Oatmeal (Prepared)',   cal:166, p:5.9, c:28,  f:3.6, serving:'1 cup' },
  { id:'pizza_slice',     cat:'Prepared',name:'Pizza (Cheese Slice)', cal:285, p:12,  c:36,  f:10,  serving:'1 slice' },
  { id:'burger_beef',     cat:'Prepared',name:'Beef Burger',          cal:295, p:17,  c:24,  f:14,  serving:'1 burger' },
  { id:'fries_medium',    cat:'Prepared',name:'French Fries (Medium)',cal:365, p:4,   c:48,  f:17,  serving:'1 medium' },
  { id:'protein_smoothie',cat:'Prepared',name:'Protein Smoothie',     cal:300, p:30,  c:30,  f:8,   serving:'1 serving' },
  { id:'beef_broccoli',   cat:'Prepared',name:'Beef & Broccoli',      cal:240, p:24,  c:14,  f:10,  serving:'1 cup' },

  // Drinks
  { id:'oj',              cat:'Drinks',  name:'Orange Juice',          cal:112, p:1.7, c:26,  f:0.5, serving:'1 cup (240ml)' },
  { id:'coffee_black',    cat:'Drinks',  name:'Coffee (Black)',        cal:2,   p:0.3, c:0,   f:0,   serving:'1 cup' },
  { id:'protein_rtd',     cat:'Drinks',  name:'Ready-to-Drink Protein',cal:160, p:30,  c:4,   f:4,   serving:'1 bottle' },
  { id:'whole_milk_cup',  cat:'Drinks',  name:'Whole Milk (1 cup)',    cal:149, p:8,   c:12,  f:8,   serving:'1 cup (240ml)' },

  // More Protein
  // Pork
  { id:'pork_tenderloin',  cat:'Protein', name:'Pork Tenderloin',        cal:143, p:26,  c:0,   f:3.5, serving:'100g' },
  { id:'pork_chop',        cat:'Protein', name:'Pork Chop (Lean, Bone-In)',cal:172,p:26, c:0,   f:7,   serving:'100g' },
  { id:'pork_chop_boneless',cat:'Protein',name:'Pork Chop (Boneless)',   cal:178, p:27,  c:0,   f:7.5, serving:'100g' },
  { id:'pork_loin',        cat:'Protein', name:'Pork Loin Roast',        cal:165, p:27,  c:0,   f:6,   serving:'100g' },
  { id:'bacon_strip',      cat:'Protein', name:'Bacon Strip (Pan-Fried)',cal:43,  p:3,   c:0.1, f:3.3, serving:'1 strip (8g cooked)' },
  { id:'bacon_turkey',     cat:'Protein', name:'Turkey Bacon (2 strips)',cal:70,  p:5,   c:0.3, f:5,   serving:'2 strips' },
  { id:'canadian_bacon',   cat:'Protein', name:'Canadian Bacon',         cal:53,  p:7.7, c:0.4, f:2,   serving:'1 slice (28g)' },
  { id:'ham_deli',         cat:'Protein', name:'Ham (Deli Sliced)',      cal:46,  p:5.3, c:1.3, f:1.8, serving:'2 slices (56g)' },
  { id:'pork_ribs',        cat:'Protein', name:'Pork Baby Back Ribs',    cal:292, p:21,  c:0,   f:23,  serving:'100g' },
  { id:'lamb_chop',        cat:'Protein', name:'Lamb Chop',              cal:259, p:25,  c:0,   f:17,  serving:'100g' },
  { id:'beef_mince_lean',  cat:'Protein', name:'Lean Ground Beef (96%)', cal:152, p:24,  c:0,   f:6,   serving:'100g' },
  { id:'bison_ground',     cat:'Protein', name:'Ground Bison',           cal:152, p:23,  c:0,   f:6,   serving:'100g' },
  { id:'cod_fillet',       cat:'Protein', name:'Cod Fillet',             cal:82,  p:18,  c:0,   f:0.7, serving:'100g' },
  { id:'halibut',          cat:'Protein', name:'Halibut',                cal:110, p:23,  c:0,   f:2.3, serving:'100g' },
  { id:'sardines_can',     cat:'Protein', name:'Sardines (Canned)',      cal:191, p:23,  c:0,   f:11,  serving:'100g' },
  { id:'scallops',         cat:'Protein', name:'Scallops',               cal:88,  p:17,  c:4.5, f:0.8, serving:'100g' },
  { id:'crab_meat',        cat:'Protein', name:'Crab Meat',              cal:97,  p:19,  c:0,   f:1.8, serving:'100g' },
  { id:'lobster',          cat:'Protein', name:'Lobster',                cal:89,  p:19,  c:0.5, f:0.9, serving:'100g' },
  { id:'tempeh',           cat:'Protein', name:'Tempeh',                 cal:195, p:20,  c:9,   f:11,  serving:'100g' },
  { id:'tofu_firm',        cat:'Protein', name:'Tofu (Firm)',            cal:76,  p:8,   c:2,   f:4.2, serving:'100g' },
  { id:'lentils_cooked',   cat:'Protein', name:'Lentils (Cooked)',       cal:116, p:9,   c:20,  f:0.4, serving:'100g' },
  { id:'black_beans',      cat:'Protein', name:'Black Beans (Cooked)',   cal:132, p:8.9, c:24,  f:0.5, serving:'100g' },
  { id:'chickpeas',        cat:'Protein', name:'Chickpeas (Cooked)',     cal:164, p:8.9, c:27,  f:2.6, serving:'100g' },
  { id:'kidney_beans',     cat:'Protein', name:'Kidney Beans (Cooked)',  cal:127, p:8.7, c:23,  f:0.5, serving:'100g' },
  { id:'casein_protein',   cat:'Protein', name:'Casein Protein (1 scoop)',cal:120,p:24,  c:4,   f:1,   serving:'30g scoop' },
  // Deli meats
  { id:'deli_turkey',      cat:'Protein', name:'Turkey Breast (Deli, 2oz)',cal:50, p:10,  c:1,   f:0.5, serving:'2oz (56g)' },
  { id:'deli_chicken',     cat:'Protein', name:'Chicken Breast (Deli, 2oz)',cal:60,p:11,  c:1,   f:1,   serving:'2oz (56g)' },
  { id:'deli_roast_beef',  cat:'Protein', name:'Roast Beef (Deli, 2oz)', cal:80,  p:12,  c:1,   f:2.5, serving:'2oz (56g)' },
  { id:'deli_salami',      cat:'Protein', name:'Salami (Deli, 1oz)',     cal:104, p:5.7, c:0.6, f:8.6, serving:'1oz (28g)' },
  { id:'deli_pepperoni',   cat:'Protein', name:'Pepperoni (15 slices)',  cal:130, p:5.5, c:1,   f:12,  serving:'15 slices (28g)' },
  { id:'deli_ham_slice',   cat:'Protein', name:'Ham (Deli, 2oz)',        cal:60,  p:9,   c:2,   f:2,   serving:'2oz (56g)' },
  { id:'prosciutto',       cat:'Protein', name:'Prosciutto (1oz)',       cal:55,  p:7,   c:0,   f:2.8, serving:'1oz (28g)' },
  // Beef jerky
  { id:'beef_jerky',       cat:'Protein', name:'Beef Jerky',             cal:116, p:10,  c:7,   f:5,   serving:'28g (1oz)' },
  { id:'turkey_jerky',     cat:'Protein', name:'Turkey Jerky',           cal:70,  p:13,  c:3,   f:1,   serving:'28g (1oz)' },
  { id:'rotisserie_chk',   cat:'Protein', name:'Rotisserie Chicken (light)',cal:153,p:29, c:0,   f:3.5, serving:'100g' },

  // More Carbs & Grains
  { id:'jasmine_rice',     cat:'Carbs',   name:'Jasmine Rice (Cooked)',  cal:130, p:2.7, c:28,  f:0.3, serving:'100g' },
  { id:'barley_cooked',    cat:'Carbs',   name:'Barley (Cooked)',        cal:123, p:2.3, c:28,  f:0.4, serving:'100g' },
  { id:'couscous',         cat:'Carbs',   name:'Couscous (Cooked)',      cal:112, p:3.8, c:23,  f:0.2, serving:'100g' },
  { id:'farro_cooked',     cat:'Carbs',   name:'Farro (Cooked)',         cal:170, p:6,   c:34,  f:1.4, serving:'100g' },
  { id:'pita_bread',       cat:'Carbs',   name:'Pita Bread (Whole Wheat)',cal:170,p:6,   c:35,  f:1.7, serving:'1 pita' },
  { id:'english_muffin',   cat:'Carbs',   name:'English Muffin (WW)',    cal:134, p:6,   c:26,  f:1.5, serving:'1 muffin' },
  { id:'corn_tortilla',    cat:'Carbs',   name:'Corn Tortilla',          cal:52,  p:1.4, c:11,  f:0.7, serving:'1 small' },
  { id:'waffle',           cat:'Carbs',   name:'Waffle (Plain)',         cal:218, p:5.9, c:25,  f:11,  serving:'1 waffle' },
  { id:'granola_cup',      cat:'Carbs',   name:'Granola',                cal:471, p:10,  c:64,  f:20,  serving:'100g' },
  { id:'bran_flakes',      cat:'Carbs',   name:'Bran Flakes (Cereal)',   cal:152, p:4.8, c:37,  f:0.8, serving:'40g' },
  { id:'cream_of_wheat',   cat:'Carbs',   name:'Cream of Wheat',        cal:126, p:3.6, c:27,  f:0.5, serving:'1 cup cooked' },
  { id:'lentil_pasta',     cat:'Carbs',   name:'Lentil Pasta (Cooked)', cal:130, p:9,   c:22,  f:1.5, serving:'100g' },
  { id:'protein_pasta',    cat:'Carbs',   name:'High-Protein Pasta',    cal:330, p:25,  c:46,  f:3,   serving:'100g dry' },
  { id:'yam',              cat:'Carbs',   name:'Yam (Baked)',            cal:118, p:1.5, c:28,  f:0.2, serving:'100g' },
  { id:'plantain',         cat:'Carbs',   name:'Plantain (Cooked)',      cal:147, p:0.8, c:38,  f:0.3, serving:'100g' },
  { id:'corn',             cat:'Carbs',   name:'Corn (Cooked)',          cal:96,  p:3.4, c:21,  f:1.5, serving:'100g' },
  { id:'soba_noodles',     cat:'Carbs',   name:'Soba Noodles (Cooked)', cal:99,  p:5,   c:21,  f:0.1, serving:'100g' },
  { id:'rice_noodles',     cat:'Carbs',   name:'Rice Noodles (Cooked)', cal:108, p:1.8, c:25,  f:0.2, serving:'100g' },
  { id:'pretzels',         cat:'Carbs',   name:'Pretzels',              cal:107, p:2.6, c:22,  f:0.8, serving:'28g (1oz)' },

  // More Fruits
  { id:'watermelon',       cat:'Fruit',   name:'Watermelon',            cal:30,  p:0.6, c:7.6, f:0.2, serving:'100g' },
  { id:'pineapple',        cat:'Fruit',   name:'Pineapple',             cal:50,  p:0.5, c:13,  f:0.1, serving:'100g' },
  { id:'peach',            cat:'Fruit',   name:'Peach (Medium)',        cal:59,  p:1.4, c:14,  f:0.4, serving:'1 medium' },
  { id:'pear',             cat:'Fruit',   name:'Pear (Medium)',         cal:101, p:0.7, c:27,  f:0.2, serving:'1 medium' },
  { id:'cherries',         cat:'Fruit',   name:'Cherries',              cal:63,  p:1.1, c:16,  f:0.2, serving:'100g' },
  { id:'raspberries',      cat:'Fruit',   name:'Raspberries',           cal:52,  p:1.2, c:12,  f:0.7, serving:'100g' },
  { id:'blackberries',     cat:'Fruit',   name:'Blackberries',          cal:43,  p:1.4, c:10,  f:0.5, serving:'100g' },
  { id:'kiwi',             cat:'Fruit',   name:'Kiwi (Medium)',         cal:46,  p:0.9, c:11,  f:0.4, serving:'1 medium' },
  { id:'papaya',           cat:'Fruit',   name:'Papaya',                cal:43,  p:0.5, c:11,  f:0.3, serving:'100g' },
  { id:'grapefruit',       cat:'Fruit',   name:'Grapefruit (Half)',     cal:52,  p:0.9, c:13,  f:0.2, serving:'1 half' },
  { id:'pomegranate',      cat:'Fruit',   name:'Pomegranate Seeds',     cal:83,  p:1.7, c:19,  f:1.2, serving:'100g' },
  { id:'dates',            cat:'Fruit',   name:'Dates (Medjool)',       cal:66,  p:0.4, c:18,  f:0.1, serving:'1 date' },
  { id:'dried_cranb',      cat:'Fruit',   name:'Dried Cranberries',     cal:123, p:0,   c:33,  f:0.4, serving:'40g' },

  // More Vegetables
  { id:'sweet_corn_cup',   cat:'Veggie',  name:'Sweet Corn (1 cup)',    cal:132, p:4.9, c:29,  f:1.8, serving:'1 cup' },
  { id:'cabbage',          cat:'Veggie',  name:'Cabbage',               cal:25,  p:1.3, c:5.8, f:0.1, serving:'100g' },
  { id:'brussels_sprouts', cat:'Veggie',  name:'Brussels Sprouts',      cal:43,  p:3.4, c:8.9, f:0.3, serving:'100g' },
  { id:'celery',           cat:'Veggie',  name:'Celery',                cal:16,  p:0.7, c:3,   f:0.2, serving:'100g' },
  { id:'onion',            cat:'Veggie',  name:'Onion',                 cal:40,  p:1.1, c:9.3, f:0.1, serving:'100g' },
  { id:'garlic',           cat:'Veggie',  name:'Garlic (1 clove)',      cal:4,   p:0.2, c:1,   f:0,   serving:'1 clove' },
  { id:'lettuce_romaine',  cat:'Veggie',  name:'Romaine Lettuce',       cal:17,  p:1.2, c:3.3, f:0.3, serving:'100g' },
  { id:'arugula',          cat:'Veggie',  name:'Arugula',               cal:25,  p:2.6, c:3.7, f:0.7, serving:'100g' },
  { id:'beet',             cat:'Veggie',  name:'Beets (Cooked)',        cal:44,  p:1.7, c:10,  f:0.2, serving:'100g' },
  { id:'edamame_cup',      cat:'Veggie',  name:'Edamame (1 cup)',       cal:189, p:17,  c:15,  f:8,   serving:'1 cup' },
  { id:'artichoke',        cat:'Veggie',  name:'Artichoke (Medium)',    cal:60,  p:4.2, c:13,  f:0.2, serving:'1 medium' },
  { id:'leek',             cat:'Veggie',  name:'Leek',                  cal:61,  p:1.5, c:14,  f:0.3, serving:'100g' },
  { id:'bok_choy',         cat:'Veggie',  name:'Bok Choy',              cal:13,  p:1.5, c:2.2, f:0.2, serving:'100g' },
  { id:'snap_peas',        cat:'Veggie',  name:'Snap Peas',             cal:42,  p:2.8, c:7.6, f:0.2, serving:'100g' },
  { id:'eggplant',         cat:'Veggie',  name:'Eggplant (Cooked)',     cal:35,  p:0.8, c:8.7, f:0.2, serving:'100g' },
  { id:'okra',             cat:'Veggie',  name:'Okra (Cooked)',         cal:33,  p:2,   c:7.5, f:0.2, serving:'100g' },
  { id:'peas',             cat:'Veggie',  name:'Green Peas (Cooked)',   cal:84,  p:5.4, c:15,  f:0.2, serving:'100g' },
  { id:'spaghetti_squash', cat:'Veggie',  name:'Spaghetti Squash',     cal:31,  p:0.6, c:6.9, f:0.6, serving:'100g' },

  // More Dairy
  { id:'greek_yogurt_ff',  cat:'Dairy',   name:'Greek Yogurt (Full Fat)',cal:97, p:9,   c:3.8, f:5,   serving:'100g' },
  { id:'lowfat_yogurt',    cat:'Dairy',   name:'Low-Fat Yogurt (Plain)',cal:63,  p:5.3, c:7,   f:1.5, serving:'100g' },
  { id:'ricotta',          cat:'Dairy',   name:'Ricotta (Part-Skim)',   cal:138, p:11,  c:5,   f:8,   serving:'100g (½ cup)' },
  { id:'goat_cheese',      cat:'Dairy',   name:'Goat Cheese',          cal:75,  p:5.2, c:0.1, f:6,   serving:'28g (1oz)' },
  { id:'parmesan',         cat:'Dairy',   name:'Parmesan (Grated)',     cal:111, p:10,  c:0.9, f:7.3, serving:'28g (1oz)' },
  { id:'feta',             cat:'Dairy',   name:'Feta Cheese',           cal:75,  p:4,   c:1.2, f:6,   serving:'28g (1oz)' },
  { id:'kefir',            cat:'Dairy',   name:'Kefir (Plain)',         cal:61,  p:3.3, c:7.8, f:1.7, serving:'100ml' },
  { id:'buttermilk',       cat:'Dairy',   name:'Buttermilk (1 cup)',    cal:98,  p:8,   c:12,  f:2.2, serving:'1 cup (240ml)' },
  { id:'heavy_cream',      cat:'Dairy',   name:'Heavy Cream (1 tbsp)',  cal:51,  p:0.3, c:0.4, f:5.4, serving:'1 tbsp' },

  // More Fats & Nuts
  { id:'macadamia',        cat:'Fats',    name:'Macadamia Nuts',        cal:204, p:2.2, c:3.9, f:21,  serving:'28g (1oz)' },
  { id:'pecans',           cat:'Fats',    name:'Pecans',                cal:196, p:2.6, c:4,   f:20,  serving:'28g (1oz)' },
  { id:'pistachios',       cat:'Fats',    name:'Pistachios',            cal:159, p:5.7, c:7.7, f:13,  serving:'28g (1oz)' },
  { id:'hazelnuts',        cat:'Fats',    name:'Hazelnuts',             cal:178, p:4.2, c:4.7, f:17,  serving:'28g (1oz)' },
  { id:'pumpkin_seeds',    cat:'Fats',    name:'Pumpkin Seeds',         cal:151, p:7,   c:5,   f:13,  serving:'28g (1oz)' },
  { id:'sunflower_seeds',  cat:'Fats',    name:'Sunflower Seeds',       cal:165, p:5.8, c:7,   f:14,  serving:'28g (1oz)' },
  { id:'flaxseeds',        cat:'Fats',    name:'Flaxseeds (Ground)',    cal:150, p:5.1, c:8.2, f:12,  serving:'28g (1oz)' },
  { id:'hemp_seeds',       cat:'Fats',    name:'Hemp Seeds (3 tbsp)',   cal:166, p:9.5, c:2.6, f:13,  serving:'3 tbsp (30g)' },
  { id:'coconut_oil',      cat:'Fats',    name:'Coconut Oil (1 tbsp)',  cal:121, p:0,   c:0,   f:13.5,serving:'1 tbsp' },
  { id:'butter',           cat:'Fats',    name:'Butter (1 tbsp)',       cal:102, p:0.1, c:0,   f:11.5,serving:'1 tbsp' },
  { id:'ghee',             cat:'Fats',    name:'Ghee (1 tbsp)',         cal:112, p:0,   c:0,   f:12.7,serving:'1 tbsp' },
  { id:'tahini',           cat:'Fats',    name:'Tahini (2 tbsp)',       cal:178, p:5.1, c:6.4, f:16,  serving:'2 tbsp' },

  // More Snacks
  { id:'mixed_nuts',       cat:'Snacks',  name:'Mixed Nuts',            cal:172, p:5,   c:6.1, f:15,  serving:'28g (1oz)' },
  { id:'string_cheese',    cat:'Snacks',  name:'String Cheese',         cal:80,  p:7,   c:0,   f:5,   serving:'1 stick' },
  { id:'hard_boiled_egg',  cat:'Snacks',  name:'Hard-Boiled Egg',       cal:78,  p:6.3, c:0.6, f:5.3, serving:'1 egg' },
  { id:'peanuts',          cat:'Snacks',  name:'Peanuts',               cal:166, p:7.3, c:4.6, f:14,  serving:'28g (1oz)' },
  { id:'edamame_snack',    cat:'Snacks',  name:'Edamame (Dry-Roasted)', cal:122, p:13,  c:9,   f:4,   serving:'28g (1oz)' },
  { id:'tuna_pouch',       cat:'Snacks',  name:'Tuna Pouch (3oz)',      cal:70,  p:16,  c:0,   f:0.5, serving:'1 pouch (85g)' },
  { id:'celery_pb',        cat:'Snacks',  name:'Celery + Peanut Butter',cal:104, p:4.1, c:6.7, f:8.1, serving:'2 stalks + 1 tbsp' },
  { id:'apple_pb',         cat:'Snacks',  name:'Apple + Peanut Butter', cal:285, p:7.5, c:32,  f:16,  serving:'1 medium + 2 tbsp' },
  { id:'larabar',          cat:'Snacks',  name:'Larabar (Date-Nut)',    cal:220, p:4,   c:28,  f:10,  serving:'1 bar' },
  { id:'milk_choc',        cat:'Snacks',  name:'Milk Chocolate',        cal:153, p:2.2, c:17,  f:8.5, serving:'28g (1oz)' },
  { id:'quest_bar',        cat:'Snacks',  name:'Quest Bar',             cal:190, p:21,  c:21,  f:7,   serving:'1 bar' },
  { id:'kind_bar',         cat:'Snacks',  name:'KIND Bar (Nut)',        cal:200, p:6,   c:15,  f:15,  serving:'1 bar' },

  // More Prepared / Meals
  { id:'chicken_salad',    cat:'Prepared',name:'Chicken Salad (1 cup)', cal:220, p:28,  c:4,   f:10,  serving:'1 cup' },
  { id:'caesar_salad',     cat:'Prepared',name:'Caesar Salad (small)',  cal:180, p:6,   c:14,  f:12,  serving:'1 small' },
  { id:'greek_salad',      cat:'Prepared',name:'Greek Salad',           cal:130, p:4,   c:9,   f:9,   serving:'1 cup' },
  { id:'burrito_bowl',     cat:'Prepared',name:'Burrito Bowl (chicken)',cal:490, p:35,  c:56,  f:12,  serving:'1 bowl' },
  { id:'sushi_roll',       cat:'Prepared',name:'Sushi Roll (California)',cal:255,p:9,   c:38,  f:7,   serving:'8 pieces' },
  { id:'pad_thai',         cat:'Prepared',name:'Pad Thai (chicken)',    cal:400, p:20,  c:52,  f:11,  serving:'1 serving' },
  { id:'stir_fry',         cat:'Prepared',name:'Chicken Stir Fry',     cal:310, p:28,  c:22,  f:12,  serving:'1 serving' },
  { id:'salmon_rice',      cat:'Prepared',name:'Salmon + Brown Rice',   cal:420, p:34,  c:36,  f:14,  serving:'1 plate' },
  { id:'turkey_wrap',      cat:'Prepared',name:'Turkey Wrap (WW)',      cal:350, p:26,  c:38,  f:10,  serving:'1 wrap' },
  { id:'tuna_salad_sand',  cat:'Prepared',name:'Tuna Salad Sandwich',  cal:380, p:30,  c:40,  f:11,  serving:'1 sandwich' },
  { id:'chicken_soup',     cat:'Prepared',name:'Chicken Noodle Soup',  cal:120, p:8,   c:15,  f:2,   serving:'1 cup' },
  { id:'chili_beef',       cat:'Prepared',name:'Beef Chili (1 cup)',    cal:290, p:24,  c:27,  f:9,   serving:'1 cup' },
  { id:'overnight_oats',   cat:'Prepared',name:'Overnight Oats',        cal:335, p:14,  c:55,  f:7,   serving:'1 jar (350g)' },
  { id:'avocado_toast',    cat:'Prepared',name:'Avocado Toast (WW)',    cal:290, p:9,   c:31,  f:15,  serving:'2 slices' },
  { id:'egg_muffin',       cat:'Prepared',name:'Egg McMuffin Style',    cal:300, p:17,  c:30,  f:12,  serving:'1 sandwich' },
  { id:'acai_bowl',        cat:'Prepared',name:'Acai Bowl',             cal:390, p:6,   c:70,  f:9,   serving:'1 bowl' },
  { id:'shakeology',       cat:'Prepared',name:'Meal Replacement Shake',cal:160, p:17,  c:17,  f:4,   serving:'1 serving' },
  { id:'mass_gainer',      cat:'Prepared',name:'Mass Gainer Shake',     cal:700, p:50,  c:100, f:8,   serving:'1 serving' },

  // More Drinks
  { id:'almond_milk',      cat:'Drinks',  name:'Almond Milk (Unsweetened)',cal:13,p:0.5, c:1,   f:1,   serving:'100ml' },
  { id:'oat_milk',         cat:'Drinks',  name:'Oat Milk (Barista)',    cal:60,  p:1,   c:9,   f:1.5, serving:'100ml' },
  { id:'soy_milk',         cat:'Drinks',  name:'Soy Milk',              cal:33,  p:2.9, c:1.3, f:1.8, serving:'100ml' },
  { id:'coconut_milk_bev', cat:'Drinks',  name:'Coconut Milk Beverage', cal:45,  p:0.5, c:7,   f:2,   serving:'240ml' },
  { id:'sports_drink',     cat:'Drinks',  name:'Sports Drink (Gatorade)',cal:80, p:0,   c:21,  f:0,   serving:'500ml' },
  { id:'green_smoothie',   cat:'Drinks',  name:'Green Smoothie (16oz)', cal:220, p:4,   c:46,  f:2,   serving:'16oz' },
  { id:'bone_broth',       cat:'Drinks',  name:'Bone Broth (1 cup)',    cal:38,  p:8,   c:0,   f:1,   serving:'1 cup (240ml)' },
  { id:'coconut_water',    cat:'Drinks',  name:'Coconut Water (1 cup)', cal:46,  p:1.7, c:9,   f:0.5, serving:'1 cup (240ml)' },
  { id:'espresso',         cat:'Drinks',  name:'Espresso (double shot)',cal:6,   p:0.4, c:0.8, f:0.2, serving:'2 shots (60ml)' },
  { id:'latte_milk',       cat:'Drinks',  name:'Latte (whole milk)',    cal:190, p:10,  c:15,  f:9,   serving:'12oz' },
  { id:'latte_oat',        cat:'Drinks',  name:'Oat Milk Latte',        cal:160, p:5,   c:23,  f:5,   serving:'12oz' },
  { id:'protein_coffee',   cat:'Drinks',  name:'Protein Iced Coffee',   cal:130, p:15,  c:9,   f:3,   serving:'12oz' },
  { id:'apple_juice',      cat:'Drinks',  name:'Apple Juice (1 cup)',   cal:114, p:0.2, c:28,  f:0.3, serving:'1 cup (240ml)' },
  { id:'chocolate_milk',   cat:'Drinks',  name:'Chocolate Milk (1 cup)',cal:208, p:8,   c:26,  f:8,   serving:'1 cup (240ml)' },
  { id:'green_tea',        cat:'Drinks',  name:'Green Tea (unsweetened)',cal:2,  p:0,   c:0,   f:0,   serving:'1 cup' },
];

/* ── STORAGE HELPERS ─────────────────────────────────────────── */
function getNutrDiary(cid, date) {
  return getLS('nutr_diary_' + cid + '_' + date, { breakfast: [], lunch: [], dinner: [], snacks: [] });
}
function saveNutrDiary(cid, date, diary) {
  localStorage.setItem('nutr_diary_' + cid + '_' + date, JSON.stringify(diary));
  // Keep cal_intake_* in sync so existing history charts stay accurate
  const t = calcDiaryTotals(diary);
  if (t.cal > 0 || t.p > 0) {
    const logs = getCalorieIntakeLogs(cid);
    const idx  = logs.findIndex(l => l.date === date);
    const entry = { date, calories: Math.round(t.cal), protein: Math.round(t.p), carbs: Math.round(t.c), fat: Math.round(t.f) };
    if (idx >= 0) logs[idx] = entry; else logs.push(entry);
    localStorage.setItem('cal_intake_' + cid, JSON.stringify(logs));
  }
}
function calcDiaryTotals(diary) {
  let cal = 0, p = 0, c = 0, f = 0;
  ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(meal => {
    (diary[meal] || []).forEach(item => {
      cal += (item.cal || 0) * (item.qty || 1);
      p   += (item.p   || 0) * (item.qty || 1);
      c   += (item.c   || 0) * (item.qty || 1);
      f   += (item.f   || 0) * (item.qty || 1);
    });
  });
  return { cal: Math.round(cal), p: Math.round(p * 10) / 10, c: Math.round(c * 10) / 10, f: Math.round(f * 10) / 10 };
}

function getWaterLog(cid)       { return getLS('water_log_' + cid, []); }
function saveWaterLog(cid, log) { localStorage.setItem('water_log_' + cid, JSON.stringify(log)); }
function getWaterForDate(cid, date) {
  return (getWaterLog(cid).find(e => e.date === date) || {}).glasses || 0;
}
function setWaterForDate(cid, date, glasses) {
  const log = getWaterLog(cid);
  const idx = log.findIndex(e => e.date === date);
  if (idx >= 0) log[idx].glasses = glasses; else log.push({ date, glasses });
  saveWaterLog(cid, log);
}

function getCustomFoods(cid)          { return getLS('custom_foods_' + cid, []); }
function saveCustomFoods(cid, foods)  { localStorage.setItem('custom_foods_' + cid, JSON.stringify(foods)); }

/* ── RECENT / FREQUENT FOODS ─────────────────────────────────── */
function getRecents(cid) { return getLS('nutr_recent_' + cid, []); }
function addToRecents(cid, food) {
  if (!food || !food.name) return;
  const list = getRecents(cid);
  const key = (food.id != null ? String(food.id) : '') + '|' + food.name;
  const existing = list.find(r => r._key === key);
  if (existing) {
    existing.count    = (existing.count || 1) + 1;
    existing.lastUsed = Date.now();
  } else {
    list.push({
      _key: key,
      id:   food.id != null ? food.id : ('r_' + Date.now()),
      name: food.name,
      brand: food.brand || '',
      cal:  +food.cal || 0,
      p:    +food.p   || 0,
      c:    +food.c   || 0,
      f:    +food.f   || 0,
      serving: food.serving || '1 serving',
      count: 1,
      lastUsed: Date.now(),
    });
  }
  list.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
  if (list.length > 50) list.length = 50;
  localStorage.setItem('nutr_recent_' + cid, JSON.stringify(list));
}
function getFrequents(cid, n) {
  const list = getRecents(cid).slice();
  list.sort((a, b) => (b.count || 0) - (a.count || 0) || (b.lastUsed || 0) - (a.lastUsed || 0));
  return list.slice(0, n || 3);
}

/* ── LOG STREAK (consecutive days with food logged) ──────────── */
function calcLogStreak(cid) {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const diary = safeJSON(localStorage.getItem('nutr_diary_' + cid + '_' + key), null);
    const cnt = diary ? Object.values(diary).reduce((s, a) => s + (Array.isArray(a) ? a.length : 0), 0) : 0;
    if (cnt > 0) streak++;
    else if (i === 0) continue; // allow today to be empty, check yesterday
    else break;
  }
  return streak;
}

/* ── MACRO RING SVG ──────────────────────────────────────────── */
function _nutrRing(val, target, label, unit, color) {
  const R    = 36;
  const circ = +(2 * Math.PI * R).toFixed(2);
  const pct  = target > 0 ? Math.min(1, val / target) : 0;
  const off  = +(circ * (1 - pct)).toFixed(2);
  const disp = val >= 1000 ? (val / 1000).toFixed(1) + 'k' : String(Math.round(val));
  const pctLbl = target > 0 ? Math.round(pct * 100) + '%' : '—';
  return `<div class="nutr-ring-cell">
    <svg width="84" height="84" viewBox="0 0 84 84">
      <circle cx="42" cy="42" r="${R}" fill="none" stroke="var(--surface2)" stroke-width="7"/>
      <circle cx="42" cy="42" r="${R}" fill="none" stroke="${color}" stroke-width="7"
        stroke-dasharray="${circ}" stroke-dashoffset="${off}"
        stroke-linecap="round" transform="rotate(-90 42 42)"/>
      <text x="42" y="40" text-anchor="middle" dominant-baseline="middle"
        font-family="'Bebas Neue',sans-serif" font-size="16" fill="${color}">${esc(disp)}</text>
      <text x="42" y="55" text-anchor="middle" dominant-baseline="middle"
        font-family="'DM Mono',monospace" font-size="7" fill="var(--muted)">${esc(unit)}</text>
    </svg>
    <div class="nutr-ring-label">${esc(label)}</div>
    <div class="nutr-ring-pct" style="color:${color}">${esc(pctLbl)}</div>
  </div>`;
}

/* ── WATER SECTION ───────────────────────────────────────────── */
function _nutrWaterSection(cid, date, glasses, accent) {
  const GOAL = 8;
  const dots = Array.from({ length: GOAL }, (_, i) => {
    const filled = i < glasses;
    return `<button class="water-dot${filled ? ' water-dot-filled' : ''}"
      style="${filled ? 'background:' + accent + ';border-color:' + accent : ''}"
      onclick="nutrSetWater('${esc(cid)}','${esc(date)}',${filled ? i : i + 1})"
      title="${i + 1} glass${i > 0 ? 'es' : ''}"></button>`;
  }).join('');
  return `<div class="nutr-water-section">
    <div class="nutr-water-header">
      <span class="nutr-water-title">Water Intake</span>
      <span class="nutr-water-count" style="color:${accent}">${glasses} / ${GOAL} glasses</span>
    </div>
    <div class="nutr-water-dots">${dots}</div>
    ${glasses >= GOAL ? `<div style="font-family:'DM Mono',monospace;font-size:9px;color:#2ecc71;letter-spacing:1px;margin-top:6px">Daily goal reached</div>` : ''}
  </div>`;
}

/* ── MEAL SECTION ────────────────────────────────────────────── */
const _MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍎' };

function _nutrMealSection(cid, meal, label, items, accent, date) {
  const mealCal = items.reduce((s, i) => s + (i.cal || 0) * (i.qty || 1), 0);
  const mealP   = items.reduce((s, i) => s + (i.p   || 0) * (i.qty || 1), 0);

  let foodRows = items.length === 0
    ? `<div class="nutr-empty-meal">No foods logged yet</div>`
    : items.map((item, idx) => {
        const iCal = Math.round((item.cal || 0) * (item.qty || 1));
        const iP   = Math.round((item.p   || 0) * (item.qty || 1) * 10) / 10;
        const qtyStr = item.qty && item.qty !== 1 ? item.qty + '× ' : '';
        return `<div class="nutr-food-row">
          <div class="nutr-food-info">
            <div class="nutr-food-name">${esc(item.name)}</div>
            <div class="nutr-food-meta">${esc(qtyStr + (item.serving || ''))} · ${iCal} kcal · ${iP}g P</div>
          </div>
          <button class="nutr-food-remove" onclick="removeNutrFood('${esc(cid)}','${esc(meal)}','${esc(date)}',${idx})" title="Remove">×</button>
        </div>`;
      }).join('');

  const totalsHtml = mealCal > 0
    ? `<span style="color:${accent}">${Math.round(mealCal)} kcal</span>${mealP > 0 ? ` · <span style="color:#ff9f7a">${Math.round(mealP)}g P</span>` : ''}`
    : `<span style="color:var(--faint)">—</span>`;

  const freq = getFrequents(cid, 3);
  const freqChips = freq.length
    ? `<div class="nutr-freq-chips">${freq.map((r, i) =>
        `<button class="nutr-freq-chip" onclick="quickLogRecent('${esc(cid)}','${esc(meal)}','${esc(date)}',${i})" title="${esc(r.cal)} kcal">${esc(r.name.length > 18 ? r.name.slice(0, 17) + '…' : r.name)}</button>`
      ).join('')}</div>`
    : '';

  return `<div class="nutr-meal-section" id="nutr-meal-${meal}">
    <div class="nutr-meal-header">
      <div class="nutr-meal-title">
        <span class="nutr-meal-icon">${_MEAL_ICONS[meal] || '🍽'}</span>
        <span>${esc(label)}</span>
      </div>
      <div class="nutr-meal-totals" style="font-family:'DM Mono',monospace;font-size:10px">${totalsHtml}</div>
    </div>
    <div class="nutr-meal-foods">${foodRows}</div>
    ${freqChips}
    <div class="nutr-meal-actions">
      <button class="nutr-add-food-btn" onclick="openNutrSearch('${esc(cid)}','${esc(meal)}','${esc(date)}')">+ Add Food</button>
      <button class="nutr-meal-mini-btn" onclick="openQuickAddKcal('${esc(cid)}','${esc(meal)}','${esc(date)}')" title="Quick-add calories">Quick +</button>
      <button class="nutr-meal-mini-btn" onclick="copyMealFromYesterday('${esc(cid)}','${esc(meal)}','${esc(date)}')" title="Copy yesterday's ${esc(label)}">Copy yday</button>
    </div>
  </div>`;
}

/* ── 7-DAY HISTORY ───────────────────────────────────────────── */
function _nutrHistory(cid, calTarget, accent) {
  const logs  = getCalorieIntakeLogs(cid);
  const today = new Date().toISOString().slice(0, 10);
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key   = d.toISOString().slice(0, 10);
    const entry = logs.find(l => l.date === key);
    last7.push({ key, label: d.toLocaleDateString('en', { weekday: 'short' }), cal: entry?.calories || 0 });
  }
  const maxCal = Math.max(...last7.map(d => d.cal), calTarget || 1);
  const daysHit = last7.filter(d => d.cal > 0 && calTarget > 0 && d.cal >= calTarget * 0.9).length;

  const bars = last7.map(d => {
    const pct      = Math.min(100, Math.round((d.cal / maxCal) * 100));
    const isToday  = d.key === today;
    const hit      = calTarget > 0 && d.cal >= calTarget * 0.9;
    const barColor = d.cal === 0 ? 'var(--border)' : hit ? '#2ecc71' : accent;
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;cursor:pointer" onclick="setNutrDate('${esc(cid)}','${esc(d.key)}')">
      <div style="font-family:'DM Mono',monospace;font-size:7px;color:var(--muted)">${d.cal > 0 ? (d.cal >= 1000 ? (d.cal / 1000).toFixed(1) + 'k' : d.cal) : ''}</div>
      <div style="width:100%;background:var(--surface2);border-radius:3px;height:40px;display:flex;align-items:flex-end;overflow:hidden">
        <div style="width:100%;height:${pct}%;background:${barColor};border-radius:3px 3px 0 0;transition:height .3s"></div>
      </div>
      <div style="font-family:'DM Mono',monospace;font-size:7px;color:${isToday ? accent : 'var(--muted)'};font-weight:${isToday ? '700' : '400'}">${esc(d.label)}</div>
    </div>`;
  }).join('');

  return `<div class="card" style="margin-bottom:12px">
    <div class="card-block">
      <div class="block-label" style="margin-bottom:10px">7-Day History${daysHit > 0 ? ` · <span style="color:#2ecc71;text-transform:none">${daysHit}/7 on target</span>` : ''}</div>
      <div style="display:flex;gap:5px;align-items:flex-end">${bars}</div>
      ${calTarget ? `<div style="display:flex;align-items:center;gap:6px;margin-top:10px"><div style="width:10px;height:3px;background:#2ecc71;border-radius:2px"></div><div style="font-family:'DM Mono',monospace;font-size:8px;color:var(--muted)">≥90% of ${calTarget} kcal</div></div>` : ''}
    </div>
  </div>`;
}

/* ── MAIN RENDER ─────────────────────────────────────────────── */
function renderNutritionTracker(c) {
  if (!AppState.nutrDate) AppState.nutrDate = new Date().toISOString().slice(0, 10);

  const date   = AppState.nutrDate;
  const today  = new Date().toISOString().slice(0, 10);
  const diary  = getNutrDiary(c.id, date);
  const totals = calcDiaryTotals(diary);
  const n      = c.data && c.data.nutrition;
  const accent = c.accent || 'var(--accent)';

  // Extract macro targets from client data
  const _mv = (label) => {
    if (!n || !n.macros) return 0;
    const m = n.macros.find(m => new RegExp(label, 'i').test(m.label));
    return parseInt(m?.val) || 0;
  };
  const targets = {
    cal: _mv('calorie|kcal') || 2000,
    p:   _mv('protein')      || 150,
    c:   _mv('carb')         || 200,
    f:   _mv('fat')          || 65,
  };

  // Date navigation
  const isToday  = date === today;
  const dateLabel = isToday
    ? 'Today'
    : new Date(date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
  const prevStr = (() => { const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();
  const nextStr = (() => { const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); })();

  let html = `<div class="panel-title">Nutrition Tracker</div>`;

  // Date nav bar
  html += `<div class="nutr-date-nav">
    <button class="nutr-date-btn" onclick="setNutrDate('${esc(c.id)}','${prevStr}')">←</button>
    <div class="nutr-date-label">${esc(dateLabel)}</div>
    ${!isToday
      ? `<button class="nutr-date-btn" onclick="setNutrDate('${esc(c.id)}','${nextStr}')">→</button>`
      : `<div class="nutr-date-btn" style="opacity:0;pointer-events:none">→</div>`}
  </div>`;

  // Macro rings
  html += `<div class="nutr-rings-grid">
    ${_nutrRing(totals.cal, targets.cal, 'Calories', 'kcal', accent)}
    ${_nutrRing(totals.p,   targets.p,   'Protein',  'g',   '#ff9f7a')}
    ${_nutrRing(totals.c,   targets.c,   'Carbs',    'g',   '#e8ff47')}
    ${_nutrRing(totals.f,   targets.f,   'Fat',      'g',   '#7adfff')}
  </div>`;

  // Remaining summary strip
  const remCal    = Math.max(0, targets.cal - totals.cal);
  const calOver   = totals.cal > targets.cal * 1.05;
  const calHit    = !calOver && totals.cal >= targets.cal * 0.9;
  const statColor = calOver ? '#e74c3c' : calHit ? '#2ecc71' : 'var(--muted)';
  const statText  = calOver
    ? `${totals.cal - targets.cal} kcal over`
    : calHit
      ? 'Target hit'
      : `${remCal} kcal left`;

  const streak = calcLogStreak(c.id);
  const streakHtml = streak > 0
    ? `<div class="nutr-sum-sep"></div><div class="nutr-sum-item"><div class="nutr-sum-val" style="color:#f1c40f">${streak}d</div><div class="nutr-sum-lbl">streak</div></div>`
    : '';

  html += `<div class="nutr-summary-strip">
    <div class="nutr-sum-item"><div class="nutr-sum-val" style="color:${accent}">${totals.cal}</div><div class="nutr-sum-lbl">eaten</div></div>
    <div class="nutr-sum-sep"></div>
    <div class="nutr-sum-item"><div class="nutr-sum-val" style="color:${statColor}">${esc(statText)}</div></div>
    <div class="nutr-sum-sep"></div>
    <div class="nutr-sum-item"><div class="nutr-sum-val" style="color:var(--muted)">${targets.cal}</div><div class="nutr-sum-lbl">target</div></div>
    ${streakHtml}
  </div>`;

  // Water tracker
  const glasses = getWaterForDate(c.id, date);
  html += _nutrWaterSection(c.id, date, glasses, accent);

  // Meal sections
  [
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch',     label: 'Lunch'     },
    { key: 'dinner',    label: 'Dinner'    },
    { key: 'snacks',    label: 'Snacks'    },
  ].forEach(m => {
    html += _nutrMealSection(c.id, m.key, m.label, diary[m.key] || [], accent, date);
  });

  // 7-day history
  html += _nutrHistory(c.id, targets.cal, accent);

  // Targets reference card
  html += `<div class="nutr-targets-bar">
    <div class="nutr-targets-row">
      <span style="color:var(--muted);font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;text-transform:uppercase">Daily Targets</span>
    </div>
    <div class="nutr-targets-vals">
      <span style="color:${accent}">${targets.cal} kcal</span>
      <span style="color:#ff9f7a">${targets.p}g protein</span>
      <span style="color:#e8ff47">${targets.c}g carbs</span>
      <span style="color:#7adfff">${targets.f}g fat</span>
    </div>
    ${n && n.macros && n.macros.length ? (() => {
      const txt = n.macros.map(m => `${m.label}: ${m.val}${m.unit}`).join(' · ');
      return `<button class="macro-copy-btn" style="margin-top:10px" onclick="navigator.clipboard?.writeText(${JSON.stringify(txt)}).then(()=>showFitToast('Macros copied!')).catch(()=>showFitToast(${JSON.stringify(txt)}))">Copy Targets for MyFitnessPal</button>`;
    })() : ''}
  </div>`;

  // Meal timing + supplement tips from nutrition blueprint
  if (n && n.tips && n.tips.length) {
    html += `<div class="card" style="margin-top:12px">
      <div class="card-block"><div class="block-label">Meal Timing</div><ul class="tip-list">${n.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
      ${n.supplements && n.supplements.length ? `<div class="card-block"><div class="block-label">Supplements</div><ul class="tip-list">${n.supplements.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>` : ''}
    </div>`;
  }

  return html;
}

/* ── DATE NAVIGATION ─────────────────────────────────────────── */
function setNutrDate(cid, date) {
  AppState.nutrDate = date;
  const c = (getAllClients().find(cl => cl.id === cid)) || AppState.currentClient;
  if (!c) return;
  const panel = document.getElementById('panel-nutrition');
  if (panel) panel.innerHTML = renderNutritionTracker(c);
}

/* ── WATER ───────────────────────────────────────────────────── */
function nutrSetWater(cid, date, glasses) {
  setWaterForDate(cid, date, Math.min(glasses, 8));
  haptic('light');
  const c = (getAllClients().find(cl => cl.id === cid)) || AppState.currentClient;
  if (!c) return;
  const panel = document.getElementById('panel-nutrition');
  if (panel) panel.innerHTML = renderNutritionTracker(c);
}

/* ── REMOVE FOOD FROM DIARY ──────────────────────────────────── */
function removeNutrFood(cid, meal, date, idx) {
  const diary = getNutrDiary(cid, date);
  if (!diary[meal]) return;
  diary[meal].splice(idx, 1);
  saveNutrDiary(cid, date, diary);
  haptic('light');
  const c = (getAllClients().find(cl => cl.id === cid)) || AppState.currentClient;
  if (!c) return;
  const panel = document.getElementById('panel-nutrition');
  if (panel) panel.innerHTML = renderNutritionTracker(c);
}

/* ── FOOD SEARCH MODAL ───────────────────────────────────────── */
function openNutrSearch(cid, meal, date) {
  AppState._nutrSearchCid  = cid;
  AppState._nutrSearchMeal = meal;
  AppState._nutrSearchDate = date;
  AppState._nutrCatFilter  = '';
  // Default to Recent if the client has any; else Library
  AppState._nutrSearchMode = getRecents(cid).length ? 'recent' : 'local'; // 'recent' | 'local' | 'online'

  document.getElementById('nutrSearchModal')?.remove();

  const modal = document.createElement('div');
  modal.id        = 'nutrSearchModal';
  modal.className = 'nutr-search-overlay';
  modal.innerHTML = `
    <div class="nutr-search-sheet">
      <div class="nutr-search-top">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px">Add Food</div>
          <button class="nutr-barcode-btn" onclick="openNutrBarcodeScanner()" title="Scan barcode">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14"/>
            </svg>
            <span>Scan</span>
          </button>
        </div>
        <div class="nutr-search-tabs">
          <button class="nutr-tab-btn active" id="nutrTabRecent" onclick="nutrSwitchMode('recent')">Recent</button>
          <button class="nutr-tab-btn" id="nutrTabLocal" onclick="nutrSwitchMode('local')">Library</button>
          <button class="nutr-tab-btn" id="nutrTabOnline" onclick="nutrSwitchMode('online')">Online</button>
        </div>
        <input class="nutr-search-input" id="nutrSearchInput" type="search"
          placeholder="Search foods..." autocomplete="off" autocorrect="off"
          oninput="nutrSearchInputChange(this.value)">
        <div class="nutr-search-cats" id="nutrSearchCats">
          <button class="nutr-cat-btn active" onclick="nutrFilterCat(this,'')">All</button>
          <button class="nutr-cat-btn" onclick="nutrFilterCat(this,'Protein')">Protein</button>
          <button class="nutr-cat-btn" onclick="nutrFilterCat(this,'Carbs')">Carbs</button>
          <button class="nutr-cat-btn" onclick="nutrFilterCat(this,'Fruit')">Fruit</button>
          <button class="nutr-cat-btn" onclick="nutrFilterCat(this,'Veggie')">Veggies</button>
          <button class="nutr-cat-btn" onclick="nutrFilterCat(this,'Dairy')">Dairy</button>
          <button class="nutr-cat-btn" onclick="nutrFilterCat(this,'Fats')">Fats</button>
          <button class="nutr-cat-btn" onclick="nutrFilterCat(this,'Snacks')">Snacks</button>
          <button class="nutr-cat-btn" onclick="nutrFilterCat(this,'Prepared')">Meals</button>
          <button class="nutr-cat-btn" onclick="nutrFilterCat(this,'Drinks')">Drinks</button>
        </div>
      </div>
      <div class="nutr-search-results" id="nutrSearchResults"></div>
      <div class="nutr-search-footer">
        <button class="nutr-custom-btn" onclick="openNutrCustomFood()">+ Custom Food</button>
        <button class="nutr-close-btn" onclick="closeNutrSearch()">Done</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) closeNutrSearch(); });

  // Reflect starting tab (recent is default when history exists)
  nutrSwitchMode(AppState._nutrSearchMode || 'local');
  setTimeout(() => document.getElementById('nutrSearchInput')?.focus(), 80);
}

/* ── SEARCH MODE SWITCH (recent / local / online) ────────────── */
function nutrSwitchMode(mode) {
  AppState._nutrSearchMode = mode;
  document.getElementById('nutrTabRecent')?.classList.toggle('active', mode === 'recent');
  document.getElementById('nutrTabLocal') ?.classList.toggle('active', mode === 'local');
  document.getElementById('nutrTabOnline')?.classList.toggle('active', mode === 'online');
  const cats   = document.getElementById('nutrSearchCats');
  const input  = document.getElementById('nutrSearchInput');
  if (cats) cats.style.display = mode === 'local' ? '' : 'none';
  if (input) input.placeholder =
    mode === 'recent' ? 'Filter recent foods...' :
    mode === 'local'  ? 'Search foods...' :
                        'Search Open Food Facts (e.g. "greek yogurt")';
  if (mode === 'recent') nutrRenderRecents(input?.value || '');
  else nutrSearchUpdate(input?.value || '');
}

function nutrSearchInputChange(q) {
  const mode = AppState._nutrSearchMode;
  if (mode === 'online') {
    clearTimeout(AppState._nutrOnlineTimer);
    AppState._nutrOnlineTimer = setTimeout(() => nutrOnlineSearch(q), 350);
    const el = document.getElementById('nutrSearchResults');
    if (el && q.length >= 2) el.innerHTML = `<div class="nutr-no-results">Searching Open Food Facts...</div>`;
    else if (el) el.innerHTML = `<div class="nutr-no-results">Type at least 2 characters to search</div>`;
  } else if (mode === 'recent') {
    nutrRenderRecents(q);
  } else {
    nutrSearchUpdate(q);
  }
}

function nutrRenderRecents(q) {
  const cid = AppState._nutrSearchCid;
  const el  = document.getElementById('nutrSearchResults');
  if (!el) return;
  const list = getRecents(cid);
  if (!list.length) {
    el.innerHTML = `<div class="nutr-no-results">No recent foods yet. Log a food and it'll show up here for one-tap re-logging.</div>`;
    return;
  }
  const ql = (q || '').toLowerCase();
  const filtered = ql ? list.filter(r => r.name.toLowerCase().includes(ql)) : list;
  if (!filtered.length) {
    el.innerHTML = `<div class="nutr-no-results">No matching recent foods</div>`;
    return;
  }
  window._nutrRecentCache = filtered;
  el.innerHTML = filtered.slice(0, 50).map((r, i) => `
    <div class="nutr-result-row" onclick="openNutrAddQtyRecent(${i})">
      <div class="nutr-result-info">
        <div class="nutr-result-name">${esc(r.name)}${r.brand ? ` <span class="nutr-result-brand">${esc(r.brand)}</span>` : ''}</div>
        <div class="nutr-result-meta">${esc(r.serving)} · ${r.cal} kcal · ${r.p}g P · ${r.c}g C · ${r.f}g F · <span style="color:var(--accent)">×${r.count || 1}</span></div>
      </div>
      <div class="nutr-result-add">+</div>
    </div>`).join('');
}

function openNutrAddQtyRecent(idx) {
  const r = (window._nutrRecentCache || [])[idx];
  if (!r) return;
  const fid = 'rec_' + idx;
  window._nutrOffMap = window._nutrOffMap || {};
  // Reuse off_ path so confirmNutrAddFood finds the food in the map
  const food = { id: r.id, name: r.name, brand: r.brand, cal: r.cal, p: r.p, c: r.c, f: r.f, serving: r.serving };
  window._nutrOffMap['off_' + fid] = food;
  _openQtyModalForFood(food, 'off_' + fid);
}

function quickLogRecent(cid, meal, date, freqIdx) {
  const r = getFrequents(cid, 3)[freqIdx];
  if (!r) return;
  const diary = getNutrDiary(cid, date);
  if (!diary[meal]) diary[meal] = [];
  diary[meal].push({ id: r.id, name: r.name, cal: r.cal, p: r.p, c: r.c, f: r.f, qty: 1, serving: r.serving });
  saveNutrDiary(cid, date, diary);
  addToRecents(cid, r);
  sbAutoSync(cid);
  haptic('success');
  showFitToast(r.name + ' added');
  const c = (getAllClients().find(cl => cl.id === cid)) || AppState.currentClient;
  if (!c) return;
  const panel = document.getElementById('panel-nutrition');
  if (panel) panel.innerHTML = renderNutritionTracker(c);
}

/* ── COPY MEAL FROM YESTERDAY ────────────────────────────────── */
function copyMealFromYesterday(cid, meal, date) {
  const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() - 1);
  const yKey = d.toISOString().slice(0, 10);
  const yDiary = safeJSON(localStorage.getItem('nutr_diary_' + cid + '_' + yKey), null);
  const items = yDiary && Array.isArray(yDiary[meal]) ? yDiary[meal] : [];
  if (!items.length) { showFitToast('Nothing logged for that meal yesterday'); return; }
  const diary = getNutrDiary(cid, date);
  if (!diary[meal]) diary[meal] = [];
  items.forEach(it => diary[meal].push({ id: it.id, name: it.name, cal: it.cal, p: it.p, c: it.c, f: it.f, qty: it.qty || 1, serving: it.serving }));
  saveNutrDiary(cid, date, diary);
  sbAutoSync(cid);
  haptic('success');
  showFitToast(`Copied ${items.length} item${items.length === 1 ? '' : 's'}`);
  const c = (getAllClients().find(cl => cl.id === cid)) || AppState.currentClient;
  if (!c) return;
  const panel = document.getElementById('panel-nutrition');
  if (panel) panel.innerHTML = renderNutritionTracker(c);
}

/* ── QUICK-ADD KCAL (no food name, just numbers) ─────────────── */
function openQuickAddKcal(cid, meal, date) {
  AppState._nutrSearchCid  = cid;
  AppState._nutrSearchMeal = meal;
  AppState._nutrSearchDate = date;
  document.getElementById('nutrQuickAddModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'nutrQuickAddModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:4200;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  modal.innerHTML = `<div style="background:var(--surface);border-radius:14px;padding:24px 20px;width:100%;max-width:340px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px;margin-bottom:4px">Quick Add</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:16px">Log calories without a food name. Macros optional.</div>
    <div class="ob-field" style="margin-bottom:10px">
      <label class="ob-label">Calories</label>
      <input class="ob-input" id="qa-cal" type="number" inputmode="numeric" placeholder="0" autofocus>
    </div>
    <div class="ob-input-row" style="margin-bottom:10px">
      <div class="ob-field"><label class="ob-label">Protein (g)</label><input class="ob-input" id="qa-p" type="number" inputmode="decimal" placeholder="0"></div>
      <div class="ob-field"><label class="ob-label">Carbs (g)</label><input class="ob-input" id="qa-c" type="number" inputmode="decimal" placeholder="0"></div>
    </div>
    <div class="ob-field" style="margin-bottom:18px">
      <label class="ob-label">Fat (g)</label>
      <input class="ob-input" id="qa-f" type="number" inputmode="decimal" placeholder="0">
    </div>
    <div style="display:flex;gap:10px">
      <button class="ob-next-btn" style="flex:1" onclick="confirmQuickAddKcal()">Add →</button>
      <button class="ob-back-btn" onclick="document.getElementById('nutrQuickAddModal').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  setTimeout(() => document.getElementById('qa-cal')?.focus(), 60);
}
function confirmQuickAddKcal() {
  const cid  = AppState._nutrSearchCid;
  const meal = AppState._nutrSearchMeal;
  const date = AppState._nutrSearchDate;
  const cal  = parseFloat(document.getElementById('qa-cal')?.value) || 0;
  if (cal <= 0) { showFitToast('Enter calories'); return; }
  const p = parseFloat(document.getElementById('qa-p')?.value) || 0;
  const c = parseFloat(document.getElementById('qa-c')?.value) || 0;
  const f = parseFloat(document.getElementById('qa-f')?.value) || 0;
  const diary = getNutrDiary(cid, date);
  if (!diary[meal]) diary[meal] = [];
  diary[meal].push({ id: 'qa_' + Date.now(), name: 'Quick add', cal, p, c, f, qty: 1, serving: 'quick entry' });
  saveNutrDiary(cid, date, diary);
  sbAutoSync(cid);
  document.getElementById('nutrQuickAddModal')?.remove();
  haptic('success');
  showFitToast(`+${Math.round(cal)} kcal`);
  const cl = (getAllClients().find(x => x.id === cid)) || AppState.currentClient;
  if (!cl) return;
  const panel = document.getElementById('panel-nutrition');
  if (panel) panel.innerHTML = renderNutritionTracker(cl);
}

function closeNutrSearch() {
  document.getElementById('nutrSearchModal')?.remove();
}

function nutrFilterCat(btn, cat) {
  AppState._nutrCatFilter = cat;
  document.querySelectorAll('.nutr-cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  nutrSearchUpdate(document.getElementById('nutrSearchInput')?.value || '');
}

function nutrSearchUpdate(q) {
  const cat        = AppState._nutrCatFilter || '';
  const cid        = AppState._nutrSearchCid;
  const customList = getCustomFoods(cid).map(f => ({ ...f, _custom: true }));
  const allFoods   = [...customList, ...FOOD_DB];

  const results = allFoods.filter(f => {
    const matchQ = !q || f.name.toLowerCase().includes(q.toLowerCase());
    const matchC = !cat || f.cat === cat;
    return matchQ && matchC;
  }).slice(0, 50);

  const el = document.getElementById('nutrSearchResults');
  if (!el) return;

  if (!results.length) {
    el.innerHTML = `<div class="nutr-no-results">No foods found. Add a custom food below.</div>`;
    return;
  }

  el.innerHTML = results.map(f => {
    const fid = f._custom ? 'c_' + f.id : f.id;
    return `<div class="nutr-result-row" onclick="openNutrAddQty('${esc(fid)}')">
      <div class="nutr-result-info">
        <div class="nutr-result-name">${esc(f.name)}${f._custom ? ' <span class="nutr-custom-tag">custom</span>' : ''}</div>
        <div class="nutr-result-meta">${esc(f.serving)} · ${f.cal} kcal · ${f.p}g P · ${f.c}g C · ${f.f}g F</div>
      </div>
      <div class="nutr-result-add">+</div>
    </div>`;
  }).join('');

  // Cache for qty lookup
  window._nutrResultsCache = results;
}

/* ── QUANTITY SELECTOR ───────────────────────────────────────── */
function openNutrAddQty(foodId) {
  const cid     = AppState._nutrSearchCid;
  const isCustom = foodId.startsWith('c_');
  const realId  = isCustom ? foodId.slice(2) : foodId;
  const food    = isCustom
    ? getCustomFoods(cid).find(f => String(f.id) === String(realId))
    : FOOD_DB.find(f => f.id === realId);
  if (!food) return;

  document.getElementById('nutrQtyModal')?.remove();

  const popup = document.createElement('div');
  popup.id = 'nutrQtyModal';
  popup.style.cssText = 'position:fixed;inset:0;z-index:4100;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  popup.innerHTML = `<div style="background:var(--surface);border-radius:14px;padding:24px 20px;width:100%;max-width:320px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px;margin-bottom:4px">${esc(food.name)}</div>
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);margin-bottom:18px">Per serving (${esc(food.serving)}): ${food.cal} kcal · ${food.p}g P · ${food.c}g C · ${food.f}g F</div>
    <div style="margin-bottom:14px">
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Servings</div>
      <input class="fit-input" id="nutrQtyInput" type="number" step="0.25" min="0.25" value="1" inputmode="decimal" style="font-size:20px;text-align:center">
    </div>
    <div id="nutrQtyPreview" style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);text-align:center;margin-bottom:18px;min-height:16px"></div>
    <div style="display:flex;gap:10px">
      <button class="ob-next-btn" style="flex:1" onclick="confirmNutrAddFood('${esc(foodId)}')">Add to ${esc(AppState._nutrSearchMeal)} →</button>
      <button class="ob-back-btn" onclick="document.getElementById('nutrQtyModal').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(popup);

  const qtyEl    = document.getElementById('nutrQtyInput');
  const preEl    = document.getElementById('nutrQtyPreview');
  const updatePr = () => {
    const qty = parseFloat(qtyEl.value) || 1;
    preEl.textContent = `${Math.round(food.cal * qty)} kcal · ${Math.round(food.p * qty * 10) / 10}g P · ${Math.round(food.c * qty * 10) / 10}g C · ${Math.round(food.f * qty * 10) / 10}g F`;
  };
  qtyEl.addEventListener('input', updatePr);
  updatePr();
  setTimeout(() => qtyEl?.select(), 60);
}

function confirmNutrAddFood(foodId) {
  const cid      = AppState._nutrSearchCid;
  const meal     = AppState._nutrSearchMeal;
  const date     = AppState._nutrSearchDate;
  const isCustom = foodId.startsWith('c_');
  const isOff    = foodId.startsWith('off_');
  const realId   = isCustom ? foodId.slice(2) : foodId;
  const food     = isCustom
    ? getCustomFoods(cid).find(f => String(f.id) === String(realId))
    : isOff
      ? (window._nutrOffMap || {})[foodId]
      : FOOD_DB.find(f => f.id === realId);
  if (!food) return;

  const qty = Math.max(0.25, parseFloat(document.getElementById('nutrQtyInput')?.value) || 1);

  const diary = getNutrDiary(cid, date);
  if (!diary[meal]) diary[meal] = [];
  diary[meal].push({ id: food.id, name: food.name, cal: food.cal, p: food.p, c: food.c, f: food.f, qty, serving: food.serving });
  saveNutrDiary(cid, date, diary);
  addToRecents(cid, food);
  sbAutoSync(cid);

  document.getElementById('nutrQtyModal')?.remove();
  closeNutrSearch();
  haptic('success');
  showFitToast(food.name + ' added');

  const c = (getAllClients().find(cl => cl.id === cid)) || AppState.currentClient;
  if (!c) return;
  const panel = document.getElementById('panel-nutrition');
  if (panel) panel.innerHTML = renderNutritionTracker(c);
}

/* ── CUSTOM FOOD MODAL ───────────────────────────────────────── */
function openNutrCustomFood() {
  document.getElementById('nutrCustomFoodModal')?.remove();

  const modal = document.createElement('div');
  modal.id    = 'nutrCustomFoodModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:4200;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center';
  modal.innerHTML = `<div style="background:var(--surface);border-radius:16px 16px 0 0;padding:24px 20px;width:100%;max-width:480px;box-sizing:border-box">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px;margin-bottom:16px">Custom Food</div>
    <div class="ob-field" style="margin-bottom:10px">
      <label class="ob-label">Food Name</label>
      <input class="ob-input" id="cf-name" type="text" placeholder="e.g. Homemade protein bowl" autofocus>
    </div>
    <div class="ob-field" style="margin-bottom:10px">
      <label class="ob-label">Serving Size</label>
      <input class="ob-input" id="cf-serving" type="text" placeholder="e.g. 1 bowl, 200g">
    </div>
    <div class="ob-input-row" style="margin-bottom:10px">
      <div class="ob-field"><label class="ob-label">Calories</label>
        <input class="ob-input" id="cf-cal" type="number" placeholder="0" inputmode="numeric"></div>
      <div class="ob-field"><label class="ob-label">Protein (g)</label>
        <input class="ob-input" id="cf-p" type="number" placeholder="0" inputmode="numeric"></div>
    </div>
    <div class="ob-input-row" style="margin-bottom:20px">
      <div class="ob-field"><label class="ob-label">Carbs (g)</label>
        <input class="ob-input" id="cf-c" type="number" placeholder="0" inputmode="numeric"></div>
      <div class="ob-field"><label class="ob-label">Fat (g)</label>
        <input class="ob-input" id="cf-f" type="number" placeholder="0" inputmode="numeric"></div>
    </div>
    <div style="display:flex;gap:10px">
      <button class="ob-next-btn" style="flex:1" onclick="confirmNutrCustomFood()">Save & Add →</button>
      <button class="ob-back-btn" onclick="document.getElementById('nutrCustomFoodModal').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  setTimeout(() => document.getElementById('cf-name')?.focus(), 60);
}

function confirmNutrCustomFood() {
  const cid     = AppState._nutrSearchCid;
  const meal    = AppState._nutrSearchMeal;
  const date    = AppState._nutrSearchDate;
  const nameEl  = document.getElementById('cf-name');
  const name    = nameEl?.value?.trim();
  const serving = document.getElementById('cf-serving')?.value?.trim() || '1 serving';
  const cal     = parseFloat(document.getElementById('cf-cal')?.value) || 0;
  const p       = parseFloat(document.getElementById('cf-p')?.value)   || 0;
  const c       = parseFloat(document.getElementById('cf-c')?.value)   || 0;
  const f       = parseFloat(document.getElementById('cf-f')?.value)   || 0;

  if (!name) {
    if (nameEl) nameEl.style.borderColor = '#e74c3c';
    return;
  }

  // Save to custom food library
  const customs = getCustomFoods(cid);
  const newFood = { id: Date.now(), cat: 'Custom', name, serving, cal, p, c, f };
  customs.push(newFood);
  saveCustomFoods(cid, customs);

  // Add directly to diary
  const diary = getNutrDiary(cid, date);
  if (!diary[meal]) diary[meal] = [];
  diary[meal].push({ id: newFood.id, name, cal, p, c, f, qty: 1, serving });
  saveNutrDiary(cid, date, diary);
  addToRecents(cid, newFood);
  sbAutoSync(cid);

  document.getElementById('nutrCustomFoodModal')?.remove();
  closeNutrSearch();
  haptic('success');
  showFitToast(name + ' added');

  const cl = (getAllClients().find(cl => cl.id === cid)) || AppState.currentClient;
  if (!cl) return;
  const panel = document.getElementById('panel-nutrition');
  if (panel) panel.innerHTML = renderNutritionTracker(cl);
}

/* ══════════════════════════════════════════════════════════════
   ONLINE FOOD SEARCH — Open Food Facts API
   Free, no-auth, 2M+ products with real barcode/nutrition data
══════════════════════════════════════════════════════════════ */
async function nutrOnlineSearch(query) {
  const el = document.getElementById('nutrSearchResults');
  if (!el) return;
  if (!query || query.length < 2) {
    el.innerHTML = `<div class="nutr-no-results">Type at least 2 characters to search</div>`;
    return;
  }
  if (!window._networkOk?.()) {
    el.innerHTML = `<div class="nutr-no-results">Offline — switch to Library tab</div>`;
    return;
  }
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=25&fields=code,product_name,brands,serving_size,nutriments,image_small_url`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Search failed');
    const data = await resp.json();
    const foods = (data.products || []).map(_offMapProduct).filter(Boolean);
    if (!foods.length) {
      el.innerHTML = `<div class="nutr-no-results">No products found for "${esc(query)}"</div>`;
      return;
    }
    window._nutrOnlineCache = foods;
    el.innerHTML = foods.map(f => `
      <div class="nutr-result-row" onclick="openNutrAddQtyOnline('${esc(f.id)}')">
        ${f.image ? `<img class="nutr-result-img" src="${esc(f.image)}" alt="" loading="lazy" decoding="async">` : `<div class="nutr-result-img nutr-result-img-placeholder"></div>`}
        <div class="nutr-result-info">
          <div class="nutr-result-name">${esc(f.name)}${f.brand ? ` <span class="nutr-result-brand">${esc(f.brand)}</span>` : ''}</div>
          <div class="nutr-result-meta">${esc(f.serving)} · ${f.cal} kcal · ${f.p}g P · ${f.c}g C · ${f.f}g F</div>
        </div>
        <div class="nutr-result-add">+</div>
      </div>`).join('');
  } catch (err) {
    el.innerHTML = `<div class="nutr-no-results">Search failed. Check connection or try Library.</div>`;
  }
}

function _offMapProduct(p) {
  const nut = p.nutriments || {};
  // Prefer per-serving data; fall back to per-100g
  const perServing = nut['energy-kcal_serving'] || nut['energy-kcal_100g'];
  if (!perServing) return null;
  const useServing = !!nut['energy-kcal_serving'];
  const cal = Math.round(useServing ? nut['energy-kcal_serving'] : nut['energy-kcal_100g']);
  const p2  = Math.round((useServing ? nut['proteins_serving']      : nut['proteins_100g'])      || 0);
  const c2  = Math.round((useServing ? nut['carbohydrates_serving'] : nut['carbohydrates_100g']) || 0);
  const f2  = Math.round((useServing ? nut['fat_serving']           : nut['fat_100g'])           || 0);
  const name  = (p.product_name || '').trim();
  if (!name) return null;
  const servingLbl = useServing
    ? (p.serving_size || '1 serving')
    : '100g';
  return {
    id: 'off_' + (p.code || Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
    name,
    brand: (p.brands || '').split(',')[0].trim() || '',
    serving: servingLbl,
    cal, p: p2, c: c2, f: f2,
    image: p.image_small_url || '',
    code: p.code || '',
  };
}

async function nutrOnlineLookupBarcode(barcode) {
  if (!window._networkOk?.()) throw new Error('offline');
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,brands,serving_size,nutriments,image_small_url`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Lookup failed');
  const data = await resp.json();
  if (data.status !== 1 || !data.product) return null;
  return _offMapProduct(data.product);
}

function openNutrAddQtyOnline(foodId) {
  const food = (window._nutrOnlineCache || []).find(f => f.id === foodId);
  if (!food) return;
  // Stash it in a global map so confirmNutrAddFood can find it via the 'off_' prefix
  window._nutrOffMap = window._nutrOffMap || {};
  window._nutrOffMap[foodId] = food;
  _openQtyModalForFood(food, foodId);
}

function _openQtyModalForFood(food, foodId) {
  document.getElementById('nutrQtyModal')?.remove();
  const popup = document.createElement('div');
  popup.id = 'nutrQtyModal';
  popup.style.cssText = 'position:fixed;inset:0;z-index:4100;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  popup.innerHTML = `<div style="background:var(--surface);border-radius:14px;padding:24px 20px;width:100%;max-width:320px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px;margin-bottom:4px">${esc(food.name)}</div>
    ${food.brand ? `<div style="font-size:11px;color:var(--muted);margin-bottom:8px">${esc(food.brand)}</div>` : ''}
    <div style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);margin-bottom:18px">Per serving (${esc(food.serving)}): ${food.cal} kcal · ${food.p}g P · ${food.c}g C · ${food.f}g F</div>
    <div style="margin-bottom:14px">
      <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Servings</div>
      <input class="fit-input" id="nutrQtyInput" type="number" step="0.25" min="0.25" value="1" inputmode="decimal" style="font-size:20px;text-align:center">
    </div>
    <div id="nutrQtyPreview" style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);text-align:center;margin-bottom:18px;min-height:16px"></div>
    <div style="display:flex;gap:10px">
      <button class="ob-next-btn" style="flex:1" onclick="confirmNutrAddFood('${esc(foodId)}')">Add to ${esc(AppState._nutrSearchMeal)} →</button>
      <button class="ob-back-btn" onclick="document.getElementById('nutrQtyModal').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(popup);
  const qtyEl    = document.getElementById('nutrQtyInput');
  const preEl    = document.getElementById('nutrQtyPreview');
  const updatePr = () => {
    const qty = parseFloat(qtyEl.value) || 1;
    preEl.textContent = `${Math.round(food.cal * qty)} kcal · ${Math.round(food.p * qty * 10) / 10}g P · ${Math.round(food.c * qty * 10) / 10}g C · ${Math.round(food.f * qty * 10) / 10}g F`;
  };
  qtyEl.addEventListener('input', updatePr);
  updatePr();
  setTimeout(() => qtyEl?.select(), 60);
}

/* ══════════════════════════════════════════════════════════════
   BARCODE SCANNER
   Uses native BarcodeDetector API (Chromium-based mobile browsers)
   Falls back to manual barcode entry on unsupported browsers (iOS Safari)
══════════════════════════════════════════════════════════════ */
async function openNutrBarcodeScanner() {
  if ('BarcodeDetector' in window) {
    try {
      const formats = await BarcodeDetector.getSupportedFormats();
      if (formats.includes('ean_13') || formats.includes('upc_a') || formats.includes('ean_8')) {
        return openNutrBarcodeCameraScanner();
      }
    } catch (_) {}
  }
  // Fallback: manual entry
  openNutrBarcodeManual();
}

function openNutrBarcodeManual() {
  document.getElementById('nutrBarcodeModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'nutrBarcodeModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:4300;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  modal.innerHTML = `<div style="background:var(--surface);border-radius:14px;padding:24px 20px;width:100%;max-width:360px">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px;margin-bottom:8px">Enter Barcode</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:14px">Camera scanning not supported on this browser. Type the barcode digits from your product.</div>
    <input class="fit-input" id="nutrBarcodeInput" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="e.g. 3017620422003" style="font-size:16px;letter-spacing:1px;margin-bottom:14px" autofocus>
    <div id="nutrBarcodeStatus" style="font-family:'DM Mono',monospace;font-size:10px;color:var(--muted);margin-bottom:14px;min-height:14px"></div>
    <div style="display:flex;gap:10px">
      <button class="ob-next-btn" style="flex:1" onclick="nutrBarcodeManualLookup()">Look Up →</button>
      <button class="ob-back-btn" onclick="document.getElementById('nutrBarcodeModal').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('nutrBarcodeInput')?.focus(), 60);
}

async function nutrBarcodeManualLookup() {
  const input   = document.getElementById('nutrBarcodeInput');
  const status  = document.getElementById('nutrBarcodeStatus');
  const code    = (input?.value || '').replace(/\D/g, '');
  if (!code || code.length < 8) {
    if (status) status.textContent = 'Barcode must be at least 8 digits';
    if (status) status.style.color = '#e74c3c';
    return;
  }
  if (status) { status.textContent = 'Looking up...'; status.style.color = 'var(--muted)'; }
  try {
    const food = await nutrOnlineLookupBarcode(code);
    if (!food) {
      if (status) { status.textContent = 'Product not found. Try custom food.'; status.style.color = '#e74c3c'; }
      return;
    }
    document.getElementById('nutrBarcodeModal')?.remove();
    window._nutrOffMap = window._nutrOffMap || {};
    window._nutrOffMap[food.id] = food;
    _openQtyModalForFood(food, food.id);
  } catch (err) {
    if (status) { status.textContent = 'Lookup failed — check connection'; status.style.color = '#e74c3c'; }
  }
}

async function openNutrBarcodeCameraScanner() {
  document.getElementById('nutrBarcodeCamModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'nutrBarcodeCamModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:4400;background:#000;display:flex;flex-direction:column';
  modal.innerHTML = `
    <div style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,.5)">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:1px;color:#fff">Scan Barcode</div>
      <button onclick="closeNutrBarcodeCam()" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer;padding:0 8px">✕</button>
    </div>
    <div style="flex:1;position:relative;overflow:hidden">
      <video id="nutrBarcodeVideo" style="width:100%;height:100%;object-fit:cover" playsinline muted></video>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;max-width:320px;height:120px;border:2px solid var(--accent);border-radius:12px;pointer-events:none;box-shadow:0 0 0 9999px rgba(0,0,0,.35)"></div>
    </div>
    <div id="nutrBarcodeCamStatus" style="padding:12px 20px;text-align:center;font-family:'DM Mono',monospace;font-size:11px;color:#fff;background:rgba(0,0,0,.5);min-height:20px">Point camera at a barcode...</div>
    <div style="padding:12px 20px;background:rgba(0,0,0,.5);display:flex;justify-content:center">
      <button onclick="closeNutrBarcodeCam();openNutrBarcodeManual()" style="background:var(--surface);color:#fff;border:1px solid var(--border);border-radius:8px;padding:10px 20px;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer">Enter Manually</button>
    </div>`;
  document.body.appendChild(modal);

  let stream = null;
  let scanning = true;
  AppState._nutrBarcodeAbort = () => { scanning = false; if (stream) stream.getTracks().forEach(t => t.stop()); };

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    const video = document.getElementById('nutrBarcodeVideo');
    video.srcObject = stream;
    await video.play();

    const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    const status = document.getElementById('nutrBarcodeCamStatus');

    const tick = async () => {
      if (!scanning) return;
      try {
        const codes = await detector.detect(video);
        if (codes && codes.length) {
          const code = codes[0].rawValue;
          scanning = false;
          if (status) status.textContent = 'Found: ' + code + ' — looking up...';
          haptic('success');
          stream.getTracks().forEach(t => t.stop());
          try {
            const food = await nutrOnlineLookupBarcode(code);
            closeNutrBarcodeCam();
            if (!food) { showFitToast('Product not in database'); return; }
            window._nutrOffMap = window._nutrOffMap || {};
            window._nutrOffMap[food.id] = food;
            _openQtyModalForFood(food, food.id);
          } catch (_) {
            closeNutrBarcodeCam();
            showFitToast('Lookup failed');
          }
          return;
        }
      } catch (_) {}
      if (scanning) setTimeout(tick, 250);
    };
    tick();
  } catch (err) {
    const status = document.getElementById('nutrBarcodeCamStatus');
    if (status) status.textContent = 'Camera access denied. Use Enter Manually.';
  }
}

function closeNutrBarcodeCam() {
  if (AppState._nutrBarcodeAbort) { AppState._nutrBarcodeAbort(); AppState._nutrBarcodeAbort = null; }
  document.getElementById('nutrBarcodeCamModal')?.remove();
}
