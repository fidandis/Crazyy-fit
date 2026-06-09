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
  { id:'chicken_breast',  cat:'Protein', name:'Chicken Breast (Raw)',   cal:120, p:22,  c:0,   f:2.6, serving:'100g', fiber:0,   sodium:74,  sugar:0   },
  { id:'chk_breast_ckd',  cat:'Protein', name:'Chicken Breast (Cooked)',cal:165, p:31,  c:0,   f:3.6, serving:'100g', fiber:0,   sodium:74,  sugar:0   },
  { id:'chicken_thigh',   cat:'Protein', name:'Chicken Thigh (Boneless)',cal:209,p:26,  c:0,   f:11,  serving:'100g', fiber:0,   sodium:84,  sugar:0   },
  { id:'chk_thigh_skin',  cat:'Protein', name:'Chicken Thigh (With Skin)',cal:247,p:22, c:0,   f:17,  serving:'100g', fiber:0,   sodium:86,  sugar:0   },
  { id:'chk_drumstick',   cat:'Protein', name:'Chicken Drumstick',      cal:172, p:28,  c:0,   f:5.7, serving:'100g (no bone)', fiber:0, sodium:90, sugar:0 },
  { id:'chk_wing',        cat:'Protein', name:'Chicken Wing (Cooked)',  cal:203, p:30,  c:0,   f:8.1, serving:'1 wing', baseG:55, fiber:0, sodium:60, sugar:0 },
  { id:'chk_tenders',     cat:'Protein', name:'Chicken Tenders',        cal:131, p:23,  c:0,   f:3.5, serving:'100g', fiber:0,   sodium:75,  sugar:0   },
  // Ground beef by lean/fat ratio
  { id:'gb_97_3',         cat:'Protein', name:'Ground Beef 97/3',      cal:130, p:25,  c:0,   f:3,   serving:'100g', fiber:0, sodium:72,  sugar:0 },
  { id:'gb_96_4',         cat:'Protein', name:'Ground Beef 96/4',      cal:137, p:24,  c:0,   f:4,   serving:'100g', fiber:0, sodium:72,  sugar:0 },
  { id:'gb_93_7',         cat:'Protein', name:'Ground Beef 93/7',      cal:152, p:22,  c:0,   f:7,   serving:'100g', fiber:0, sodium:72,  sugar:0 },
  { id:'gb_90_10',        cat:'Protein', name:'Ground Beef 90/10',     cal:176, p:20,  c:0,   f:10,  serving:'100g', fiber:0, sodium:72,  sugar:0 },
  { id:'ground_beef',     cat:'Protein', name:'Ground Beef 85/15',     cal:215, p:19,  c:0,   f:15,  serving:'100g', fiber:0, sodium:72,  sugar:0 },
  { id:'gb_80_20',        cat:'Protein', name:'Ground Beef 80/20',     cal:254, p:17,  c:0,   f:20,  serving:'100g', fiber:0, sodium:72,  sugar:0 },
  { id:'gb_75_25',        cat:'Protein', name:'Ground Beef 75/25',     cal:292, p:15,  c:0,   f:25,  serving:'100g', fiber:0, sodium:72,  sugar:0 },

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
  { id:'salmon_atlantic',  cat:'Protein', name:'Atlantic Salmon (Farmed)',cal:208,p:20,  c:0,   f:13,  serving:'100g',         fiber:0, sodium:59,  sugar:0 },
  { id:'salmon_wild',      cat:'Protein', name:'Wild Salmon (Sockeye)', cal:168, p:23,  c:0,   f:7.7, serving:'100g',         fiber:0, sodium:47,  sugar:0 },
  { id:'tuna_canned',      cat:'Protein', name:'Tuna (Canned, Water)',  cal:109, p:25,  c:0,   f:0.5, serving:'100g',         fiber:0, sodium:247, sugar:0 },
  { id:'tuna_albacore',    cat:'Protein', name:'Albacore Tuna (Canned)',cal:123, p:27,  c:0,   f:1.6, serving:'100g',         fiber:0, sodium:310, sugar:0 },
  { id:'tuna_yellowfin',   cat:'Protein', name:'Yellowfin Tuna (Raw)',  cal:109, p:24,  c:0,   f:0.5, serving:'100g',         fiber:0, sodium:40,  sugar:0 },
  { id:'tilapia',          cat:'Protein', name:'Tilapia (Fillet)',      cal:129, p:26,  c:0,   f:2.7, serving:'100g',         fiber:0, sodium:56,  sugar:0 },
  { id:'shrimp',           cat:'Protein', name:'Shrimp (Cooked)',       cal:99,  p:24,  c:0,   f:0.3, serving:'100g',         fiber:0, sodium:211, sugar:0 },
  { id:'egg_whole',       cat:'Protein', name:'Egg (Large)',           cal:78,  p:6,   c:0.6, f:5,   serving:'1 egg', baseG:50, fiber:0,   sodium:70,  sugar:0.6 },
  { id:'egg_whites',      cat:'Protein', name:'Egg Whites',            cal:52,  p:11,  c:0.7, f:0.2, serving:'100g',         fiber:0,   sodium:166, sugar:0.7 },
  { id:'greek_yogurt',    cat:'Protein', name:'Greek Yogurt (0%)',     cal:59,  p:10,  c:3.6, f:0.4, serving:'100g',         fiber:0,   sodium:36,  sugar:3.6 },
  { id:'cottage_cheese',  cat:'Protein', name:'Cottage Cheese',        cal:90,  p:12,  c:3,   f:2.5, serving:'100g',         fiber:0,   sodium:364, sugar:3   },
  { id:'whey_protein',    cat:'Protein', name:'Whey Protein (1 scoop)',cal:120, p:24,  c:3,   f:2,   serving:'1 scoop', baseG:30, fiber:0,   sodium:80,  sugar:2   },
  { id:'protein_bar',     cat:'Protein', name:'Protein Bar',           cal:210, p:20,  c:21,  f:8,   serving:'1 bar', baseG:60 },
  { id:'edamame',         cat:'Protein', name:'Edamame',               cal:122, p:11,  c:9.9, f:5.2, serving:'100g' },

  // Grains & Carbs
  { id:'white_rice',      cat:'Carbs',   name:'White Rice (Cooked)',   cal:130, p:2.7, c:28,  f:0.3, serving:'100g',      fiber:0.4, sodium:1,   sugar:0   },
  { id:'brown_rice',      cat:'Carbs',   name:'Brown Rice (Cooked)',   cal:111, p:2.6, c:23,  f:0.9, serving:'100g',      fiber:1.8, sodium:5,   sugar:0   },
  { id:'oats_dry',        cat:'Carbs',   name:'Oats (Dry)',            cal:150, p:5,   c:27,  f:2.7, serving:'40g', baseG:40, fiber:4,   sodium:0,   sugar:0.4 },
  { id:'oatmeal_cooked',  cat:'Carbs',   name:'Oatmeal (Cooked)',      cal:166, p:5.9, c:28,  f:3.6, serving:'1 cup', baseG:234, fiber:4,   sodium:9,   sugar:0.5 },
  { id:'pasta_cooked',    cat:'Carbs',   name:'Pasta (Cooked)',        cal:131, p:5,   c:25,  f:1.1, serving:'100g',      fiber:1.8, sodium:1,   sugar:0.6 },
  { id:'sweet_potato',    cat:'Carbs',   name:'Sweet Potato (Baked)',  cal:90,  p:2,   c:21,  f:0.1, serving:'100g',      fiber:3,   sodium:55,  sugar:5   },
  { id:'white_potato',    cat:'Carbs',   name:'White Potato (Baked)',  cal:86,  p:1.9, c:20,  f:0.1, serving:'100g',      fiber:1.8, sodium:10,  sugar:1   },
  { id:'quinoa_cooked',   cat:'Carbs',   name:'Quinoa (Cooked)',       cal:120, p:4.4, c:21,  f:1.9, serving:'100g',      fiber:2.8, sodium:7,   sugar:0.9 },
  { id:'bread_ww',        cat:'Carbs',   name:'Whole Wheat Bread',     cal:79,  p:4,   c:13,  f:1.1, serving:'1 slice', baseG:28, fiber:2,   sodium:132, sugar:1.4 },
  { id:'bread_white',     cat:'Carbs',   name:'White Bread',           cal:79,  p:2.7, c:15,  f:1,   serving:'1 slice', baseG:28, fiber:0.6, sodium:142, sugar:1.5 },
  { id:'tortilla_flour',  cat:'Carbs',   name:'Flour Tortilla',        cal:146, p:3.8, c:25,  f:3.5, serving:'1 medium', baseG:45 },
  { id:'bagel',           cat:'Carbs',   name:'Bagel (Plain)',         cal:270, p:10,  c:53,  f:1.5, serving:'1 bagel', baseG:105 },
  { id:'rice_cakes',      cat:'Carbs',   name:'Rice Cakes (Plain)',    cal:35,  p:0.7, c:7.3, f:0.3, serving:'1 cake', baseG:9 },

  // Fruits
  { id:'banana',          cat:'Fruit',   name:'Banana',                cal:105, p:1.3, c:27,  f:0.4, serving:'1 medium', baseG:118, fiber:3.1, sodium:1,   sugar:14  },
  { id:'apple',           cat:'Fruit',   name:'Apple',                 cal:95,  p:0.5, c:25,  f:0.3, serving:'1 medium', baseG:182, fiber:4.4, sodium:2,   sugar:19  },
  { id:'blueberries',     cat:'Fruit',   name:'Blueberries',           cal:57,  p:0.7, c:14,  f:0.3, serving:'100g',      fiber:2.4, sodium:1,   sugar:10  },
  { id:'strawberries',    cat:'Fruit',   name:'Strawberries',          cal:32,  p:0.7, c:7.7, f:0.3, serving:'100g',      fiber:2,   sodium:1,   sugar:4.9 },
  { id:'orange',          cat:'Fruit',   name:'Orange',                cal:62,  p:1.2, c:15,  f:0.2, serving:'1 medium', baseG:131 },
  { id:'mango',           cat:'Fruit',   name:'Mango',                 cal:99,  p:1.4, c:25,  f:0.6, serving:'1 cup', baseG:165 },
  { id:'grapes',          cat:'Fruit',   name:'Grapes',                cal:69,  p:0.7, c:18,  f:0.2, serving:'100g' },

  // Vegetables
  { id:'broccoli',        cat:'Veggie',  name:'Broccoli',              cal:34,  p:2.8, c:6.6, f:0.4, serving:'100g', fiber:2.6, sodium:33,  sugar:1.5 },
  { id:'spinach',         cat:'Veggie',  name:'Spinach',               cal:23,  p:2.9, c:3.6, f:0.4, serving:'100g', fiber:2.2, sodium:79,  sugar:0.4 },
  { id:'carrots',         cat:'Veggie',  name:'Carrots',               cal:41,  p:0.9, c:9.6, f:0.2, serving:'100g', fiber:2.8, sodium:69,  sugar:4.7 },
  { id:'bell_pepper',     cat:'Veggie',  name:'Bell Pepper',           cal:31,  p:1,   c:6,   f:0.3, serving:'100g', fiber:2.1, sodium:4,   sugar:3.7 },
  { id:'cucumber',        cat:'Veggie',  name:'Cucumber',              cal:15,  p:0.6, c:3.6, f:0.1, serving:'100g', fiber:0.5, sodium:2,   sugar:1.7 },
  { id:'tomato',          cat:'Veggie',  name:'Tomato',                cal:18,  p:0.9, c:3.9, f:0.2, serving:'100g', fiber:1.2, sodium:5,   sugar:2.6 },
  { id:'green_beans',     cat:'Veggie',  name:'Green Beans',           cal:31,  p:1.8, c:7,   f:0.2, serving:'100g', fiber:3.4, sodium:6,   sugar:1.5 },
  { id:'asparagus',       cat:'Veggie',  name:'Asparagus',             cal:20,  p:2.2, c:3.9, f:0.1, serving:'100g', fiber:2.1, sodium:2,   sugar:1.9 },
  { id:'kale',            cat:'Veggie',  name:'Kale',                  cal:49,  p:4.3, c:8.8, f:0.9, serving:'100g', fiber:3.6, sodium:38,  sugar:1.5 },
  { id:'cauliflower',     cat:'Veggie',  name:'Cauliflower',           cal:25,  p:1.9, c:5,   f:0.3, serving:'100g', fiber:2,   sodium:30,  sugar:1.9 },
  { id:'zucchini',        cat:'Veggie',  name:'Zucchini',              cal:17,  p:1.2, c:3.1, f:0.3, serving:'100g', fiber:1,   sodium:8,   sugar:2.5 },
  { id:'mushrooms',       cat:'Veggie',  name:'Mushrooms',             cal:22,  p:3.1, c:3.3, f:0.3, serving:'100g', fiber:1,   sodium:5,   sugar:2   },

  // Dairy
  { id:'milk_whole',      cat:'Dairy',   name:'Whole Milk',            cal:61,  p:3.2, c:4.8, f:3.3, serving:'100ml' },
  { id:'milk_skim',       cat:'Dairy',   name:'Skim Milk',             cal:34,  p:3.4, c:5,   f:0.1, serving:'100ml' },
  { id:'cheddar',         cat:'Dairy',   name:'Cheddar Cheese',        cal:113, p:7,   c:0.4, f:9.3, serving:'28g (1oz)' },
  { id:'mozzarella',      cat:'Dairy',   name:'Mozzarella',            cal:85,  p:6.3, c:1,   f:6.3, serving:'28g (1oz)' },
  { id:'cream_cheese',    cat:'Dairy',   name:'Cream Cheese',          cal:99,  p:1.7, c:1.2, f:9.8, serving:'28g (2 tbsp)' },

  // Fats & Nuts
  { id:'avocado_half',    cat:'Fats',    name:'Avocado (Half)',        cal:120, p:1.5, c:6.4, f:11,  serving:'1 half', baseG:68, fiber:5,   sodium:4,   sugar:0.7 },
  { id:'almonds',         cat:'Fats',    name:'Almonds',               cal:164, p:6,   c:6.1, f:14,  serving:'28g (1oz)', fiber:3.5, sodium:0,   sugar:1.3 },
  { id:'peanut_butter',   cat:'Fats',    name:'Peanut Butter',         cal:190, p:7,   c:7,   f:16,  serving:'2 tbsp', baseG:32, fiber:1.9, sodium:136, sugar:3.4 },
  { id:'almond_butter',   cat:'Fats',    name:'Almond Butter',         cal:196, p:6.7, c:6.1, f:18,  serving:'2 tbsp', baseG:32 },
  { id:'olive_oil',       cat:'Fats',    name:'Olive Oil',             cal:119, p:0,   c:0,   f:13.5,serving:'1 tbsp', baseG:14 },
  { id:'walnuts',         cat:'Fats',    name:'Walnuts',               cal:185, p:4.3, c:3.9, f:18,  serving:'28g (1oz)' },
  { id:'cashews',         cat:'Fats',    name:'Cashews',               cal:157, p:5.2, c:8.6, f:12,  serving:'28g (1oz)' },
  { id:'chia_seeds',      cat:'Fats',    name:'Chia Seeds',            cal:138, p:4.7, c:12,  f:8.7, serving:'28g (1oz)' },

  // Snacks & Bars
  { id:'granola_bar',     cat:'Snacks',  name:'Granola Bar',           cal:200, p:6,   c:22,  f:11,  serving:'1 bar', baseG:42 },
  { id:'hummus',          cat:'Snacks',  name:'Hummus',                cal:50,  p:2.4, c:4.9, f:2.7, serving:'2 tbsp', baseG:30 },
  { id:'dark_chocolate',  cat:'Snacks',  name:'Dark Chocolate (70%)',  cal:172, p:2.2, c:13,  f:12,  serving:'30g' },
  { id:'trail_mix',       cat:'Snacks',  name:'Trail Mix',             cal:130, p:3,   c:13,  f:8,   serving:'28g (1oz)' },
  { id:'popcorn',         cat:'Snacks',  name:'Popcorn (Air-Popped)', cal:31,  p:1,   c:6.2, f:0.4, serving:'1 cup', baseG:8 },
  { id:'rice_cakes_cf',   cat:'Snacks',  name:'Rice Cakes (Flavored)',cal:45,  p:1,   c:9,   f:0.5, serving:'1 cake', baseG:13 },

  // Prepared
  { id:'scrambled_2eggs', cat:'Prepared',name:'Scrambled Eggs (2)',   cal:200, p:14,  c:2,   f:15,  serving:'2 eggs', baseG:100 },
  { id:'pancake',         cat:'Prepared',name:'Pancake (Medium)',      cal:83,  p:2.4, c:15,  f:1.4, serving:'1 pancake', baseG:38 },
  { id:'oatmeal_ready',   cat:'Prepared',name:'Oatmeal (Prepared)',   cal:166, p:5.9, c:28,  f:3.6, serving:'1 cup', baseG:234 },
  { id:'pizza_slice',     cat:'Prepared',name:'Pizza (Cheese Slice)', cal:285, p:12,  c:36,  f:10,  serving:'1 slice', baseG:107 },
  { id:'burger_beef',     cat:'Prepared',name:'Beef Burger',          cal:295, p:17,  c:24,  f:14,  serving:'1 burger', baseG:200 },
  { id:'fries_medium',    cat:'Prepared',name:'French Fries (Medium)',cal:365, p:4,   c:48,  f:17,  serving:'1 medium', baseG:117 },
  { id:'protein_smoothie',cat:'Prepared',name:'Protein Smoothie',     cal:300, p:30,  c:30,  f:8,   serving:'1 serving', baseG:350 },
  { id:'beef_broccoli',   cat:'Prepared',name:'Beef & Broccoli',      cal:240, p:24,  c:14,  f:10,  serving:'1 cup', baseG:220 },

  // Drinks
  { id:'oj',              cat:'Drinks',  name:'Orange Juice',          cal:112, p:1.7, c:26,  f:0.5, serving:'1 cup', baseG:240 },
  { id:'coffee_black',    cat:'Drinks',  name:'Coffee (Black)',        cal:2,   p:0.3, c:0,   f:0,   serving:'1 cup', baseG:240 },
  { id:'protein_rtd',     cat:'Drinks',  name:'Ready-to-Drink Protein',cal:160, p:30,  c:4,   f:4,   serving:'1 bottle', baseG:340 },

  // More Protein
  // Pork
  { id:'pork_tenderloin',  cat:'Protein', name:'Pork Tenderloin',        cal:143, p:26,  c:0,   f:3.5, serving:'100g' },
  { id:'pork_chop',        cat:'Protein', name:'Pork Chop (Lean, Bone-In)',cal:172,p:26, c:0,   f:7,   serving:'100g' },
  { id:'pork_chop_boneless',cat:'Protein',name:'Pork Chop (Boneless)',   cal:178, p:27,  c:0,   f:7.5, serving:'100g' },
  { id:'pork_loin',        cat:'Protein', name:'Pork Loin Roast',        cal:165, p:27,  c:0,   f:6,   serving:'100g' },
  { id:'bacon_strip',      cat:'Protein', name:'Bacon Strip (Pan-Fried)',cal:43,  p:3,   c:0.1, f:3.3, serving:'1 strip', baseG:8 },
  { id:'bacon_turkey',     cat:'Protein', name:'Turkey Bacon (2 strips)',cal:70,  p:5,   c:0.3, f:5,   serving:'2 strips', baseG:28 },
  { id:'canadian_bacon',   cat:'Protein', name:'Canadian Bacon',         cal:53,  p:7.7, c:0.4, f:2,   serving:'1 slice', baseG:28 },
  { id:'ham_deli',         cat:'Protein', name:'Ham (Deli Sliced)',      cal:46,  p:5.3, c:1.3, f:1.8, serving:'2 slices', baseG:56 },
  { id:'pork_ribs',        cat:'Protein', name:'Pork Baby Back Ribs',    cal:292, p:21,  c:0,   f:23,  serving:'100g' },
  { id:'lamb_chop',        cat:'Protein', name:'Lamb Chop',              cal:259, p:25,  c:0,   f:17,  serving:'100g' },
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
  { id:'casein_protein',   cat:'Protein', name:'Casein Protein (1 scoop)',cal:120,p:24,  c:4,   f:1,   serving:'1 scoop', baseG:30 },
  // Deli meats
  { id:'deli_turkey',      cat:'Protein', name:'Turkey Breast (Deli)',   cal:50, p:10,  c:1,   f:0.5, serving:'2oz', baseG:56 },
  { id:'deli_chicken',     cat:'Protein', name:'Chicken Breast (Deli)', cal:60,p:11,  c:1,   f:1,   serving:'2oz', baseG:56 },
  { id:'deli_roast_beef',  cat:'Protein', name:'Roast Beef (Deli)',     cal:80,  p:12,  c:1,   f:2.5, serving:'2oz', baseG:56 },
  { id:'deli_salami',      cat:'Protein', name:'Salami (Deli)',          cal:104, p:5.7, c:0.6, f:8.6, serving:'1oz', baseG:28 },
  { id:'deli_pepperoni',   cat:'Protein', name:'Pepperoni',              cal:130, p:5.5, c:1,   f:12,  serving:'1oz', baseG:28 },
  { id:'deli_ham_slice',   cat:'Protein', name:'Ham (Deli)',             cal:60,  p:9,   c:2,   f:2,   serving:'2oz', baseG:56 },
  { id:'prosciutto',       cat:'Protein', name:'Prosciutto',             cal:55,  p:7,   c:0,   f:2.8, serving:'1oz', baseG:28 },
  // Beef jerky
  { id:'beef_jerky',       cat:'Protein', name:'Beef Jerky',             cal:116, p:10,  c:7,   f:5,   serving:'28g (1oz)' },
  { id:'turkey_jerky',     cat:'Protein', name:'Turkey Jerky',           cal:70,  p:13,  c:3,   f:1,   serving:'28g (1oz)' },
  { id:'rotisserie_chk',   cat:'Protein', name:'Rotisserie Chicken (light)',cal:153,p:29, c:0,   f:3.5, serving:'100g' },

  // More Carbs & Grains
  { id:'jasmine_rice',     cat:'Carbs',   name:'Jasmine Rice (Cooked)',  cal:130, p:2.7, c:28,  f:0.3, serving:'100g' },
  { id:'barley_cooked',    cat:'Carbs',   name:'Barley (Cooked)',        cal:123, p:2.3, c:28,  f:0.4, serving:'100g' },
  { id:'couscous',         cat:'Carbs',   name:'Couscous (Cooked)',      cal:112, p:3.8, c:23,  f:0.2, serving:'100g' },
  { id:'farro_cooked',     cat:'Carbs',   name:'Farro (Cooked)',         cal:170, p:6,   c:34,  f:1.4, serving:'100g' },
  { id:'pita_bread',       cat:'Carbs',   name:'Pita Bread (Whole Wheat)',cal:170,p:6,   c:35,  f:1.7, serving:'1 pita', baseG:60 },
  { id:'english_muffin',   cat:'Carbs',   name:'English Muffin (WW)',    cal:134, p:6,   c:26,  f:1.5, serving:'1 muffin', baseG:57 },
  { id:'corn_tortilla',    cat:'Carbs',   name:'Corn Tortilla',          cal:52,  p:1.4, c:11,  f:0.7, serving:'1 small', baseG:26 },
  { id:'waffle',           cat:'Carbs',   name:'Waffle (Plain)',         cal:218, p:5.9, c:25,  f:11,  serving:'1 waffle', baseG:75 },
  { id:'granola_cup',      cat:'Carbs',   name:'Granola',                cal:471, p:10,  c:64,  f:20,  serving:'100g' },
  { id:'bran_flakes',      cat:'Carbs',   name:'Bran Flakes (Cereal)',   cal:152, p:4.8, c:37,  f:0.8, serving:'40g', baseG:40 },
  { id:'cream_of_wheat',   cat:'Carbs',   name:'Cream of Wheat',        cal:126, p:3.6, c:27,  f:0.5, serving:'1 cup', baseG:234 },
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
  { id:'peach',            cat:'Fruit',   name:'Peach',                 cal:59,  p:1.4, c:14,  f:0.4, serving:'1 medium', baseG:150 },
  { id:'pear',             cat:'Fruit',   name:'Pear',                  cal:101, p:0.7, c:27,  f:0.2, serving:'1 medium', baseG:178 },
  { id:'cherries',         cat:'Fruit',   name:'Cherries',              cal:63,  p:1.1, c:16,  f:0.2, serving:'100g' },
  { id:'raspberries',      cat:'Fruit',   name:'Raspberries',           cal:52,  p:1.2, c:12,  f:0.7, serving:'100g' },
  { id:'blackberries',     cat:'Fruit',   name:'Blackberries',          cal:43,  p:1.4, c:10,  f:0.5, serving:'100g' },
  { id:'kiwi',             cat:'Fruit',   name:'Kiwi',                  cal:46,  p:0.9, c:11,  f:0.4, serving:'1 medium', baseG:69 },
  { id:'papaya',           cat:'Fruit',   name:'Papaya',                cal:43,  p:0.5, c:11,  f:0.3, serving:'100g' },
  { id:'grapefruit',       cat:'Fruit',   name:'Grapefruit (Half)',     cal:52,  p:0.9, c:13,  f:0.2, serving:'1 half', baseG:154 },
  { id:'pomegranate',      cat:'Fruit',   name:'Pomegranate Seeds',     cal:83,  p:1.7, c:19,  f:1.2, serving:'100g' },
  { id:'dates',            cat:'Fruit',   name:'Dates (Medjool)',       cal:66,  p:0.4, c:18,  f:0.1, serving:'1 date', baseG:24 },
  { id:'dried_cranb',      cat:'Fruit',   name:'Dried Cranberries',     cal:123, p:0,   c:33,  f:0.4, serving:'40g', baseG:40 },

  // More Vegetables
  { id:'cabbage',          cat:'Veggie',  name:'Cabbage',               cal:25,  p:1.3, c:5.8, f:0.1, serving:'100g' },
  { id:'brussels_sprouts', cat:'Veggie',  name:'Brussels Sprouts',      cal:43,  p:3.4, c:8.9, f:0.3, serving:'100g' },
  { id:'celery',           cat:'Veggie',  name:'Celery',                cal:16,  p:0.7, c:3,   f:0.2, serving:'100g' },
  { id:'onion',            cat:'Veggie',  name:'Onion',                 cal:40,  p:1.1, c:9.3, f:0.1, serving:'100g' },
  { id:'garlic',           cat:'Veggie',  name:'Garlic (1 clove)',      cal:4,   p:0.2, c:1,   f:0,   serving:'1 clove', baseG:3 },
  { id:'lettuce_romaine',  cat:'Veggie',  name:'Romaine Lettuce',       cal:17,  p:1.2, c:3.3, f:0.3, serving:'100g' },
  { id:'arugula',          cat:'Veggie',  name:'Arugula',               cal:25,  p:2.6, c:3.7, f:0.7, serving:'100g' },
  { id:'beet',             cat:'Veggie',  name:'Beets (Cooked)',        cal:44,  p:1.7, c:10,  f:0.2, serving:'100g' },
  { id:'artichoke',        cat:'Veggie',  name:'Artichoke (Medium)',    cal:60,  p:4.2, c:13,  f:0.2, serving:'1 medium', baseG:128 },
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
  { id:'buttermilk',       cat:'Dairy',   name:'Buttermilk',            cal:98,  p:8,   c:12,  f:2.2, serving:'1 cup', baseG:240 },
  { id:'heavy_cream',      cat:'Dairy',   name:'Heavy Cream',           cal:51,  p:0.3, c:0.4, f:5.4, serving:'1 tbsp', baseG:15 },

  // More Fats & Nuts
  { id:'macadamia',        cat:'Fats',    name:'Macadamia Nuts',        cal:204, p:2.2, c:3.9, f:21,  serving:'28g (1oz)' },
  { id:'pecans',           cat:'Fats',    name:'Pecans',                cal:196, p:2.6, c:4,   f:20,  serving:'28g (1oz)' },
  { id:'pistachios',       cat:'Fats',    name:'Pistachios',            cal:159, p:5.7, c:7.7, f:13,  serving:'28g (1oz)' },
  { id:'hazelnuts',        cat:'Fats',    name:'Hazelnuts',             cal:178, p:4.2, c:4.7, f:17,  serving:'28g (1oz)' },
  { id:'pumpkin_seeds',    cat:'Fats',    name:'Pumpkin Seeds',         cal:151, p:7,   c:5,   f:13,  serving:'28g (1oz)' },
  { id:'sunflower_seeds',  cat:'Fats',    name:'Sunflower Seeds',       cal:165, p:5.8, c:7,   f:14,  serving:'28g (1oz)' },
  { id:'flaxseeds',        cat:'Fats',    name:'Flaxseeds (Ground)',    cal:150, p:5.1, c:8.2, f:12,  serving:'28g (1oz)' },
  { id:'hemp_seeds',       cat:'Fats',    name:'Hemp Seeds (3 tbsp)',   cal:166, p:9.5, c:2.6, f:13,  serving:'3 tbsp (30g)' },
  { id:'coconut_oil',      cat:'Fats',    name:'Coconut Oil (1 tbsp)',  cal:121, p:0,   c:0,   f:13.5,serving:'1 tbsp', baseG:14 },
  { id:'butter',           cat:'Fats',    name:'Butter (1 tbsp)',       cal:102, p:0.1, c:0,   f:11.5,serving:'1 tbsp', baseG:14 },
  { id:'ghee',             cat:'Fats',    name:'Ghee (1 tbsp)',         cal:112, p:0,   c:0,   f:12.7,serving:'1 tbsp', baseG:14 },
  { id:'tahini',           cat:'Fats',    name:'Tahini (2 tbsp)',       cal:178, p:5.1, c:6.4, f:16,  serving:'2 tbsp', baseG:30 },

  // More Snacks
  { id:'mixed_nuts',       cat:'Snacks',  name:'Mixed Nuts',            cal:172, p:5,   c:6.1, f:15,  serving:'28g (1oz)' },
  { id:'string_cheese',    cat:'Snacks',  name:'String Cheese',         cal:80,  p:7,   c:0,   f:5,   serving:'1 stick', baseG:28 },
  { id:'hard_boiled_egg',  cat:'Snacks',  name:'Hard-Boiled Egg',       cal:78,  p:6.3, c:0.6, f:5.3, serving:'1 egg', baseG:50 },
  { id:'peanuts',          cat:'Snacks',  name:'Peanuts',               cal:166, p:7.3, c:4.6, f:14,  serving:'28g (1oz)' },
  { id:'edamame_snack',    cat:'Snacks',  name:'Edamame (Dry-Roasted)', cal:122, p:13,  c:9,   f:4,   serving:'28g (1oz)' },
  { id:'tuna_pouch',       cat:'Snacks',  name:'Tuna Pouch (3oz)',      cal:70,  p:16,  c:0,   f:0.5, serving:'1 pouch (85g)' },
  { id:'celery_pb',        cat:'Snacks',  name:'Celery + Peanut Butter',cal:104, p:4.1, c:6.7, f:8.1, serving:'1 serving', baseG:80 },
  { id:'apple_pb',         cat:'Snacks',  name:'Apple + Peanut Butter', cal:285, p:7.5, c:32,  f:16,  serving:'1 serving', baseG:214 },
  { id:'larabar',          cat:'Snacks',  name:'Larabar (Date-Nut)',    cal:220, p:4,   c:28,  f:10,  serving:'1 bar', baseG:45 },
  { id:'milk_choc',        cat:'Snacks',  name:'Milk Chocolate',        cal:153, p:2.2, c:17,  f:8.5, serving:'28g (1oz)' },
  { id:'quest_bar',        cat:'Snacks',  name:'Quest Bar',             cal:190, p:21,  c:21,  f:7,   serving:'1 bar', baseG:60 },
  { id:'kind_bar',         cat:'Snacks',  name:'KIND Bar (Nut)',        cal:200, p:6,   c:15,  f:15,  serving:'1 bar', baseG:40 },

  // More Prepared / Meals
  { id:'chicken_salad',    cat:'Prepared',name:'Chicken Salad',         cal:220, p:28,  c:4,   f:10,  serving:'1 cup', baseG:205 },
  { id:'caesar_salad',     cat:'Prepared',name:'Caesar Salad (small)',  cal:180, p:6,   c:14,  f:12,  serving:'1 small', baseG:150 },
  { id:'greek_salad',      cat:'Prepared',name:'Greek Salad',           cal:130, p:4,   c:9,   f:9,   serving:'1 cup', baseG:150 },
  { id:'burrito_bowl',     cat:'Prepared',name:'Burrito Bowl (chicken)',cal:490, p:35,  c:56,  f:12,  serving:'1 bowl', baseG:450 },
  { id:'sushi_roll',       cat:'Prepared',name:'Sushi Roll (California)',cal:255,p:9,   c:38,  f:7,   serving:'8 pieces', baseG:220 },
  { id:'pad_thai',         cat:'Prepared',name:'Pad Thai (chicken)',    cal:400, p:20,  c:52,  f:11,  serving:'1 serving', baseG:300 },
  { id:'stir_fry',         cat:'Prepared',name:'Chicken Stir Fry',     cal:310, p:28,  c:22,  f:12,  serving:'1 serving', baseG:300 },
  { id:'salmon_rice',      cat:'Prepared',name:'Salmon + Brown Rice',   cal:420, p:34,  c:36,  f:14,  serving:'1 plate', baseG:350 },
  { id:'turkey_wrap',      cat:'Prepared',name:'Turkey Wrap (WW)',      cal:350, p:26,  c:38,  f:10,  serving:'1 wrap', baseG:250 },
  { id:'tuna_salad_sand',  cat:'Prepared',name:'Tuna Salad Sandwich',  cal:380, p:30,  c:40,  f:11,  serving:'1 sandwich', baseG:260 },
  { id:'chicken_soup',     cat:'Prepared',name:'Chicken Noodle Soup',  cal:120, p:8,   c:15,  f:2,   serving:'1 cup', baseG:240 },
  { id:'chili_beef',       cat:'Prepared',name:'Beef Chili',            cal:290, p:24,  c:27,  f:9,   serving:'1 cup', baseG:240 },
  { id:'overnight_oats',   cat:'Prepared',name:'Overnight Oats',        cal:335, p:14,  c:55,  f:7,   serving:'1 jar', baseG:350 },
  { id:'avocado_toast',    cat:'Prepared',name:'Avocado Toast (WW)',    cal:290, p:9,   c:31,  f:15,  serving:'2 slices', baseG:180 },
  { id:'egg_muffin',       cat:'Prepared',name:'Egg McMuffin Style',    cal:300, p:17,  c:30,  f:12,  serving:'1 sandwich', baseG:140 },
  { id:'acai_bowl',        cat:'Prepared',name:'Acai Bowl',             cal:390, p:6,   c:70,  f:9,   serving:'1 bowl', baseG:350 },
  { id:'shakeology',       cat:'Prepared',name:'Meal Replacement Shake',cal:160, p:17,  c:17,  f:4,   serving:'1 serving', baseG:350 },
  { id:'mass_gainer',      cat:'Prepared',name:'Mass Gainer Shake',     cal:700, p:50,  c:100, f:8,   serving:'1 serving', baseG:300 },

  // More Drinks
  { id:'almond_milk',      cat:'Drinks',  name:'Almond Milk (Unsweetened)',cal:13,p:0.5, c:1,   f:1,   serving:'100ml' },
  { id:'oat_milk',         cat:'Drinks',  name:'Oat Milk (Barista)',    cal:60,  p:1,   c:9,   f:1.5, serving:'100ml' },
  { id:'soy_milk',         cat:'Drinks',  name:'Soy Milk',              cal:33,  p:2.9, c:1.3, f:1.8, serving:'100ml' },
  { id:'coconut_milk_bev', cat:'Drinks',  name:'Coconut Milk Beverage', cal:45,  p:0.5, c:7,   f:2,   serving:'240ml' },
  { id:'sports_drink',     cat:'Drinks',  name:'Sports Drink (Gatorade)',cal:80, p:0,   c:21,  f:0,   serving:'500ml' },
  { id:'green_smoothie',   cat:'Drinks',  name:'Green Smoothie',        cal:220, p:4,   c:46,  f:2,   serving:'16oz', baseG:480 },
  { id:'bone_broth',       cat:'Drinks',  name:'Bone Broth',            cal:38,  p:8,   c:0,   f:1,   serving:'1 cup', baseG:240 },
  { id:'coconut_water',    cat:'Drinks',  name:'Coconut Water',         cal:46,  p:1.7, c:9,   f:0.5, serving:'1 cup', baseG:240 },
  { id:'espresso',         cat:'Drinks',  name:'Espresso (double shot)',cal:6,   p:0.4, c:0.8, f:0.2, serving:'2 shots', baseG:60 },
  { id:'latte_milk',       cat:'Drinks',  name:'Latte (whole milk)',    cal:190, p:10,  c:15,  f:9,   serving:'12oz', baseG:360 },
  { id:'latte_oat',        cat:'Drinks',  name:'Oat Milk Latte',        cal:160, p:5,   c:23,  f:5,   serving:'12oz', baseG:360 },
  { id:'protein_coffee',   cat:'Drinks',  name:'Protein Iced Coffee',   cal:130, p:15,  c:9,   f:3,   serving:'12oz', baseG:360 },
  { id:'apple_juice',      cat:'Drinks',  name:'Apple Juice',           cal:114, p:0.2, c:28,  f:0.3, serving:'1 cup', baseG:240 },
  { id:'chocolate_milk',   cat:'Drinks',  name:'Chocolate Milk',        cal:208, p:8,   c:26,  f:8,   serving:'1 cup', baseG:240 },
  { id:'green_tea',        cat:'Drinks',  name:'Green Tea',             cal:2,  p:0,   c:0,   f:0,   serving:'1 cup', baseG:240 },

  // Fast Food — McDonald's
  { id:'mcds_big_mac',      cat:'Fast Food', name:"McDonald's Big Mac",       cal:550, p:25, c:46, f:29, serving:'1 sandwich', baseG:200 },
  { id:'mcds_qpc',          cat:'Fast Food', name:"McDonald's Quarter Pounder w/ Cheese", cal:530, p:30, c:42, f:26, serving:'1 sandwich', baseG:200 },
  { id:'mcds_mcchicken',    cat:'Fast Food', name:"McDonald's McChicken",     cal:400, p:14, c:42, f:18, serving:'1 sandwich', baseG:151 },
  { id:'mcds_nuggets_10',   cat:'Fast Food', name:"McDonald's 10pc Nuggets",  cal:420, p:23, c:26, f:24, serving:'10 pieces', baseG:162 },
  { id:'mcds_mcdouble',     cat:'Fast Food', name:"McDonald's McDouble",      cal:400, p:22, c:34, f:19, serving:'1 sandwich', baseG:160 },
  { id:'mcds_sm_fries',     cat:'Fast Food', name:"McDonald's Small Fries",   cal:230, p:3,  c:30, f:11, serving:'1 small', baseG:71 },
  { id:'mcds_filet',        cat:'Fast Food', name:"McDonald's Filet-O-Fish",  cal:390, p:17, c:38, f:19, serving:'1 sandwich', baseG:142 },
  { id:'mcds_sausage_egg',  cat:'Fast Food', name:"McDonald's Sausage McMuffin w/ Egg", cal:480, p:21, c:30, f:30, serving:'1 sandwich', baseG:165 },
  { id:'mcds_mcflurry',     cat:'Fast Food', name:"McDonald's Oreo McFlurry (sm)", cal:510, p:11, c:79, f:16, serving:'1 small', baseG:340 },

  // Fast Food — Burger King
  { id:'bk_whopper',        cat:'Fast Food', name:'BK Whopper',               cal:660, p:28, c:49, f:40, serving:'1 sandwich', baseG:290 },
  { id:'bk_whopper_jr',     cat:'Fast Food', name:'BK Whopper Jr',            cal:310, p:14, c:26, f:17, serving:'1 sandwich', baseG:145 },
  { id:'bk_crispy_chk',     cat:'Fast Food', name:'BK Crispy Chicken Sandwich', cal:660, p:35, c:54, f:38, serving:'1 sandwich', baseG:246 },

  // Fast Food — Chick-fil-A
  { id:'cfa_sandwich',      cat:'Fast Food', name:'Chick-fil-A Sandwich',     cal:440, p:28, c:42, f:18, serving:'1 sandwich', baseG:186 },
  { id:'cfa_nuggets_8',     cat:'Fast Food', name:'Chick-fil-A 8pc Nuggets',  cal:260, p:28, c:11, f:11, serving:'8 pieces', baseG:113 },
  { id:'cfa_grilled_sand',  cat:'Fast Food', name:'Chick-fil-A Grilled Sandwich', cal:320, p:29, c:40, f:6, serving:'1 sandwich', baseG:186 },
  { id:'cfa_waffle_fries',  cat:'Fast Food', name:'Chick-fil-A Waffle Fries (med)', cal:400, p:5, c:51, f:20, serving:'1 medium', baseG:125 },

  // Fast Food — Subway
  { id:'sub_turkey',        cat:'Fast Food', name:'Subway 6" Turkey Breast',  cal:280, p:18, c:46, f:4,  serving:'6" sub', baseG:220 },
  { id:'sub_bmt',           cat:'Fast Food', name:'Subway 6" Italian BMT',    cal:410, p:20, c:45, f:16, serving:'6" sub', baseG:234 },
  { id:'sub_veggie',        cat:'Fast Food', name:'Subway 6" Veggie Delite',  cal:230, p:9,  c:44, f:3,  serving:'6" sub', baseG:220 },

  // Fast Food — Taco Bell
  { id:'tb_crunchy_taco',   cat:'Fast Food', name:'Taco Bell Crunchy Taco',   cal:170, p:8,  c:13, f:10, serving:'1 taco', baseG:78 },
  { id:'tb_soft_taco',      cat:'Fast Food', name:'Taco Bell Soft Taco (Chicken)', cal:160, p:12, c:18, f:5, serving:'1 taco', baseG:99 },
  { id:'tb_burrito_sup',    cat:'Fast Food', name:'Taco Bell Burrito Supreme', cal:390, p:16, c:51, f:13, serving:'1 burrito', baseG:248 },
  { id:'tb_quesadilla',     cat:'Fast Food', name:'Taco Bell Chicken Quesadilla', cal:520, p:28, c:39, f:28, serving:'1 quesadilla', baseG:184 },
  { id:'tb_mex_pizza',      cat:'Fast Food', name:'Taco Bell Mexican Pizza',  cal:510, p:20, c:46, f:26, serving:'1 pizza', baseG:216 },

  // Fast Food — Wendy's
  { id:'wdy_daves_single',  cat:'Fast Food', name:"Wendy's Dave's Single",    cal:590, p:30, c:43, f:32, serving:'1 burger', baseG:227 },
  { id:'wdy_nuggets_4',     cat:'Fast Food', name:"Wendy's 4pc Nuggets",      cal:180, p:11, c:11, f:11, serving:'4 pieces', baseG:78 },
  { id:'wdy_frosty_sm',     cat:'Fast Food', name:"Wendy's Frosty (Small)",   cal:280, p:7,  c:44, f:8,  serving:'1 small', baseG:227 },

  // Fast Food — Domino's
  { id:'dom_cheese_slice',  cat:'Fast Food', name:"Domino's Cheese Pizza (slice)", cal:290, p:12, c:36, f:10, serving:'1 slice', baseG:106 },
  { id:'dom_pepperoni',     cat:'Fast Food', name:"Domino's Pepperoni Pizza (slice)", cal:340, p:14, c:36, f:15, serving:'1 slice', baseG:106 },
  { id:'dom_cheesy_bread',  cat:'Fast Food', name:"Domino's Cheesy Bread",    cal:200, p:8,  c:24, f:8,  serving:'2 pieces', baseG:70 },

  // Fast Food — Panda Express
  { id:'panda_orange_chk',  cat:'Fast Food', name:'Panda Orange Chicken',     cal:490, p:23, c:51, f:22, serving:'1 entree', baseG:174 },
  { id:'panda_beijing_beef',cat:'Fast Food', name:'Panda Beijing Beef',       cal:470, p:14, c:51, f:24, serving:'1 entree', baseG:167 },
  { id:'panda_broc_beef',   cat:'Fast Food', name:'Panda Broccoli Beef',      cal:150, p:9,  c:13, f:7,  serving:'1 entree', baseG:137 },

  // Fast Food — Panera
  { id:'panera_turkey_sand',cat:'Fast Food', name:'Panera Turkey Sandwich',   cal:540, p:29, c:63, f:17, serving:'1 sandwich', baseG:280 },
  { id:'panera_broc_chd',   cat:'Fast Food', name:'Panera Broccoli Cheddar Soup (cup)', cal:290, p:10, c:30, f:14, serving:'1 cup', baseG:240 },
  { id:'starbucks_frapp',   cat:'Fast Food', name:'Starbucks Mocha Frappuccino (grande)', cal:380, p:5, c:61, f:13, serving:'1 grande', baseG:473 },

  // Packaged Snacks — Chips
  { id:'lays_classic',      cat:'Snacks',  name:"Lay's Classic Chips",       cal:160, p:2,  c:15, f:10, serving:'1oz', baseG:28 },
  { id:'doritos_nacho',     cat:'Snacks',  name:'Doritos Nacho Cheese',      cal:140, p:2,  c:18, f:7,  serving:'1oz', baseG:28 },
  { id:'cheetos_crunchy',   cat:'Snacks',  name:'Cheetos Crunchy',           cal:160, p:2,  c:15, f:10, serving:'1oz', baseG:28 },
  { id:'pringles_orig',     cat:'Snacks',  name:'Pringles Original',         cal:150, p:2,  c:15, f:9,  serving:'15 chips', baseG:28 },
  { id:'fritos',            cat:'Snacks',  name:'Fritos Corn Chips',         cal:160, p:2,  c:16, f:10, serving:'1oz', baseG:28 },
  { id:'sunchips',          cat:'Snacks',  name:'SunChips',                  cal:140, p:2,  c:19, f:6,  serving:'1oz', baseG:28 },
  { id:'pirate_booty',      cat:'Snacks',  name:"Pirate's Booty",            cal:110, p:2,  c:14, f:4.5,serving:'1oz', baseG:28 },
  { id:'kettle_chips',      cat:'Snacks',  name:'Kettle Brand Chips',        cal:150, p:2,  c:16, f:8,  serving:'1oz', baseG:28 },

  // Packaged Snacks — Crackers & Cookies
  { id:'ritz',              cat:'Snacks',  name:'Ritz Crackers',             cal:80,  p:1,  c:10, f:4,  serving:'5 crackers', baseG:16 },
  { id:'wheat_thins',       cat:'Snacks',  name:'Wheat Thins',               cal:140, p:2,  c:22, f:5,  serving:'16 crackers', baseG:31 },
  { id:'goldfish',          cat:'Snacks',  name:'Goldfish Crackers',         cal:140, p:3,  c:20, f:5,  serving:'55 pieces', baseG:30 },
  { id:'triscuits',         cat:'Snacks',  name:'Triscuits',                 cal:120, p:3,  c:20, f:3.5,serving:'6 crackers', baseG:28 },
  { id:'cheez_its',         cat:'Snacks',  name:'Cheez-Its',                 cal:150, p:3,  c:17, f:8,  serving:'27 crackers', baseG:30 },
  { id:'saltines',          cat:'Snacks',  name:'Saltine Crackers',          cal:70,  p:1,  c:12, f:2,  serving:'5 crackers', baseG:15 },
  { id:'graham_crackers',   cat:'Snacks',  name:'Graham Crackers',           cal:130, p:2,  c:22, f:3,  serving:'2 sheets', baseG:28 },
  { id:'animal_crackers',   cat:'Snacks',  name:'Animal Crackers',           cal:130, p:2,  c:23, f:4,  serving:'16 pieces', baseG:30 },
  { id:'oreos',             cat:'Snacks',  name:'Oreo Cookies',              cal:160, p:2,  c:25, f:7,  serving:'3 cookies', baseG:34 },
  { id:'chips_ahoy',        cat:'Snacks',  name:'Chips Ahoy Cookies',        cal:160, p:2,  c:23, f:7,  serving:'3 cookies', baseG:30 },
  { id:'nutter_butter',     cat:'Snacks',  name:'Nutter Butter',             cal:130, p:2,  c:19, f:6,  serving:'2 cookies', baseG:28 },
  { id:'fig_newtons',       cat:'Snacks',  name:'Fig Newtons',               cal:110, p:1,  c:22, f:2,  serving:'2 cookies', baseG:31 },
  { id:'pop_tart',          cat:'Snacks',  name:'Pop-Tart (Frosted)',        cal:200, p:2,  c:38, f:5,  serving:'1 pastry', baseG:52 },

  // Cereals
  { id:'honey_nut_cheer',   cat:'Carbs',  name:'Honey Nut Cheerios',        cal:140, p:3,  c:29, f:2,  serving:'3/4 cup (28g)', baseG:28 },
  { id:'frosted_flakes',    cat:'Carbs',  name:'Frosted Flakes',            cal:130, p:2,  c:31, f:0,  serving:'3/4 cup (29g)', baseG:29 },
  { id:'lucky_charms',      cat:'Carbs',  name:'Lucky Charms',              cal:130, p:2,  c:27, f:1.5,serving:'3/4 cup (27g)', baseG:27 },
  { id:'capn_crunch',       cat:'Carbs',  name:"Cap'n Crunch",              cal:110, p:1,  c:23, f:1.5,serving:'3/4 cup (27g)', baseG:27 },
  { id:'frosted_mini_wheat',cat:'Carbs',  name:'Frosted Mini-Wheats',       cal:190, p:5,  c:45, f:1,  serving:'24 biscuits (59g)', baseG:59 },
  { id:'raisin_bran',       cat:'Carbs',  name:'Raisin Bran',               cal:190, p:5,  c:46, f:1.5,serving:'1 cup (59g)', baseG:59 },
  { id:'cinnamon_toast',    cat:'Carbs',  name:'Cinnamon Toast Crunch',     cal:170, p:2,  c:33, f:4,  serving:'3/4 cup (31g)', baseG:31 },
  { id:'special_k',         cat:'Carbs',  name:'Special K',                 cal:120, p:6,  c:23, f:0.5,serving:'1 cup (31g)', baseG:31 },
  { id:'corn_flakes',       cat:'Carbs',  name:'Corn Flakes',               cal:100, p:2,  c:24, f:0.2,serving:'1 cup (28g)', baseG:28 },
  { id:'froot_loops',       cat:'Carbs',  name:'Froot Loops',               cal:110, p:1,  c:25, f:1,  serving:'1 cup (29g)', baseG:29 },
  { id:'cocoa_puffs',       cat:'Carbs',  name:'Cocoa Puffs',               cal:100, p:1,  c:23, f:1,  serving:'3/4 cup (27g)', baseG:27 },
  { id:'life_cereal',       cat:'Carbs',  name:'Life Cereal',               cal:120, p:3,  c:25, f:1.5,serving:'3/4 cup (32g)', baseG:32 },
  { id:'grape_nuts',        cat:'Carbs',  name:'Grape-Nuts',                cal:200, p:6,  c:47, f:1,  serving:'1/2 cup (58g)', baseG:58 },
  { id:'wheaties',          cat:'Carbs',  name:'Wheaties',                  cal:110, p:3,  c:24, f:1,  serving:'3/4 cup (27g)', baseG:27 },
  { id:'kashi_golean',      cat:'Carbs',  name:'Kashi GOLEAN',              cal:170, p:13, c:36, f:1.5,serving:'1 cup (52g)', baseG:52 },

  // Condiments & Sauces
  { id:'ketchup',           cat:'Condiment', name:'Ketchup',                cal:20,  p:0,  c:5,  f:0,  serving:'1 tbsp', baseG:15 },
  { id:'yellow_mustard',    cat:'Condiment', name:'Yellow Mustard',         cal:5,   p:0,  c:0.3,f:0,  serving:'1 tsp', baseG:5 },
  { id:'mayo',              cat:'Condiment', name:'Mayonnaise',             cal:90,  p:0,  c:0,  f:10, serving:'1 tbsp', baseG:13 },
  { id:'ranch_dressing',    cat:'Condiment', name:'Ranch Dressing',         cal:73,  p:0,  c:1,  f:7.7,serving:'1 tbsp', baseG:15 },
  { id:'caesar_dressing',   cat:'Condiment', name:'Caesar Dressing',        cal:78,  p:0.7,c:0.5,f:8,  serving:'1 tbsp', baseG:15 },
  { id:'italian_dressing',  cat:'Condiment', name:'Italian Dressing',       cal:35,  p:0,  c:2,  f:3,  serving:'1 tbsp', baseG:15 },
  { id:'balsamic_vin',      cat:'Condiment', name:'Balsamic Vinaigrette',   cal:45,  p:0,  c:3,  f:4,  serving:'1 tbsp', baseG:14 },
  { id:'thousand_island',   cat:'Condiment', name:'Thousand Island Dressing',cal:59, p:0,  c:3,  f:5,  serving:'1 tbsp', baseG:16 },
  { id:'bbq_sauce',         cat:'Condiment', name:'BBQ Sauce',              cal:30,  p:0,  c:7,  f:0,  serving:'2 tbsp', baseG:36 },
  { id:'hot_sauce',         cat:'Condiment', name:'Hot Sauce (Tabasco/Frank\'s)', cal:0, p:0, c:0, f:0, serving:'1 tsp', baseG:5 },
  { id:'sriracha',          cat:'Condiment', name:'Sriracha',               cal:5,   p:0,  c:1,  f:0,  serving:'1 tsp', baseG:7 },
  { id:'soy_sauce',         cat:'Condiment', name:'Soy Sauce',              cal:9,   p:1.3,c:0.8,f:0,  serving:'1 tbsp', baseG:16 },
  { id:'teriyaki_sauce',    cat:'Condiment', name:'Teriyaki Sauce',         cal:30,  p:0,  c:7,  f:0,  serving:'1 tbsp', baseG:18 },
  { id:'honey_tbsp',        cat:'Condiment', name:'Honey',                  cal:60,  p:0,  c:17, f:0,  serving:'1 tbsp', baseG:21 },
  { id:'maple_syrup',       cat:'Condiment', name:'Maple Syrup',            cal:52,  p:0,  c:13, f:0,  serving:'1 tbsp', baseG:20 },
  { id:'strawberry_jam',    cat:'Condiment', name:'Strawberry Jam',         cal:50,  p:0,  c:13, f:0,  serving:'1 tbsp', baseG:20 },
  { id:'salsa',             cat:'Condiment', name:'Salsa',                  cal:10,  p:0,  c:2,  f:0,  serving:'2 tbsp', baseG:32 },
  { id:'guac_fresh',        cat:'Condiment', name:'Guacamole',              cal:45,  p:0.5,c:3,  f:4,  serving:'2 tbsp', baseG:30 },
  { id:'sour_cream',        cat:'Condiment', name:'Sour Cream',             cal:60,  p:0.9,c:1.3,f:5.8,serving:'2 tbsp', baseG:29 },
  { id:'nutella',           cat:'Condiment', name:'Nutella',                cal:100, p:1,  c:11, f:6,  serving:'1 tbsp', baseG:19 },
  { id:'whipped_butter',    cat:'Condiment', name:'Whipped Butter',         cal:50,  p:0,  c:0,  f:5.5,serving:'1 tbsp', baseG:12 },

  // Frozen / Convenience Foods
  { id:'hot_pocket',        cat:'Prepared', name:'Hot Pocket Ham & Cheese', cal:290, p:12, c:39, f:10, serving:'1 pocket', baseG:127 },
  { id:'lean_cuisine',      cat:'Prepared', name:'Lean Cuisine (Chicken)',  cal:280, p:19, c:38, f:6,  serving:'1 meal', baseG:255 },
  { id:'healthy_choice',    cat:'Prepared', name:'Healthy Choice Power Bowl',cal:360,p:20, c:52, f:7,  serving:'1 bowl', baseG:310 },
  { id:'eggo_waffles',      cat:'Prepared', name:'Eggo Waffles (2)',        cal:190, p:4,  c:30, f:6,  serving:'2 waffles', baseG:70 },
  { id:'tater_tots_10',     cat:'Prepared', name:'Tater Tots (10 pieces)',  cal:200, p:2,  c:28, f:9,  serving:'10 pieces', baseG:85 },
  { id:'fish_sticks_4',     cat:'Prepared', name:'Fish Sticks (4 pieces)',  cal:200, p:11, c:21, f:8,  serving:'4 pieces', baseG:112 },
  { id:'corn_dog',          cat:'Prepared', name:'Corn Dog',                cal:250, p:8,  c:26, f:12, serving:'1 corn dog', baseG:90 },
  { id:'instant_ramen',     cat:'Prepared', name:'Instant Ramen (1 pkg)',   cal:380, p:9,  c:52, f:15, serving:'1 package', baseG:85 },
  { id:'kraft_mac_cup',     cat:'Prepared', name:'Kraft Mac & Cheese Cup',  cal:220, p:7,  c:40, f:4,  serving:'1 cup prepared', baseG:240 },
  { id:'pizza_rolls_6',     cat:'Prepared', name:'Totino\'s Pizza Rolls (6)', cal:200, p:7, c:24, f:8, serving:'6 rolls', baseG:85 },
  { id:'mozzarella_sticks', cat:'Prepared', name:'Mozzarella Sticks (3)',   cal:270, p:13, c:21, f:14, serving:'3 sticks', baseG:90 },
  { id:'frozen_burrito',    cat:'Prepared', name:'Frozen Bean & Rice Burrito', cal:340, p:10, c:57, f:8, serving:'1 burrito', baseG:170 },
  { id:'digiorno_slice',    cat:'Prepared', name:"DiGiorno Rising Crust (slice)", cal:310, p:14, c:40, f:10, serving:'1 slice', baseG:120 },

  // Desserts & Sweets
  { id:'ice_cream_vanilla', cat:'Sweets',  name:'Vanilla Ice Cream',        cal:137, p:2.3,c:16, f:7.2,serving:'1/2 cup', baseG:66 },
  { id:'ice_cream_choc',    cat:'Sweets',  name:'Chocolate Ice Cream',      cal:143, p:2.5,c:18, f:7,  serving:'1/2 cup', baseG:66 },
  { id:'soft_serve',        cat:'Sweets',  name:'Soft Serve (Vanilla Cone)',cal:108, p:2.5,c:18, f:3.3,serving:'1 small cone', baseG:88 },
  { id:'glazed_donut',      cat:'Sweets',  name:'Glazed Donut',             cal:269, p:4,  c:31, f:15, serving:'1 donut', baseG:60 },
  { id:'krispy_kreme',      cat:'Sweets',  name:'Krispy Kreme Original',    cal:190, p:2,  c:22, f:11, serving:'1 donut', baseG:52 },
  { id:'blueberry_muffin',  cat:'Sweets',  name:'Blueberry Muffin (large)', cal:340, p:5,  c:52, f:12, serving:'1 muffin', baseG:130 },
  { id:'choc_chip_cookie',  cat:'Sweets',  name:'Chocolate Chip Cookie',    cal:148, p:1.7,c:20, f:7.4,serving:'1 cookie', baseG:35 },
  { id:'brownie',           cat:'Sweets',  name:'Brownie',                  cal:130, p:1.5,c:22, f:5,  serving:'1 piece', baseG:40 },
  { id:'cheesecake_slice',  cat:'Sweets',  name:'Cheesecake Slice',         cal:401, p:6.9,c:30, f:28, serving:'1 slice', baseG:125 },
  { id:'apple_pie_slice',   cat:'Sweets',  name:'Apple Pie Slice',          cal:296, p:2.8,c:42, f:13, serving:'1 slice', baseG:117 },
  { id:'cinnamon_roll',     cat:'Sweets',  name:'Cinnamon Roll',            cal:310, p:5,  c:47, f:11, serving:'1 roll', baseG:95 },
  { id:'banana_bread',      cat:'Sweets',  name:'Banana Bread (slice)',     cal:196, p:2.6,c:33, f:6.3,serving:'1 slice', baseG:60 },
  { id:'snickers',          cat:'Sweets',  name:'Snickers Bar',             cal:280, p:4,  c:35, f:14, serving:'1 bar', baseG:57 },
  { id:'reeses',            cat:'Sweets',  name:"Reese's PB Cups (2)",      cal:210, p:5,  c:24, f:13, serving:'2 cups', baseG:42 },
  { id:'kit_kat',           cat:'Sweets',  name:'Kit Kat',                  cal:218, p:3,  c:27, f:11, serving:'1 bar', baseG:42 },
  { id:'twix',              cat:'Sweets',  name:'Twix Bar',                 cal:286, p:3,  c:37, f:14, serving:'1 bar', baseG:57 },
  { id:'mm_milk_choc',      cat:'Sweets',  name:'M&Ms (Milk Chocolate)',    cal:140, p:1,  c:18, f:6,  serving:'1oz', baseG:28 },
  { id:'skittles',          cat:'Sweets',  name:'Skittles',                 cal:110, p:0,  c:25, f:1.2,serving:'1oz', baseG:28 },
  { id:'gummy_bears',       cat:'Sweets',  name:'Gummy Bears',              cal:110, p:2,  c:22, f:0,  serving:'1oz', baseG:28 },

  // Beverages — Sodas & Energy
  { id:'coca_cola_can',     cat:'Drinks',  name:'Coca-Cola (12oz)',         cal:140, p:0,  c:39, f:0,  serving:'1 can', baseG:355 },
  { id:'pepsi_can',         cat:'Drinks',  name:'Pepsi (12oz)',             cal:150, p:0,  c:41, f:0,  serving:'1 can', baseG:355 },
  { id:'sprite_can',        cat:'Drinks',  name:'Sprite (12oz)',            cal:140, p:0,  c:38, f:0,  serving:'1 can', baseG:355 },
  { id:'mtn_dew_can',       cat:'Drinks',  name:'Mountain Dew (12oz)',      cal:170, p:0,  c:46, f:0,  serving:'1 can', baseG:355 },
  { id:'dr_pepper_can',     cat:'Drinks',  name:'Dr. Pepper (12oz)',        cal:150, p:0,  c:40, f:0,  serving:'1 can', baseG:355 },
  { id:'red_bull',          cat:'Drinks',  name:'Red Bull (8.4oz)',         cal:110, p:1,  c:28, f:0,  serving:'1 can', baseG:250 },
  { id:'monster_energy',    cat:'Drinks',  name:'Monster Energy (16oz)',    cal:210, p:2,  c:55, f:0,  serving:'1 can', baseG:480 },
  { id:'sweet_iced_tea',    cat:'Drinks',  name:'Sweet Iced Tea',           cal:90,  p:0,  c:23, f:0,  serving:'1 cup', baseG:240 },
  { id:'lemonade',          cat:'Drinks',  name:'Lemonade',                 cal:99,  p:0,  c:26, f:0,  serving:'1 cup', baseG:240 },
  { id:'kombucha',          cat:'Drinks',  name:'Kombucha',                 cal:30,  p:0,  c:7,  f:0,  serving:'1 cup', baseG:240 },
  { id:'cold_brew',         cat:'Drinks',  name:'Cold Brew Coffee',         cal:5,   p:0.3,c:0,  f:0,  serving:'1 cup', baseG:240 },
  { id:'beer_regular',      cat:'Drinks',  name:'Beer (Regular, 12oz)',     cal:153, p:1.3,c:13, f:0,  serving:'12oz', baseG:355 },
  { id:'beer_light',        cat:'Drinks',  name:'Beer (Light, 12oz)',       cal:103, p:0.9,c:6,  f:0,  serving:'12oz', baseG:355 },
  { id:'red_wine',          cat:'Drinks',  name:'Red Wine (5oz)',           cal:125, p:0.1,c:3.8,f:0,  serving:'5oz glass', baseG:150 },
  { id:'white_wine',        cat:'Drinks',  name:'White Wine (5oz)',         cal:121, p:0.1,c:4,  f:0,  serving:'5oz glass', baseG:150 },
  { id:'margarita',         cat:'Drinks',  name:'Margarita',                cal:168, p:0,  c:13, f:0,  serving:'1 cocktail', baseG:150 },

  // More Protein — Processed & Canned
  { id:'spam',              cat:'Protein', name:'SPAM Classic',             cal:174, p:7,  c:1,  f:16, serving:'2oz', baseG:56 },
  { id:'canned_chicken',    cat:'Protein', name:'Canned Chicken',           cal:90,  p:19, c:0,  f:1,  serving:'3oz', baseG:85 },
  { id:'beef_hot_dog',      cat:'Protein', name:'Beef Hot Dog',             cal:150, p:5,  c:3,  f:14, serving:'1 frank', baseG:57 },
  { id:'turkey_hot_dog',    cat:'Protein', name:'Turkey Hot Dog',           cal:100, p:7,  c:2,  f:7,  serving:'1 frank', baseG:57 },
  { id:'italian_sausage',   cat:'Protein', name:'Italian Sausage (link)',   cal:230, p:15, c:2,  f:19, serving:'1 link', baseG:85 },
  { id:'bratwurst',         cat:'Protein', name:'Bratwurst',                cal:280, p:12, c:2,  f:25, serving:'1 link', baseG:85 },
  { id:'kielbasa',          cat:'Protein', name:'Kielbasa',                 cal:330, p:15, c:1,  f:29, serving:'1 link (3.5oz)', baseG:99 },
  { id:'veggie_burger',     cat:'Protein', name:'Beyond Burger',            cal:270, p:20, c:5,  f:20, serving:'1 patty', baseG:113 },

  // More Dairy
  { id:'american_cheese',   cat:'Dairy',   name:'American Cheese (slice)',  cal:60,  p:3,  c:1,  f:5,  serving:'1 slice', baseG:19 },
  { id:'swiss_cheese',      cat:'Dairy',   name:'Swiss Cheese',             cal:108, p:8,  c:0.4,f:8,  serving:'1oz', baseG:28 },
  { id:'provolone',         cat:'Dairy',   name:'Provolone',                cal:98,  p:7.2,c:0.6,f:7.5,serving:'1oz', baseG:28 },
  { id:'colby_jack',        cat:'Dairy',   name:'Colby Jack',               cal:109, p:6.7,c:0.4,f:9,  serving:'1oz', baseG:28 },
  { id:'monterey_jack',     cat:'Dairy',   name:'Monterey Jack',            cal:105, p:6.9,c:0.2,f:8.6,serving:'1oz', baseG:28 },
  { id:'half_and_half',     cat:'Dairy',   name:'Half and Half',            cal:20,  p:0.4,c:0.6,f:1.7,serving:'1 tbsp', baseG:15 },
  { id:'whipped_cream',     cat:'Dairy',   name:'Whipped Cream',            cal:20,  p:0.2,c:1.4,f:1.7,serving:'2 tbsp', baseG:9 },

  // More Bread & Baked Goods
  { id:'sourdough_bread',   cat:'Carbs',   name:'Sourdough Bread',          cal:84,  p:3.2,c:16, f:0.7,serving:'1 slice', baseG:28 },
  { id:'rye_bread',         cat:'Carbs',   name:'Rye Bread',                cal:83,  p:2.7,c:15, f:1.1,serving:'1 slice', baseG:32 },
  { id:'ciabatta_roll',     cat:'Carbs',   name:'Ciabatta Roll',            cal:130, p:4,  c:26, f:1,  serving:'1 roll', baseG:50 },
  { id:'hawaiian_roll',     cat:'Carbs',   name:"King's Hawaiian Roll",     cal:80,  p:2.5,c:14, f:2,  serving:'1 roll', baseG:28 },
  { id:'dinner_roll',       cat:'Carbs',   name:'Dinner Roll',              cal:84,  p:2.5,c:14, f:2,  serving:'1 roll', baseG:28 },
  { id:'biscuit',           cat:'Carbs',   name:'Biscuit (Buttermilk)',     cal:212, p:3.4,c:26, f:10, serving:'1 medium', baseG:60 },
  { id:'cornbread',         cat:'Carbs',   name:'Cornbread',                cal:173, p:3,  c:28, f:5,  serving:'1 piece', baseG:60 },
  { id:'crescent_roll',     cat:'Carbs',   name:'Crescent Roll (Pillsbury)',cal:100, p:2,  c:11, f:5,  serving:'1 roll', baseG:28 },
  { id:'naan',              cat:'Carbs',   name:'Naan Bread',               cal:262, p:9,  c:45, f:5,  serving:'1 piece', baseG:90 },
  { id:'soft_pretzel',      cat:'Carbs',   name:'Soft Pretzel (large)',     cal:380, p:11, c:83, f:2,  serving:'1 large', baseG:180 },
  { id:'flatbread',         cat:'Carbs',   name:'Flatbread',                cal:90,  p:3,  c:15, f:2,  serving:'1 piece', baseG:42 },
  { id:'focaccia',          cat:'Carbs',   name:'Focaccia',                 cal:180, p:5,  c:28, f:6,  serving:'1 piece', baseG:70 },

  // More Produce — Vegetables
  { id:'iceberg_lettuce',   cat:'Veggie',  name:'Iceberg Lettuce',          cal:14,  p:0.9,c:3,  f:0.1,serving:'100g' },
  { id:'red_bell_pepper',   cat:'Veggie',  name:'Red Bell Pepper',          cal:31,  p:1,  c:6,  f:0.3,serving:'100g' },
  { id:'jalapeno',          cat:'Veggie',  name:'Jalapeño',                 cal:29,  p:0.9,c:6.5,f:0.4,serving:'100g' },
  { id:'cherry_tomatoes',   cat:'Veggie',  name:'Cherry Tomatoes',          cal:18,  p:0.9,c:3.9,f:0.2,serving:'100g' },
  { id:'butternut_squash',  cat:'Veggie',  name:'Butternut Squash',         cal:45,  p:1,  c:12, f:0.1,serving:'100g' },
  { id:'acorn_squash',      cat:'Veggie',  name:'Acorn Squash',             cal:56,  p:1.1,c:15, f:0.1,serving:'100g' },
  { id:'collard_greens',    cat:'Veggie',  name:'Collard Greens (Cooked)',  cal:33,  p:3,  c:6,  f:0.6,serving:'100g' },
  { id:'swiss_chard',       cat:'Veggie',  name:'Swiss Chard',              cal:19,  p:1.8,c:3.7,f:0.2,serving:'100g' },
  { id:'tomatillo',         cat:'Veggie',  name:'Tomatillo',                cal:32,  p:1,  c:5.8,f:1,  serving:'100g' },
  { id:'radish',            cat:'Veggie',  name:'Radish',                   cal:16,  p:0.7,c:3.4,f:0.1,serving:'100g' },
  { id:'turnip',            cat:'Veggie',  name:'Turnip',                   cal:28,  p:0.9,c:6.4,f:0.1,serving:'100g' },
  { id:'sun_dried_tomato',  cat:'Veggie',  name:'Sun-Dried Tomatoes',       cal:258, p:14, c:56, f:3,  serving:'100g' },
  { id:'jicama',            cat:'Veggie',  name:'Jicama',                   cal:38,  p:0.7,c:9,  f:0.1,serving:'100g' },
  { id:'endive',            cat:'Veggie',  name:'Endive',                   cal:17,  p:1.3,c:3.4,f:0.2,serving:'100g' },

  // More Produce — Fruits
  { id:'cantaloupe',        cat:'Fruit',   name:'Cantaloupe',               cal:34,  p:0.8,c:8,  f:0.2,serving:'100g' },
  { id:'honeydew',          cat:'Fruit',   name:'Honeydew',                 cal:36,  p:0.5,c:9.1,f:0.1,serving:'100g' },
  { id:'plum',              cat:'Fruit',   name:'Plum',                     cal:46,  p:0.7,c:11, f:0.3,serving:'1 medium', baseG:66 },
  { id:'nectarine',         cat:'Fruit',   name:'Nectarine',                cal:62,  p:1.5,c:15, f:0.5,serving:'1 medium', baseG:142 },
  { id:'apricot',           cat:'Fruit',   name:'Apricot',                  cal:17,  p:0.5,c:3.9,f:0.1,serving:'1 fruit', baseG:35 },
  { id:'coconut_fresh',     cat:'Fruit',   name:'Coconut (Fresh)',          cal:354, p:3.3,c:15, f:33, serving:'100g' },
  { id:'avocado_whole',     cat:'Fruit',   name:'Avocado (Whole)',          cal:234, p:2.9,c:12, f:21, serving:'1 whole', baseG:136 },
  { id:'fig_fresh',         cat:'Fruit',   name:'Fig (Fresh)',              cal:37,  p:0.4,c:10, f:0.1,serving:'1 medium', baseG:40 },
  { id:'lemon',             cat:'Fruit',   name:'Lemon',                    cal:17,  p:0.6,c:5.4,f:0.2,serving:'1 medium', baseG:58 },

  // More Prepared Meals
  { id:'mashed_potatoes',   cat:'Prepared',name:'Mashed Potatoes',          cal:237, p:4,  c:35, f:9,  serving:'1 cup', baseG:210 },
  { id:'mac_cheese_home',   cat:'Prepared',name:'Mac & Cheese (homemade)',  cal:390, p:15, c:41, f:18, serving:'1 cup', baseG:200 },
  { id:'fried_rice_takeout',cat:'Prepared',name:'Fried Rice (takeout)',     cal:290, p:7,  c:53, f:5,  serving:'1 cup', baseG:195 },
  { id:'lasagna',           cat:'Prepared',name:'Lasagna',                  cal:320, p:18, c:38, f:9,  serving:'1 serving', baseG:225 },
  { id:'chicken_pot_pie',   cat:'Prepared',name:'Chicken Pot Pie',          cal:410, p:14, c:46, f:18, serving:'1 serving', baseG:230 },
  { id:'clam_chowder',      cat:'Prepared',name:'Clam Chowder (New England)',cal:190,p:8,  c:19, f:9,  serving:'1 cup', baseG:240 },
  { id:'tomato_soup',       cat:'Prepared',name:'Tomato Soup',              cal:90,  p:2,  c:16, f:2,  serving:'1 cup', baseG:240 },
  { id:'lentil_soup',       cat:'Prepared',name:'Lentil Soup',              cal:230, p:14, c:40, f:2,  serving:'1 cup', baseG:240 },
  { id:'cobb_salad',        cat:'Prepared',name:'Cobb Salad',               cal:460, p:32, c:12, f:33, serving:'1 full salad', baseG:350 },
  { id:'taco_salad',        cat:'Prepared',name:'Taco Salad',               cal:330, p:20, c:22, f:18, serving:'1 serving', baseG:300 },
  { id:'grilled_cheese',    cat:'Prepared',name:'Grilled Cheese Sandwich',  cal:380, p:14, c:38, f:18, serving:'1 sandwich', baseG:140 },
  { id:'pbj_sandwich',      cat:'Prepared',name:'PB&J Sandwich',            cal:390, p:13, c:49, f:17, serving:'1 sandwich', baseG:130 },
  { id:'blt_sandwich',      cat:'Prepared',name:'BLT Sandwich',             cal:330, p:12, c:34, f:16, serving:'1 sandwich', baseG:180 },
  { id:'club_sandwich',     cat:'Prepared',name:'Club Sandwich',            cal:540, p:32, c:44, f:23, serving:'1 sandwich', baseG:310 },
  { id:'chk_caesar_wrap',   cat:'Prepared',name:'Chicken Caesar Wrap',      cal:420, p:28, c:38, f:16, serving:'1 wrap', baseG:260 },
  { id:'egg_salad_sand',    cat:'Prepared',name:'Egg Salad Sandwich',       cal:360, p:14, c:32, f:19, serving:'1 sandwich', baseG:200 },
  { id:'stuffing',          cat:'Prepared',name:'Stuffing (Stovetop)',       cal:180, p:4,  c:25, f:6,  serving:'1/2 cup', baseG:107 },
  { id:'nachos',            cat:'Prepared',name:'Nachos (Restaurant)',       cal:750, p:30, c:65, f:40, serving:'1 serving', baseG:400 },
];

/* ── WEIGHT HELPERS ──────────────────────────────────────────── */
const _OZ_TO_G  = 28.3495;
const _LB_TO_G  = 453.592;

function _getBaseG(food) {
  if (food.baseG) return food.baseG;
  const s = food.serving || '';
  const gMatch = s.match(/(\d+(?:\.\d+)?)\s*g\b/);
  if (gMatch) return parseFloat(gMatch[1]);
  const mlMatch = s.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  if (mlMatch) return parseFloat(mlMatch[1]);
  return null;
}

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
  let cal = 0, p = 0, c = 0, f = 0, fiber = 0, sodium = 0, sugar = 0;
  ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(meal => {
    (diary[meal] || []).forEach(item => {
      const q = item.qty || 1;
      cal    += (item.cal    || 0) * q;
      p      += (item.p      || 0) * q;
      c      += (item.c      || 0) * q;
      f      += (item.f      || 0) * q;
      fiber  += (item.fiber  || 0) * q;
      sodium += (item.sodium || 0) * q;
      sugar  += (item.sugar  || 0) * q;
    });
  });
  return {
    cal:    Math.round(cal),
    p:      Math.round(p      * 10) / 10,
    c:      Math.round(c      * 10) / 10,
    f:      Math.round(f      * 10) / 10,
    fiber:  Math.round(fiber  * 10) / 10,
    sodium: Math.round(sodium),
    sugar:  Math.round(sugar  * 10) / 10,
  };
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

/* ── SHARED FOOD DATABASE (Supabase-backed, barcode-keyed) ───── */
function getSharedFoodsCache()        { return getLS('shared_foods_cache', []); }
function saveSharedFoodsCache(foods)  { localStorage.setItem('shared_foods_cache', JSON.stringify(foods)); }

async function _loadSharedFoods() {
  if (!window._networkOk?.()) return;
  const data = await sbSelect('shared_foods', 'select=*');
  if (!Array.isArray(data) || !data.length) return;
  const mapped = data.map(r => ({
    id: r.id, code: r.code || '', cat: 'Shared',
    name: r.name, brand: r.brand || '',
    serving: r.serving || '1 serving', baseG: r.base_g || null,
    cal: r.cal || 0, p: r.p || 0, c: r.c || 0, f: r.f || 0,
    fiber: r.fiber || 0, sodium: r.sodium || 0,
  }));
  saveSharedFoodsCache(mapped);
}

async function _saveSharedFood(food) {
  if (!food || !food.name) return;
  const id  = food.code ? 'barcode_' + food.code : 'shared_' + (food.id || Date.now());
  const row = {
    id,
    code:    food.code    || null,
    name:    food.name,
    brand:   food.brand   || null,
    serving: food.serving || '1 serving',
    base_g:  food.baseG   || null,
    cal: food.cal || 0, p: food.p || 0, c: food.c || 0, f: food.f || 0,
    fiber:   food.fiber   || 0,
    sodium:  food.sodium  || 0,
  };
  const cached = { ...row, id, cat: 'Shared', baseG: row.base_g };
  delete cached.base_g;
  const list = getSharedFoodsCache();
  const idx  = list.findIndex(f => f.id === id);
  if (idx >= 0) list[idx] = cached; else list.push(cached);
  saveSharedFoodsCache(list);
  sbUpsert('shared_foods', row).catch(() => {});
}

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
  const R       = 36;
  const circ    = +(2 * Math.PI * R).toFixed(2);
  const rawPct  = target > 0 ? val / target : 0;
  // Ring fills past 100% by overlapping in a slightly darker shade; visual cap at 130%.
  const fillPct = Math.min(1, rawPct);
  const off     = +(circ * (1 - fillPct)).toFixed(2);
  const disp    = val >= 1000 ? (val / 1000).toFixed(1) + 'k' : String(Math.round(val));
  const pctLbl  = target > 0 ? Math.round(rawPct * 100) + '%' : '—';
  // Status threshold flags drive the pulse animation + corner badge
  const isHit   = target > 0 && rawPct >= 0.95 && rawPct <= 1.05;
  const isOver  = target > 0 && rawPct > 1.05;
  const cls = ['nutr-ring-cell', isHit && 'is-hit', isOver && 'is-over'].filter(Boolean).join(' ');
  const statusTxt = isOver ? 'OVER' : isHit ? 'HIT' : '';
  return `<div class="${cls}" data-act="openNutrRingDetail" data-args="${esc(label)}" role="button" tabindex="0" aria-label="${esc(label)} ${Math.round(val)} of ${target} ${esc(unit)}">
    <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
      <circle class="nutr-ring-track" cx="42" cy="42" r="${R}" fill="none" stroke="var(--surface2)" stroke-width="7"/>
      <circle class="nutr-ring-progress" cx="42" cy="42" r="${R}" fill="none" stroke="${color}" stroke-width="7"
        stroke-dasharray="${circ}" stroke-dashoffset="${off}"
        stroke-linecap="round" transform="rotate(-90 42 42)" style="color:${color}"/>
      <text x="42" y="40" text-anchor="middle" dominant-baseline="middle"
        font-family="var(--display)" font-size="16" fill="${color}">${esc(disp)}</text>
      <text x="42" y="55" text-anchor="middle" dominant-baseline="middle"
        font-family="'Geist Mono',monospace" font-size="7" fill="var(--muted)">${esc(unit)}</text>
    </svg>
    <div class="nutr-ring-label">${esc(label)}</div>
    <div class="nutr-ring-pct" style="color:${color}">${esc(pctLbl)}</div>
    ${statusTxt ? `<span class="nutr-ring-status">${statusTxt}</span>` : ''}
  </div>`;
}

/* ── Tap a ring → show macro detail popup ─────────────────────── */
function openNutrRingDetail(label) {
  const cid    = AppState.currentClient?.id;
  if (!cid) return;
  const date   = AppState.nutrDate;
  const diary  = getNutrDiary(cid, date);
  const totals = calcDiaryTotals(diary);
  const c      = AppState.currentClient;
  const accent = c.accent || 'var(--accent)';

  // Pull the per-meal breakdown for the field this label represents
  const key = /protein/i.test(label) ? 'p'
            : /carb/i.test(label)    ? 'c'
            : /fat/i.test(label)     ? 'f'
            : 'cal';
  const unit = key === 'cal' ? 'kcal' : 'g';
  const meals = [
    { k: 'breakfast', lbl: 'Breakfast', icon: '🌅' },
    { k: 'lunch',     lbl: 'Lunch',     icon: '☀️' },
    { k: 'dinner',    lbl: 'Dinner',    icon: '🌙' },
    { k: 'snacks',    lbl: 'Snacks',    icon: '🍎' },
  ];
  const total = totals[key] || 0;
  const rows = meals.map(m => {
    const items = diary[m.k] || [];
    const sum = items.reduce((s, it) => s + (it[key] || 0) * (it.qty || 1), 0);
    const pct = total > 0 ? Math.round(sum / total * 100) : 0;
    return `<div class="nrd-row">
      <span class="nrd-meal"><span class="nrd-icon">${m.icon}</span>${m.lbl}</span>
      <div class="nrd-bar"><div class="nrd-fill" style="width:${pct}%;background:${accent}"></div></div>
      <span class="nrd-val">${Math.round(sum)}${unit}</span>
    </div>`;
  }).join('');

  document.getElementById('nutrRingDetail')?.remove();
  const modal = document.createElement('div');
  modal.id = 'nutrRingDetail';
  modal.className = 'app-overlay app-overlay--center';
  modal.style.zIndex = '4500';
  modal.dataset.act = 'closeNutrRingDetail';
  modal.dataset.actSelf = '1';
  modal.innerHTML = `<div class="nrd-sheet">
    <div class="nrd-header">
      <div>
        <div class="nrd-eyebrow">${date === new Date().toISOString().slice(0,10) ? 'Today' : esc(date)}</div>
        <div class="nrd-title" style="color:${accent}">${esc(label)} Breakdown</div>
      </div>
      <button class="nrd-close" data-act="closeNutrRingDetail" aria-label="Close">✕</button>
    </div>
    <div class="nrd-total">
      <span class="nrd-total-val" style="color:${accent}">${Math.round(total)}<span class="nrd-total-unit">${unit}</span></span>
      <span class="nrd-total-lbl">total today</span>
    </div>
    <div class="nrd-rows">${rows}</div>
  </div>`;
  document.body.appendChild(modal);
  if (typeof haptic === 'function') haptic('light');
}
function closeNutrRingDetail() {
  document.getElementById('nutrRingDetail')?.remove();
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
  return `<div class="nutr-water-section" id="nutr-water-section">
    <div class="nutr-water-header">
      <span class="nutr-water-title">Water Intake</span>
      <span class="nutr-water-count" style="color:${accent}">${glasses} / ${GOAL} glasses</span>
    </div>
    <div class="nutr-water-dots">${dots}</div>
    ${glasses >= GOAL ? `<div style="font-family:'Geist Mono',monospace;font-size:9px;color:#2ecc71;letter-spacing:1px;margin-top:6px">Daily goal reached</div>` : ''}
  </div>`;
}

/* ── MEAL SECTION ────────────────────────────────────────────── */
const _MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍎' };

function _nutrMealSection(cid, meal, label, items, accent, date) {
  const mealCal    = items.reduce((s, i) => s + (i.cal || 0) * (i.qty || 1), 0);
  const mealP      = items.reduce((s, i) => s + (i.p   || 0) * (i.qty || 1), 0);
  const mealTarget = (getMealTargets(cid))[meal] || 0;

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

  const mealPct    = mealTarget > 0 ? Math.min(100, Math.round((mealCal / mealTarget) * 100)) : null;
  const totalsHtml = mealCal > 0
    ? `<span style="color:${accent}">${Math.round(mealCal)} kcal</span>${mealP > 0 ? ` · <span style="color:#ff9f7a">${Math.round(mealP)}g P</span>` : ''}${mealTarget > 0 ? ` <span class="nutr-meal-target-badge">${mealPct}% of ${mealTarget}</span>` : ''}`
    : `<span style="color:var(--faint)">—</span>${mealTarget > 0 ? ` <span class="nutr-meal-target-badge">Goal: ${mealTarget} kcal</span>` : ''}`;

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
      <div class="nutr-meal-totals" style="font-family:'Geist Mono',monospace;font-size:10px">${totalsHtml}</div>
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
  const mode = AppState._nutrHistoryMode || 'cal'; // 'cal'|'p'|'c'|'f'
  const logs  = getCalorieIntakeLogs(cid);
  const today = new Date().toISOString().slice(0, 10);
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key   = d.toISOString().slice(0, 10);
    const entry = logs.find(l => l.date === key);
    last7.push({ key, label: d.toLocaleDateString('en', { weekday: 'short' }), cal: entry?.calories || 0, p: entry?.protein || 0, c: entry?.carbs || 0, f: entry?.fat || 0 });
  }

  const valOf = d => mode === 'p' ? d.p : mode === 'c' ? d.c : mode === 'f' ? d.f : d.cal;
  const vals  = last7.map(valOf);
  const maxV  = Math.max(...vals, mode === 'cal' ? (calTarget || 1) : 1);
  const daysHit = mode === 'cal' ? last7.filter(d => d.cal > 0 && calTarget > 0 && d.cal >= calTarget * 0.9).length : 0;
  const modeColor = mode === 'p' ? '#ff9f7a' : mode === 'c' ? '#3B9EFF' : mode === 'f' ? '#7adfff' : accent;

  const bars = last7.map(d => {
    const v        = valOf(d);
    const pct      = Math.min(100, maxV > 0 ? Math.round((v / maxV) * 100) : 0);
    const isToday  = d.key === today;
    const hit      = mode === 'cal' && calTarget > 0 && d.cal >= calTarget * 0.9;
    const barColor = v === 0 ? 'var(--border)' : hit ? '#2ecc71' : modeColor;
    const lbl      = v > 0 ? (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : String(Math.round(v))) : '';
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;cursor:pointer" onclick="setNutrDate('${esc(cid)}','${esc(d.key)}')">
      <div style="font-family:'Geist Mono',monospace;font-size:7px;color:var(--muted)">${lbl}</div>
      <div style="width:100%;background:var(--surface2);border-radius:3px;height:40px;display:flex;align-items:flex-end;overflow:hidden">
        <div style="width:100%;height:${pct}%;background:${barColor};border-radius:3px 3px 0 0;transition:height .3s"></div>
      </div>
      <div style="font-family:'Geist Mono',monospace;font-size:7px;color:${isToday ? accent : 'var(--muted)'};font-weight:${isToday ? '700' : '400'}">${esc(d.label)}</div>
    </div>`;
  }).join('');

  const modeBtns = [['cal','Kcal',accent],['p','Protein','#ff9f7a'],['c','Carbs','#3B9EFF'],['f','Fat','#7adfff']].map(([m, lbl, col]) =>
    `<button onclick="AppState._nutrHistoryMode='${m}';const c=(getAllClients().find(x=>x.id==='${esc(cid)}')||AppState.currentClient);if(c){const el=document.getElementById('panel-nutrition');if(el)el.innerHTML=renderNutritionTracker(c);}" style="padding:3px 8px;border-radius:4px;border:1px solid ${mode===m?col:' var(--border)'};background:${mode===m?col+'22':'none'};color:${mode===m?col:'var(--muted)'};font-family:'Geist Mono',monospace;font-size:8px;letter-spacing:.5px;cursor:pointer">${lbl}</button>`
  ).join('');

  return `<div class="card" style="margin-bottom:12px">
    <div class="card-block">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="block-label">7-Day History${daysHit > 0 ? ` · <span style="color:#2ecc71;text-transform:none">${daysHit}/7 on target</span>` : ''}</div>
        <div style="display:flex;gap:4px">${modeBtns}</div>
      </div>
      <div style="display:flex;gap:5px;align-items:flex-end">${bars}</div>
      ${mode === 'cal' && calTarget ? `<div style="display:flex;align-items:center;gap:6px;margin-top:10px"><div style="width:10px;height:3px;background:#2ecc71;border-radius:2px"></div><div style="font-family:'Geist Mono',monospace;font-size:8px;color:var(--muted)">≥90% of ${calTarget} kcal</div></div>` : ''}
    </div>
  </div>`;
}

/* ── MEAL TARGETS (per-meal calorie goal) ────────────────────── */
function getMealTargets(cid) {
  return getLS('nutr_meal_targets_' + cid, { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 });
}
function saveMealTargets(cid, t) {
  localStorage.setItem('nutr_meal_targets_' + cid, JSON.stringify(t));
}
function openMealTargetModal(cid) {
  document.getElementById('nutrMealTargetModal')?.remove();
  const t = getMealTargets(cid);
  const modal = document.createElement('div');
  modal.id = 'nutrMealTargetModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:4200;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  modal.innerHTML = `<div style="background:var(--surface);border-radius:14px;padding:24px 20px;width:100%;max-width:340px">
    <div style="font-family:var(--display);font-weight:700;font-size:22px;letter-spacing:1px;margin-bottom:4px">Meal Targets</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:18px">Set per-meal calorie goals (0 = no target).</div>
    ${['breakfast','lunch','dinner','snacks'].map(m => `
    <div class="ob-field" style="margin-bottom:10px">
      <label class="ob-label">${m[0].toUpperCase()+m.slice(1)}</label>
      <input class="ob-input" id="mt-${m}" type="number" inputmode="numeric" placeholder="e.g. 600" value="${t[m]||0}">
    </div>`).join('')}
    <div style="display:flex;gap:10px;margin-top:8px">
      <button class="ob-next-btn" style="flex:1" onclick="confirmMealTargets('${esc(cid)}')">Save →</button>
      <button class="ob-back-btn" onclick="document.getElementById('nutrMealTargetModal').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}
function confirmMealTargets(cid) {
  const t = { breakfast: 0, lunch: 0, dinner: 0, snacks: 0 };
  ['breakfast','lunch','dinner','snacks'].forEach(m => {
    t[m] = parseInt(document.getElementById('mt-' + m)?.value) || 0;
  });
  saveMealTargets(cid, t);
  document.getElementById('nutrMealTargetModal')?.remove();
  const c = (getAllClients().find(cl => cl.id === cid)) || AppState.currentClient;
  if (c) { const panel = document.getElementById('panel-nutrition'); if (panel) panel.innerHTML = renderNutritionTracker(c); }
}

/* ── WEEKLY CALORIE BALANCE ──────────────────────────────────── */
function _nutrWeeklyBalance(cid, baseCal, accent) {
  const logs = getCalorieIntakeLogs(cid);
  const days = [];
  let totalEaten = 0, daysLogged = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key   = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en', { weekday: 'short' });
    const entry = logs.find(l => l.date === key);
    const cal   = entry?.calories || 0;
    if (cal > 0) { totalEaten += cal; daysLogged++; }
    days.push({ label, cal, isToday: i === 0 });
  }

  const weeklyLogged = baseCal * daysLogged;
  const balance      = totalEaten - weeklyLogged;
  const avgPerDay    = daysLogged ? Math.round(totalEaten / daysLogged) : 0;
  const balSign      = balance >= 0 ? '+' : '';
  const balColor     = balance > 200 ? '#e74c3c' : balance < -200 ? '#27ae60' : '#f39c12';
  const balLabel     = balance > 200 ? 'surplus' : balance < -200 ? 'deficit' : 'on track';

  const maxCal = Math.max(...days.map(d => d.cal), baseCal * 1.1, 1);
  const bars = days.map(d => {
    const pct   = Math.min(100, Math.round((d.cal / maxCal) * 100));
    const color = d.cal === 0 ? 'var(--surface2)'
                : d.cal >= baseCal * 0.9 ? '#27ae60'
                : '#e74c3c';
    return `<div class="nwb-bar-col">
      <div class="nwb-bar-wrap"><div class="nwb-bar" style="height:${pct}%;background:${color};opacity:${d.isToday ? 1 : .75}"></div></div>
      <div class="nwb-bar-lbl" style="${d.isToday ? `color:${accent};font-weight:600` : ''}">${d.label}</div>
    </div>`;
  }).join('');

  return `<div class="nutr-targets-card" style="margin-top:12px">
    <div class="nutr-targets-head">
      <div>
        <div class="nutr-targets-title">This Week</div>
        <div class="nutr-targets-sub">${daysLogged} of 7 days logged</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:var(--display);font-weight:700;font-size:22px;color:${balColor}">${balSign}${Math.abs(balance).toLocaleString()} kcal</div>
        <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:.5px">${balLabel}</div>
      </div>
    </div>
    <div class="nwb-bars">${bars}</div>
    <div class="nwb-stats">
      <div class="nwb-stat"><span class="nwb-stat-val">${totalEaten.toLocaleString()}</span><span class="nwb-stat-lbl">eaten</span></div>
      <div class="nwb-stat-div"></div>
      <div class="nwb-stat"><span class="nwb-stat-val">${weeklyLogged.toLocaleString()}</span><span class="nwb-stat-lbl">target</span></div>
      <div class="nwb-stat-div"></div>
      <div class="nwb-stat"><span class="nwb-stat-val">${avgPerDay.toLocaleString()}</span><span class="nwb-stat-lbl">avg/day</span></div>
    </div>
  </div>`;
}

/* ── TOP FOODS ANALYSIS ──────────────────────────────────────── */
function buildTopFoodsSection(cid, accent) {
  const foodMap = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const diary = safeJSON(localStorage.getItem('nutr_diary_' + cid + '_' + key), null);
    if (!diary) continue;
    ['breakfast','lunch','dinner','snacks'].forEach(meal => {
      (diary[meal] || []).forEach(item => {
        const k = item.name || 'Unknown';
        if (!foodMap[k]) foodMap[k] = { name: k, cal: 0, count: 0 };
        foodMap[k].cal   += (item.cal || 0) * (item.qty || 1);
        foodMap[k].count += 1;
      });
    });
  }
  const ranked = Object.values(foodMap).sort((a, b) => b.cal - a.cal).slice(0, 5);
  if (!ranked.length) return '';
  const maxCal = ranked[0].cal || 1;
  const rows = ranked.map((f, i) => {
    const pct = Math.round((f.cal / maxCal) * 100);
    return `<div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">
        <div style="font-size:11px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%">${esc(f.name)}</div>
        <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted)">${Math.round(f.cal)} kcal · ×${f.count}</div>
      </div>
      <div style="background:var(--surface2);border-radius:3px;height:5px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${i===0?accent:'rgba(59,158,255,.4)'};border-radius:3px;transition:width .3s"></div>
      </div>
    </div>`;
  }).join('');
  return `<div class="card" style="margin-bottom:12px">
    <div class="card-block">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div class="block-label">Top Foods This Week</div>
      </div>
      ${rows}
    </div>
  </div>`;
}

/* ── MONTHLY REPORT ──────────────────────────────────────────── */
function openMonthlyReport(cid, calTarget, accent) {
  const now  = new Date();
  const year = now.getFullYear();
  const mon  = now.getMonth();
  const days = new Date(year, mon + 1, 0).getDate();
  let totalCal = 0, totalP = 0, totalC = 0, totalF = 0, loggedDays = 0, waterDays = 0, totalWater = 0;
  let bestCal = 0, bestDate = '', streak = calcLogStreak(cid);

  for (let d = 1; d <= days; d++) {
    const dt  = new Date(year, mon, d);
    if (dt > now) break;
    const key  = dt.toISOString().slice(0, 10);
    const diary = safeJSON(localStorage.getItem('nutr_diary_' + cid + '_' + key), null);
    const t     = diary ? calcDiaryTotals(diary) : null;
    if (t && t.cal > 0) {
      totalCal += t.cal; totalP += t.p; totalC += t.c; totalF += t.f; loggedDays++;
      if (t.cal > bestCal) { bestCal = t.cal; bestDate = key; }
    }
    const waterEntry = (getWaterLog(cid).find(e => e.date === key) || {}).glasses || 0;
    if (waterEntry >= 8) waterDays++;
    totalWater += waterEntry;
  }

  const elapsed = now.getDate();
  const avgCal  = loggedDays ? Math.round(totalCal / loggedDays) : 0;
  const avgP    = loggedDays ? Math.round(totalP   / loggedDays) : 0;
  const avgC    = loggedDays ? Math.round(totalC   / loggedDays) : 0;
  const avgF    = loggedDays ? Math.round(totalF   / loggedDays) : 0;
  const adherPct = calTarget ? Math.round((loggedDays / elapsed) * 100) : 0;
  const monthName = now.toLocaleDateString('en', { month: 'long', year: 'numeric' });

  document.getElementById('nutrMonthlyModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'nutrMonthlyModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:5000;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box';
  modal.innerHTML = `<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;width:100%;max-width:400px;max-height:88vh;overflow-y:auto">
    <div style="padding:18px 18px 0">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px">
        <div>
          <div style="font-family:var(--display);font-weight:700;font-size:24px;letter-spacing:1px">${esc(monthName)}</div>
          <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px">${loggedDays} of ${elapsed} days logged</div>
        </div>
        <button onclick="document.getElementById('nutrMonthlyModal').remove()" style="background:none;border:none;color:var(--muted);font-size:20px;cursor:pointer;padding:4px 8px">&times;</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div style="background:var(--surface2);border-radius:8px;padding:12px">
          <div style="font-family:'Geist Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">AVG CALORIES</div>
          <div style="font-family:var(--display);font-weight:700;font-size:28px;color:${accent}">${avgCal || '—'}</div>
          ${calTarget ? `<div style="font-family:'Geist Mono',monospace;font-size:8px;color:var(--muted)">target: ${calTarget}</div>` : ''}
        </div>
        <div style="background:var(--surface2);border-radius:8px;padding:12px">
          <div style="font-family:'Geist Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">LOG STREAK</div>
          <div style="font-family:var(--display);font-weight:700;font-size:28px;color:#f1c40f">${streak}d</div>
          <div style="font-family:'Geist Mono',monospace;font-size:8px;color:var(--muted)">consecutive days</div>
        </div>
      </div>

      <div style="background:var(--surface2);border-radius:8px;padding:12px;margin-bottom:10px">
        <div style="font-family:'Geist Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:8px">AVG DAILY MACROS</div>
        <div style="display:flex;gap:16px">
          <div><div style="font-size:13px;font-weight:600;color:#ff9f7a">${avgP}g</div><div style="font-family:'Geist Mono',monospace;font-size:8px;color:var(--muted)">Protein</div></div>
          <div><div style="font-size:13px;font-weight:600;color:#3B9EFF">${avgC}g</div><div style="font-family:'Geist Mono',monospace;font-size:8px;color:var(--muted)">Carbs</div></div>
          <div><div style="font-size:13px;font-weight:600;color:#7adfff">${avgF}g</div><div style="font-family:'Geist Mono',monospace;font-size:8px;color:var(--muted)">Fat</div></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div style="background:var(--surface2);border-radius:8px;padding:10px">
          <div style="font-family:'Geist Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">WATER GOAL DAYS</div>
          <div style="font-size:16px;font-weight:700;color:#5dade2">${waterDays} / ${elapsed}</div>
        </div>
        <div style="background:var(--surface2);border-radius:8px;padding:10px">
          <div style="font-family:'Geist Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">AVG WATER</div>
          <div style="font-size:16px;font-weight:700;color:#5dade2">${loggedDays ? (totalWater / elapsed).toFixed(1) : '—'} glasses</div>
        </div>
      </div>

      ${bestDate ? `<div style="background:var(--surface2);border-radius:8px;padding:10px;margin-bottom:16px">
        <div style="font-family:'Geist Mono',monospace;font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:4px">BEST DAY</div>
        <div style="font-size:13px;font-weight:600">${new Date(bestDate+'T12:00:00').toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})} — ${bestCal} kcal</div>
      </div>` : ''}

      ${adherPct > 0 ? `<div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:6px"><span>Logging adherence</span><span>${adherPct}%</span></div>
        <div style="background:var(--surface2);border-radius:4px;height:8px;overflow:hidden">
          <div style="width:${adherPct}%;height:100%;background:${adherPct>=80?'#2ecc71':adherPct>=50?accent:'#e74c3c'};border-radius:4px;transition:width .4s"></div>
        </div>
      </div>` : ''}

      <button onclick="document.getElementById('nutrMonthlyModal').remove()" style="width:100%;background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:11px;border-radius:8px;font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer;margin-bottom:18px">Close</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

/* ── MEAL REMINDERS ──────────────────────────────────────────── */
function getNutrReminders(cid) {
  return getLS('nutr_reminders_' + cid, { breakfast: { enabled: false, time: '08:00' }, lunch: { enabled: false, time: '12:30' }, dinner: { enabled: false, time: '19:00' } });
}
function saveNutrReminders(cid, reminders) {
  localStorage.setItem('nutr_reminders_' + cid, JSON.stringify(reminders));
}
function openNutrRemindersModal(cid) {
  document.getElementById('nutrRemindersModal')?.remove();
  const rem = getNutrReminders(cid);
  const modal = document.createElement('div');
  modal.id = 'nutrRemindersModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:4200;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  modal.innerHTML = `<div style="background:var(--surface);border-radius:14px;padding:24px 20px;width:100%;max-width:360px">
    <div style="font-family:var(--display);font-weight:700;font-size:22px;letter-spacing:1px;margin-bottom:4px">Meal Reminders</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:18px">Push notifications when app is open. Works on Android; iOS requires app installed to home screen.</div>
    ${['breakfast','lunch','dinner'].map(m => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-size:12px;font-weight:500;text-transform:capitalize">${m}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <input type="time" id="rem-time-${m}" value="${rem[m]?.time||'08:00'}" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:4px;padding:4px 6px;font-family:'Geist Mono',monospace;font-size:10px">
        <label style="position:relative;display:inline-block;width:36px;height:20px;flex-shrink:0">
          <input type="checkbox" id="rem-on-${m}" ${rem[m]?.enabled?'checked':''} onchange="this.nextElementSibling.style.background=this.checked?'#2ecc71':'var(--surface2)'" style="opacity:0;width:0;height:0">
          <span onclick="this.previousElementSibling.click()" style="position:absolute;inset:0;background:${rem[m]?.enabled?'#2ecc71':'var(--surface2)'};border:1px solid var(--border);border-radius:10px;cursor:pointer;transition:.2s"></span>
        </label>
      </div>
    </div>`).join('')}
    <div style="display:flex;gap:10px;margin-top:16px">
      <button class="ob-next-btn" style="flex:1" onclick="confirmNutrReminders('${esc(cid)}')">Save →</button>
      <button class="ob-back-btn" onclick="document.getElementById('nutrRemindersModal').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}
function confirmNutrReminders(cid) {
  const rem = {};
  ['breakfast','lunch','dinner'].forEach(m => {
    rem[m] = {
      enabled: document.getElementById('rem-on-' + m)?.checked || false,
      time:    document.getElementById('rem-time-' + m)?.value || '08:00',
    };
  });
  saveNutrReminders(cid, rem);
  // Request notification permission if any enabled
  const anyOn = Object.values(rem).some(r => r.enabled);
  if (anyOn && typeof Notification !== 'undefined' && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
  document.getElementById('nutrRemindersModal')?.remove();
  showFitToast('Reminders saved');
}
// Schedule today's pending reminders on page load (called from renderNutritionTracker)
function _scheduleNutrReminders(cid) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  window._nutrReminderTimers = window._nutrReminderTimers || {};
  const rem  = getNutrReminders(cid);
  const now  = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  ['breakfast','lunch','dinner'].forEach(m => {
    const r = rem[m];
    const timerKey = cid + '_' + m + '_' + todayKey;
    if (window._nutrReminderTimers[timerKey]) {
      clearTimeout(window._nutrReminderTimers[timerKey]);
      delete window._nutrReminderTimers[timerKey];
    }
    if (!r?.enabled) return;
    const [h, mi] = (r.time || '08:00').split(':').map(Number);
    const fire = new Date(now); fire.setHours(h, mi, 0, 0);
    if (fire <= now) return; // already past
    const firedKey = 'rem_fired_' + cid + '_' + m + '_' + todayKey;
    if (localStorage.getItem(firedKey)) return; // already fired today
    const delay = fire - now;
    window._nutrReminderTimers[timerKey] = setTimeout(() => {
      delete window._nutrReminderTimers[timerKey];
      if (localStorage.getItem(firedKey)) return;
      localStorage.setItem(firedKey, '1');
      const diary = getNutrDiary(cid, todayKey);
      const mealItems = Array.isArray(diary[m]) ? diary[m] : [];
      if (mealItems.length > 0) return; // already logged for this meal
      new Notification('CrazyyFit — ' + m[0].toUpperCase() + m.slice(1), { body: "Time to log your " + m + "! Tap to open.", icon: './icons/icon-192.png', tag: 'nutr-' + m });
    }, delay);
  });
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

  // ── Determine if today is a training or rest day from schedule ──
  const schedDays = c.data?.schedule?.days || [];
  const jsDay = new Date(date + 'T12:00:00').getDay(); // 0=Sun
  const dayMap = ['sun','mon','tue','wed','thu','fri','sat'];
  const todayLabel = dayMap[jsDay];
  const schedDay = schedDays.find(d => d.label?.toLowerCase() === todayLabel);
  const isTrainingDay = schedDay ? !['rest','wk-rest'].includes((schedDay.type||schedDay.tag||'').toLowerCase()) : null;

  // ── Base macro targets from client data ──
  const _mv = (label) => {
    if (!n || !n.macros) return 0;
    const m = n.macros.find(m => new RegExp(label, 'i').test(m.label));
    return parseInt(String(m?.val || '').replace(/,/g, '')) || 0;
  };
  const baseCal = _mv('calorie|kcal') || (n?.calories) || 2000;
  const baseP   = _mv('protein')      || (n?.protein)  || 150;
  const baseC   = _mv('carb')         || (n?.carbs)    || 200;
  const baseF   = _mv('fat')          || (n?.fat)      || 65;

  // ── Apply training/rest day split if available ──
  let targets, dayTypeLabel = null;
  if (isTrainingDay !== null && n?.trainingDay && n?.restDay) {
    const split = isTrainingDay ? n.trainingDay : n.restDay;
    targets = { cal: split.calories, p: split.protein, c: split.carbs, f: split.fat };
    dayTypeLabel = isTrainingDay ? 'Training Day' : 'Rest Day';
  } else {
    targets = { cal: baseCal, p: baseP, c: baseC, f: baseF };
  }

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

  // Today's goal strip — what their totals should add up to
  html += `<div class="nutr-goal-strip">
    <div class="nutr-goal-head">
      <span class="nutr-goal-lbl">Today's Goal</span>
      ${dayTypeLabel ? `<span class="nutr-goal-badge" style="color:${isTrainingDay ? accent : 'var(--muted)'};border-color:${isTrainingDay ? accent + '55' : 'var(--border)'};background:${isTrainingDay ? accent + '18' : 'transparent'}">${esc(dayTypeLabel)}</span>` : ''}
    </div>
    <div class="nutr-goal-vals">
      <div class="nutr-goal-cell"><span class="nutr-goal-num" style="color:${accent}">${targets.cal}</span><span class="nutr-goal-u">kcal</span></div>
      <span class="nutr-goal-dot">·</span>
      <div class="nutr-goal-cell"><span class="nutr-goal-num" style="color:#ff9f7a">${targets.p}</span><span class="nutr-goal-u">g P</span></div>
      <span class="nutr-goal-dot">·</span>
      <div class="nutr-goal-cell"><span class="nutr-goal-num" style="color:#3B9EFF">${targets.c}</span><span class="nutr-goal-u">g C</span></div>
      <span class="nutr-goal-dot">·</span>
      <div class="nutr-goal-cell"><span class="nutr-goal-num" style="color:#7adfff">${targets.f}</span><span class="nutr-goal-u">g F</span></div>
    </div>
  </div>`;

  // Macro rings
  html += `<div class="nutr-rings-grid" id="nutr-rings-grid">
    ${_nutrRing(totals.cal, targets.cal, 'Calories', 'kcal', accent)}
    ${_nutrRing(totals.p,   targets.p,   'Protein',  'g',   '#ff9f7a')}
    ${_nutrRing(totals.c,   targets.c,   'Carbs',    'g',   '#3B9EFF')}
    ${_nutrRing(totals.f,   targets.f,   'Fat',      'g',   '#7adfff')}
  </div>`;

  // Day type badge + micronutrient strip
  const netCarbs = Math.max(0, Math.round((totals.c - totals.fiber) * 10) / 10);
  html += `<div class="nutr-micro-strip" id="nutr-micro-strip">
    ${dayTypeLabel ? `<span class="nutr-day-badge" style="background:${isTrainingDay ? accent + '22' : 'rgba(136,136,136,.15)'};color:${isTrainingDay ? accent : 'var(--muted)'};border-color:${isTrainingDay ? accent + '55' : 'var(--border)'}">${esc(dayTypeLabel)}</span>` : ''}
    ${totals.fiber  > 0 ? `<span class="nutr-micro-pill">Fiber <b>${totals.fiber}g</b></span>` : ''}
    ${totals.sugar  > 0 ? `<span class="nutr-micro-pill">Sugar <b>${totals.sugar}g</b></span>` : ''}
    ${totals.sodium > 0 ? `<span class="nutr-micro-pill">Sodium <b>${totals.sodium}mg</b></span>` : ''}
    ${totals.fiber  > 0 ? `<span class="nutr-micro-pill">Net Carbs <b>${netCarbs}g</b></span>` : ''}
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

  html += `<div class="nutr-summary-strip" id="nutr-summary-strip">
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

  // Top foods this week
  html += buildTopFoodsSection(c.id, accent);

  // Weekly calorie balance
  html += _nutrWeeklyBalance(c.id, baseCal, accent);

  // Targets reference card
  html += `<div class="nutr-targets-card">
    <div class="nutr-targets-head">
      <div class="nutr-targets-title">Daily Targets${dayTypeLabel ? ` <span class="nutr-targets-sub">· ${esc(dayTypeLabel)}</span>` : ''}</div>
      <button class="nutr-targets-edit" onclick="openMealTargetModal('${esc(c.id)}')">Meal Goals</button>
    </div>
    <div class="nutr-targets-grid">
      <div class="nutr-target-cell"><div class="nutr-target-val" style="color:${accent}">${targets.cal}</div><div class="nutr-target-lbl">kcal</div></div>
      <div class="nutr-target-cell"><div class="nutr-target-val" style="color:#ff9f7a">${targets.p}<span class="nutr-target-unit">g</span></div><div class="nutr-target-lbl">Protein</div></div>
      <div class="nutr-target-cell"><div class="nutr-target-val" style="color:#3B9EFF">${targets.c}<span class="nutr-target-unit">g</span></div><div class="nutr-target-lbl">Carbs</div></div>
      <div class="nutr-target-cell"><div class="nutr-target-val" style="color:#7adfff">${targets.f}<span class="nutr-target-unit">g</span></div><div class="nutr-target-lbl">Fat</div></div>
    </div>
    ${(n?.trainingDay && n?.restDay) ? `<div class="nutr-targets-split">
      <div class="nutr-split-col${isTrainingDay ? ' active' : ''}" style="${isTrainingDay ? `border-color:${accent}55;background:${accent}14` : ''}">
        <div class="nutr-split-lbl" style="${isTrainingDay ? `color:${accent}` : ''}">Training</div>
        <div class="nutr-split-val">${n.trainingDay.calories}<span class="nutr-split-unit">kcal</span></div>
        <div class="nutr-split-meta">${n.trainingDay.carbs}g C</div>
      </div>
      <div class="nutr-split-col${isTrainingDay === false ? ' active' : ''}">
        <div class="nutr-split-lbl">Rest</div>
        <div class="nutr-split-val">${n.restDay.calories}<span class="nutr-split-unit">kcal</span></div>
        <div class="nutr-split-meta">${n.restDay.carbs}g C</div>
      </div>
    </div>` : ''}
  </div>`;

  // Meal timing + supplement tips from nutrition blueprint
  if (n && n.tips && n.tips.length) {
    html += `<div class="card" style="margin-top:12px">
      <div class="card-block"><div class="block-label">Meal Timing</div><ul class="tip-list">${n.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
      ${n.supplements && n.supplements.length ? `<div class="card-block"><div class="block-label">Supplements</div><ul class="tip-list">${n.supplements.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>` : ''}
    </div>`;
  }

  // Action row: reminders + monthly report
  html += `<div style="display:flex;gap:8px;margin-top:12px;margin-bottom:4px">
    <button class="nutr-meal-mini-btn" style="flex:1" onclick="openNutrRemindersModal('${esc(c.id)}')">Meal Reminders</button>
    <button class="nutr-meal-mini-btn" style="flex:1" onclick="openMonthlyReport('${esc(c.id)}',${targets.cal},'${esc(accent)}')">Monthly Report</button>
  </div>`;

  // Schedule reminders for today
  _scheduleNutrReminders(c.id);

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
  // Water doesn't affect macros — only re-render the water section
  const waterEl = document.getElementById('nutr-water-section');
  if (waterEl) {
    const accent = c.accent || 'var(--accent)';
    const newGlasses = getWaterForDate(cid, date);
    const tmp = document.createElement('div');
    tmp.innerHTML = _nutrWaterSection(c.id, date, newGlasses, accent);
    waterEl.replaceWith(tmp.firstElementChild);
    return;
  }
  // Fallback: full re-render if the granular target isn't in the DOM
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
  // Update only the meal section + the totals areas that depend on it.
  // Avoids destroying scroll position, focus, and bottom-half DOM (history/charts).
  if (_updateNutrGranular(c, date, meal)) return;
  // Fallback: full re-render
  const panel = document.getElementById('panel-nutrition');
  if (panel) panel.innerHTML = renderNutritionTracker(c);
}

// Returns true if it updated DOM in place; false if it couldn't and the caller
// should fall back to a full panel re-render.
function _updateNutrGranular(c, date, mealKey) {
  const mealEl    = mealKey ? document.getElementById('nutr-meal-' + mealKey) : null;
  const ringsEl   = document.getElementById('nutr-rings-grid');
  const microEl   = document.getElementById('nutr-micro-strip');
  const summaryEl = document.getElementById('nutr-summary-strip');
  if (!ringsEl || !microEl || !summaryEl) return false;

  const accent = c.accent || 'var(--accent)';
  const diary  = getNutrDiary(c.id, date);
  const totals = calcDiaryTotals(diary);
  const n      = c.data && c.data.nutrition;

  // Recompute targets (same logic as renderNutritionTracker)
  const schedDays = c.data?.schedule?.days || [];
  const jsDay = new Date(date + 'T12:00:00').getDay();
  const dayMap = ['sun','mon','tue','wed','thu','fri','sat'];
  const todayLabel = dayMap[jsDay];
  const schedDay = schedDays.find(d => d.label?.toLowerCase() === todayLabel);
  const isTrainingDay = schedDay ? !['rest','wk-rest'].includes((schedDay.type||schedDay.tag||'').toLowerCase()) : null;
  const _mv = (label) => {
    if (!n || !n.macros) return 0;
    const m = n.macros.find(m => new RegExp(label, 'i').test(m.label));
    return parseInt(String(m?.val || '').replace(/,/g, '')) || 0;
  };
  const baseCal = _mv('calorie|kcal') || (n?.calories) || 2000;
  const baseP   = _mv('protein')      || (n?.protein)  || 150;
  const baseC   = _mv('carb')         || (n?.carbs)    || 200;
  const baseF   = _mv('fat')          || (n?.fat)      || 65;
  let targets, dayTypeLabel = null;
  if (isTrainingDay !== null && n?.trainingDay && n?.restDay) {
    const split = isTrainingDay ? n.trainingDay : n.restDay;
    targets = { cal: split.calories, p: split.protein, c: split.carbs, f: split.fat };
    dayTypeLabel = isTrainingDay ? 'Training Day' : 'Rest Day';
  } else {
    targets = { cal: baseCal, p: baseP, c: baseC, f: baseF };
  }

  // Rings
  ringsEl.innerHTML = `${_nutrRing(totals.cal, targets.cal, 'Calories', 'kcal', accent)}
    ${_nutrRing(totals.p, targets.p, 'Protein', 'g', '#ff9f7a')}
    ${_nutrRing(totals.c, targets.c, 'Carbs',   'g', '#3B9EFF')}
    ${_nutrRing(totals.f, targets.f, 'Fat',     'g', '#7adfff')}`;

  // Micro strip
  const netCarbs = Math.max(0, Math.round((totals.c - totals.fiber) * 10) / 10);
  microEl.innerHTML = `${dayTypeLabel ? `<span class="nutr-day-badge" style="background:${isTrainingDay ? accent + '22' : 'rgba(136,136,136,.15)'};color:${isTrainingDay ? accent : 'var(--muted)'};border-color:${isTrainingDay ? accent + '55' : 'var(--border)'}">${esc(dayTypeLabel)}</span>` : ''}
    ${totals.fiber  > 0 ? `<span class="nutr-micro-pill">Fiber <b>${totals.fiber}g</b></span>` : ''}
    ${totals.sugar  > 0 ? `<span class="nutr-micro-pill">Sugar <b>${totals.sugar}g</b></span>` : ''}
    ${totals.sodium > 0 ? `<span class="nutr-micro-pill">Sodium <b>${totals.sodium}mg</b></span>` : ''}
    ${totals.fiber  > 0 ? `<span class="nutr-micro-pill">Net Carbs <b>${netCarbs}g</b></span>` : ''}`;

  // Summary strip
  const remCal    = Math.max(0, targets.cal - totals.cal);
  const calOver   = totals.cal > targets.cal * 1.05;
  const calHit    = !calOver && totals.cal >= targets.cal * 0.9;
  const statColor = calOver ? '#e74c3c' : calHit ? '#2ecc71' : 'var(--muted)';
  const statText  = calOver ? `${totals.cal - targets.cal} kcal over` : calHit ? 'Target hit' : `${remCal} kcal left`;
  const streak = calcLogStreak(c.id);
  const streakHtml = streak > 0
    ? `<div class="nutr-sum-sep"></div><div class="nutr-sum-item"><div class="nutr-sum-val" style="color:#f1c40f">${streak}d</div><div class="nutr-sum-lbl">streak</div></div>`
    : '';
  summaryEl.innerHTML = `<div class="nutr-sum-item"><div class="nutr-sum-val" style="color:${accent}">${totals.cal}</div><div class="nutr-sum-lbl">eaten</div></div>
    <div class="nutr-sum-sep"></div>
    <div class="nutr-sum-item"><div class="nutr-sum-val" style="color:${statColor}">${esc(statText)}</div></div>
    <div class="nutr-sum-sep"></div>
    <div class="nutr-sum-item"><div class="nutr-sum-val" style="color:var(--muted)">${targets.cal}</div><div class="nutr-sum-lbl">target</div></div>
    ${streakHtml}`;

  // Meal section (the one that changed)
  if (mealEl && mealKey) {
    const label = mealKey.charAt(0).toUpperCase() + mealKey.slice(1);
    const tmp = document.createElement('div');
    tmp.innerHTML = _nutrMealSection(c.id, mealKey, label, diary[mealKey] || [], accent, date);
    mealEl.replaceWith(tmp.firstElementChild);
  }
  return true;
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
          <div style="font-family:var(--display);font-weight:700;font-size:22px;letter-spacing:1px">Add Food</div>
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
  _loadSharedFoods().catch(() => {});
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
    // Recents are short — debounce isn't necessary
    nutrRenderRecents(q);
  } else {
    // Local library search: debounce to coalesce rapid keystrokes
    clearTimeout(AppState._nutrLocalTimer);
    AppState._nutrLocalTimer = setTimeout(() => nutrSearchUpdate(q), 80);
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
    <div style="font-family:var(--display);font-weight:700;font-size:22px;letter-spacing:1px;margin-bottom:4px">Quick Add</div>
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
  AppState._nutrMergedCorpus = null;
  AppState._nutrCorpusCid = null;
}

function nutrFilterCat(btn, cat) {
  AppState._nutrCatFilter = cat;
  document.querySelectorAll('.nutr-cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  nutrSearchUpdate(document.getElementById('nutrSearchInput')?.value || '');
}

function nutrSearchUpdate(q) {
  const cat = AppState._nutrCatFilter || '';
  const cid = AppState._nutrSearchCid;
  // Merged corpus is cached for the duration of the open search modal;
  // openNutrSearch + closeNutrSearch clear the cache. Avoids re-splatting
  // 250+ items on every keystroke.
  if (!AppState._nutrMergedCorpus || AppState._nutrCorpusCid !== cid) {
    const customList = getCustomFoods(cid).map(f => ({ ...f, _custom: true }));
    const sharedList = getSharedFoodsCache().map(f => ({ ...f, _shared: true }));
    AppState._nutrMergedCorpus = [...customList, ...sharedList, ...FOOD_DB];
    AppState._nutrCorpusCid = cid;
  }
  const qLower = q ? q.toLowerCase() : '';
  const results = AppState._nutrMergedCorpus.filter(f => {
    const matchQ = !qLower || f.name.toLowerCase().includes(qLower);
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

/* ── QUANTITY / WEIGHT SELECTOR ──────────────────────────────── */
function openNutrAddQty(foodId) {
  const cid      = AppState._nutrSearchCid;
  const isCustom = foodId.startsWith('c_');
  const realId   = isCustom ? foodId.slice(2) : foodId;
  const food     = isCustom
    ? getCustomFoods(cid).find(f => String(f.id) === String(realId))
    : FOOD_DB.find(f => f.id === realId);
  if (!food) return;
  _openWeightModal(food, foodId);
}

function _openWeightModal(food, foodId) {
  document.getElementById('nutrQtyModal')?.remove();
  const baseG = _getBaseG(food);
  const hasWeight = baseG && baseG > 0;
  // Default unit: oz for Americans
  window._nutrQtyUnit = window._nutrQtyUnit || 'oz';
  const defUnit = window._nutrQtyUnit;
  // Default amount: 1 serving worth in the default unit
  const defAmt = hasWeight
    ? (defUnit === 'oz' ? Math.round(baseG / _OZ_TO_G * 10) / 10 : defUnit === 'lbs' ? Math.round(baseG / _LB_TO_G * 100) / 100 : baseG)
    : 1;

  const perLabel = hasWeight ? `Per ${baseG}g` : `Per ${esc(food.serving)}`;
  const unitBtns = hasWeight
    ? ['oz','g','lbs'].map(u =>
        `<button class="nutr-unit-btn${defUnit===u?' active':''}" onclick="_nutrSwitchUnit('${u}')" data-unit="${u}">${u}</button>`
      ).join('')
    : '';

  const popup = document.createElement('div');
  popup.id = 'nutrQtyModal';
  popup.style.cssText = 'position:fixed;inset:0;z-index:4100;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  popup.innerHTML = `<div style="background:var(--surface);border-radius:14px;padding:24px 20px;width:100%;max-width:340px">
    <div style="font-family:var(--display);font-weight:700;font-size:22px;letter-spacing:1px;margin-bottom:4px">${esc(food.name)}</div>
    ${food.brand ? `<div style="font-size:11px;color:var(--muted);margin-bottom:6px">${esc(food.brand)}</div>` : ''}
    <div style="font-family:'Geist Mono',monospace;font-size:10px;color:var(--muted);margin-bottom:16px">${perLabel}: ${food.cal} kcal · ${food.p}g P · ${food.c}g C · ${food.f}g F</div>
    <div style="margin-bottom:6px">
      <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">${hasWeight ? 'How much?' : 'Servings'}</div>
      <div style="display:flex;gap:8px;align-items:stretch">
        <input class="fit-input" id="nutrQtyInput" type="number" step="any" min="0" value="${defAmt}" inputmode="decimal" style="font-size:20px;text-align:center;flex:1">
        ${hasWeight ? `<div class="nutr-unit-group" id="nutrUnitGroup">${unitBtns}</div>` : ''}
      </div>
    </div>
    <div id="nutrQtyPreview" style="font-family:'Geist Mono',monospace;font-size:11px;color:var(--text);text-align:center;margin:14px 0 18px;padding:10px;background:var(--surface2);border-radius:8px;min-height:20px"></div>
    <div style="display:flex;gap:10px">
      <button class="ob-next-btn" style="flex:1" onclick="confirmNutrAddFood('${esc(foodId)}')">Add to ${esc(AppState._nutrSearchMeal)} →</button>
      <button class="ob-back-btn" onclick="document.getElementById('nutrQtyModal').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(popup);

  window._nutrQtyFood  = food;
  window._nutrQtyBaseG = baseG;
  _nutrUpdatePreview();

  const qtyEl = document.getElementById('nutrQtyInput');
  qtyEl.addEventListener('input', _nutrUpdatePreview);
  setTimeout(() => qtyEl?.select(), 60);
}

function _nutrSwitchUnit(u) {
  window._nutrQtyUnit = u;
  document.querySelectorAll('.nutr-unit-btn').forEach(b => b.classList.toggle('active', b.dataset.unit === u));
  // Convert the current amount to the new unit
  const baseG = window._nutrQtyBaseG;
  const input = document.getElementById('nutrQtyInput');
  if (!input || !baseG) return;
  const curG = _nutrInputToGrams();
  if (u === 'oz')  input.value = Math.round(curG / _OZ_TO_G * 10) / 10;
  else if (u === 'lbs') input.value = Math.round(curG / _LB_TO_G * 100) / 100;
  else input.value = Math.round(curG);
  _nutrUpdatePreview();
}

function _nutrInputToGrams() {
  const amt   = parseFloat(document.getElementById('nutrQtyInput')?.value) || 0;
  const baseG = window._nutrQtyBaseG;
  if (!baseG) return null; // count-based: amt is servings
  const unit  = window._nutrQtyUnit || 'oz';
  if (unit === 'oz')  return amt * _OZ_TO_G;
  if (unit === 'lbs') return amt * _LB_TO_G;
  return amt; // grams
}

function _nutrGetQty() {
  // Returns the multiplier to apply to food macros
  const baseG = window._nutrQtyBaseG;
  if (!baseG) return Math.max(0.25, parseFloat(document.getElementById('nutrQtyInput')?.value) || 1);
  const grams = _nutrInputToGrams();
  return grams / baseG;
}

function _nutrUpdatePreview() {
  const el   = document.getElementById('nutrQtyPreview');
  if (!el) return;
  const food = window._nutrQtyFood;
  if (!food) return;
  const qty  = _nutrGetQty();
  const cal  = Math.round(food.cal * qty);
  const p    = Math.round(food.p * qty * 10) / 10;
  const c    = Math.round(food.c * qty * 10) / 10;
  const f    = Math.round(food.f * qty * 10) / 10;
  const baseG = window._nutrQtyBaseG;
  const grams = baseG ? Math.round(_nutrInputToGrams()) : null;
  el.innerHTML = `<span style="color:var(--accent);font-weight:700">${cal} kcal</span> · ${p}g P · ${c}g C · ${f}g F`
    + (grams !== null ? `<br><span style="font-size:9px;color:var(--muted)">${grams}g total</span>` : '');
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

  const qty = _nutrGetQty();
  const baseG = window._nutrQtyBaseG;
  const inputAmt = parseFloat(document.getElementById('nutrQtyInput')?.value) || 1;
  const inputUnit = window._nutrQtyUnit || 'oz';
  // Build a user-facing serving label like "8 oz" or "200g"
  const servingLabel = baseG
    ? (inputUnit === 'g' ? Math.round(inputAmt) + 'g' : inputAmt + ' ' + inputUnit)
    : (inputAmt === 1 ? food.serving : inputAmt + ' x ' + food.serving);

  const diary = getNutrDiary(cid, date);
  if (!diary[meal]) diary[meal] = [];
  diary[meal].push({ id: food.id, name: food.name, cal: food.cal, p: food.p, c: food.c, f: food.f, qty, serving: servingLabel, fiber: food.fiber || 0, sodium: food.sodium || 0, sugar: food.sugar || 0 });
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

/* ── CUSTOM FOOD MODAL (with Recipe Builder tab) ──────────────── */
window._recipeIngredients = [];

function openNutrCustomFood(mode, barcode) {
  mode = mode || 'manual'; // 'manual' | 'recipe'
  document.getElementById('nutrCustomFoodModal')?.remove();
  window._recipeIngredients = [];
  window._nutrCustomBarcode = barcode || null;

  const modal = document.createElement('div');
  modal.id    = 'nutrCustomFoodModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:4200;background:rgba(0,0,0,.75);display:flex;align-items:flex-end;justify-content:center';

  const tabStyle = (m) => `padding:6px 14px;border-radius:4px;border:none;font-family:'Geist Mono',monospace;font-size:9px;letter-spacing:1px;cursor:pointer;background:${mode===m?'var(--accent)':'var(--surface2)'};color:${mode===m?'#000':'var(--muted)'}`;

  modal.innerHTML = `<div style="background:var(--surface);border-radius:16px 16px 0 0;padding:24px 20px 28px;width:100%;max-width:500px;box-sizing:border-box;max-height:90vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div style="font-family:var(--display);font-weight:700;font-size:22px;letter-spacing:1px">Custom Food</div>
      <div style="display:flex;gap:6px">
        <button onclick="openNutrCustomFood('manual')" style="${tabStyle('manual')}">Manual</button>
        <button onclick="openNutrCustomFood('recipe')" style="${tabStyle('recipe')}">Recipe</button>
      </div>
    </div>

    ${mode === 'manual' ? `
    ${window._nutrCustomBarcode ? `<div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);background:var(--surface2);padding:6px 10px;border-radius:6px;margin-bottom:10px;letter-spacing:.5px">Barcode: ${window._nutrCustomBarcode} — this food will be saved for all clients</div>` : ''}
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
        <input class="ob-input" id="cf-cal" type="number" placeholder="0" inputmode="numeric" oninput="cfUpdateCalPreview()"></div>
      <div class="ob-field"><label class="ob-label">Protein (g)</label>
        <input class="ob-input" id="cf-p" type="number" placeholder="0" inputmode="numeric" oninput="cfUpdateCalPreview()"></div>
    </div>
    <div class="ob-input-row" style="margin-bottom:10px">
      <div class="ob-field"><label class="ob-label">Carbs (g)</label>
        <input class="ob-input" id="cf-c" type="number" placeholder="0" inputmode="numeric" oninput="cfUpdateCalPreview()"></div>
      <div class="ob-field"><label class="ob-label">Fat (g)</label>
        <input class="ob-input" id="cf-f" type="number" placeholder="0" inputmode="numeric" oninput="cfUpdateCalPreview()"></div>
    </div>
    <div class="ob-input-row" style="margin-bottom:16px">
      <div class="ob-field"><label class="ob-label">Fiber (g) <span style="color:var(--faint)">opt</span></label>
        <input class="ob-input" id="cf-fiber" type="number" placeholder="0" inputmode="decimal"></div>
      <div class="ob-field"><label class="ob-label">Sodium (mg) <span style="color:var(--faint)">opt</span></label>
        <input class="ob-input" id="cf-sodium" type="number" placeholder="0" inputmode="numeric"></div>
    </div>
    <div id="cf-cal-preview" style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:14px;letter-spacing:.5px"></div>
    <div style="display:flex;gap:10px">
      <button class="ob-next-btn" style="flex:1" onclick="confirmNutrCustomFood()">Save & Add →</button>
      <button class="ob-back-btn" onclick="document.getElementById('nutrCustomFoodModal').remove()">Cancel</button>
    </div>
    ` : `
    <div class="ob-field" style="margin-bottom:10px">
      <label class="ob-label">Recipe Name</label>
      <input class="ob-input" id="cf-name" type="text" placeholder="e.g. Chicken Rice Bowl">
    </div>
    <div class="ob-field" style="margin-bottom:12px">
      <label class="ob-label">Serves</label>
      <input class="ob-input" id="cf-serves" type="number" placeholder="1" value="1" min="1" inputmode="numeric" oninput="cfRecipeUpdateTotals()">
    </div>
    <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:8px">ADD INGREDIENTS</div>
    <div style="display:flex;gap:6px;margin-bottom:10px">
      <input class="ob-input" id="cf-ing-search" type="text" placeholder="Search food..." style="flex:1" oninput="cfRecipeSearch(this.value)" autocomplete="off">
    </div>
    <div id="cf-ing-results" style="max-height:120px;overflow-y:auto;margin-bottom:10px;border:1px solid var(--border);border-radius:6px"></div>
    <div id="cf-ing-list" style="margin-bottom:10px"></div>
    <div id="cf-recipe-totals" style="background:var(--surface2);border-radius:6px;padding:10px 12px;font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);margin-bottom:16px;min-height:32px"></div>
    <div style="display:flex;gap:10px">
      <button class="ob-next-btn" style="flex:1" onclick="confirmNutrRecipe()">Save Recipe →</button>
      <button class="ob-back-btn" onclick="document.getElementById('nutrCustomFoodModal').remove()">Cancel</button>
    </div>
    `}
  </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  setTimeout(() => document.getElementById('cf-name')?.focus(), 60);
}

function cfUpdateCalPreview() {
  const p = parseFloat(document.getElementById('cf-p')?.value) || 0;
  const c = parseFloat(document.getElementById('cf-c')?.value) || 0;
  const f = parseFloat(document.getElementById('cf-f')?.value) || 0;
  const computed = Math.round(p * 4 + c * 4 + f * 9);
  const el = document.getElementById('cf-cal-preview');
  if (el && (p || c || f)) el.textContent = `Macro-computed calories: ~${computed} kcal`;
  else if (el) el.textContent = '';
}

function cfRecipeSearch(q) {
  const el = document.getElementById('cf-ing-results');
  if (!el) return;
  if (!q || q.length < 1) { el.innerHTML = ''; return; }
  const ql = q.toLowerCase();
  const cid = AppState._nutrSearchCid;
  const custom = getCustomFoods(cid).map(f => ({ ...f, _custom: true }));
  const results = [...custom, ...FOOD_DB].filter(f => f.name.toLowerCase().includes(ql)).slice(0, 12);
  el.innerHTML = results.map((f, i) =>
    `<div style="padding:8px 10px;cursor:pointer;border-bottom:1px solid var(--border);font-size:11px" onclick="cfRecipeAddIngredient(${i})" data-idx="${i}">${esc(f.name)} <span style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted)">${f.cal}kcal/${esc(f.serving)}</span></div>`
  ).join('');
  window._cfRecipeSearchResults = results;
}

function cfRecipeAddIngredient(idx) {
  const f = (window._cfRecipeSearchResults || [])[idx];
  if (!f) return;
  window._recipeIngredients.push({ id: f.id, name: f.name, cal: f.cal, p: f.p, c: f.c, f: f.f, fiber: f.fiber || 0, sodium: f.sodium || 0, serving: f.serving, qty: 1 });
  document.getElementById('cf-ing-search').value = '';
  document.getElementById('cf-ing-results').innerHTML = '';
  cfRecipeRenderList();
  cfRecipeUpdateTotals();
}

function cfRecipeRenderList() {
  const el = document.getElementById('cf-ing-list');
  if (!el) return;
  if (!window._recipeIngredients.length) { el.innerHTML = ''; return; }
  el.innerHTML = window._recipeIngredients.map((ing, i) => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <div style="flex:1;font-size:11px">${esc(ing.name)}</div>
      <input type="number" value="${ing.qty}" min="0.25" step="0.25" inputmode="decimal" style="width:52px;background:var(--surface2);border:1px solid var(--border);color:var(--text);border-radius:4px;padding:3px 6px;font-family:'Geist Mono',monospace;font-size:10px;text-align:center" oninput="window._recipeIngredients[${i}].qty=parseFloat(this.value)||1;cfRecipeUpdateTotals()">
      <div style="font-family:'Geist Mono',monospace;font-size:9px;color:var(--muted);min-width:36px;text-align:right">${Math.round(ing.cal * ing.qty)} kcal</div>
      <button onclick="window._recipeIngredients.splice(${i},1);cfRecipeRenderList();cfRecipeUpdateTotals()" style="background:none;border:none;color:var(--danger);font-size:14px;cursor:pointer;padding:0 4px">×</button>
    </div>`).join('');
}

function cfRecipeUpdateTotals() {
  cfRecipeRenderList();
  const el = document.getElementById('cf-recipe-totals');
  if (!el) return;
  const serves = Math.max(1, parseInt(document.getElementById('cf-serves')?.value) || 1);
  let cal = 0, p = 0, c = 0, f = 0, fiber = 0, sodium = 0;
  window._recipeIngredients.forEach(ing => {
    const q = ing.qty || 1;
    cal    += (ing.cal    || 0) * q;
    p      += (ing.p      || 0) * q;
    c      += (ing.c      || 0) * q;
    f      += (ing.f      || 0) * q;
    fiber  += (ing.fiber  || 0) * q;
    sodium += (ing.sodium || 0) * q;
  });
  window._cfRecipeTotals = { cal: Math.round(cal/serves), p: Math.round(p/serves*10)/10, c: Math.round(c/serves*10)/10, f: Math.round(f/serves*10)/10, fiber: Math.round(fiber/serves*10)/10, sodium: Math.round(sodium/serves) };
  const t = window._cfRecipeTotals;
  el.innerHTML = `Per serving (1 of ${serves}): <b style="color:var(--text)">${t.cal} kcal</b> · ${t.p}g P · ${t.c}g C · ${t.f}g F${t.fiber>0?' · '+t.fiber+'g fiber':''}`;
}

function confirmNutrRecipe() {
  const cid   = AppState._nutrSearchCid;
  const meal  = AppState._nutrSearchMeal;
  const date  = AppState._nutrSearchDate;
  const name  = document.getElementById('cf-name')?.value?.trim();
  const serves = Math.max(1, parseInt(document.getElementById('cf-serves')?.value) || 1);
  if (!name) { const el = document.getElementById('cf-name'); if (el) el.style.borderColor = '#e74c3c'; return; }
  if (!window._recipeIngredients.length) { showFitToast('Add at least one ingredient'); return; }
  cfRecipeUpdateTotals();
  const t = window._cfRecipeTotals || {};
  const serving = serves > 1 ? `1 of ${serves} servings` : '1 serving';
  const customs = getCustomFoods(cid);
  const newFood = { id: Date.now(), cat: 'Custom', name, serving, cal: t.cal||0, p: t.p||0, c: t.c||0, f: t.f||0, fiber: t.fiber||0, sodium: t.sodium||0, _recipe: true };
  customs.push(newFood);
  saveCustomFoods(cid, customs);
  const diary = getNutrDiary(cid, date);
  if (!diary[meal]) diary[meal] = [];
  diary[meal].push({ id: newFood.id, name, cal: newFood.cal, p: newFood.p, c: newFood.c, f: newFood.f, fiber: newFood.fiber, sodium: newFood.sodium, qty: 1, serving });
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

function confirmNutrCustomFood() {
  const cid     = AppState._nutrSearchCid;
  const meal    = AppState._nutrSearchMeal;
  const date    = AppState._nutrSearchDate;
  const nameEl  = document.getElementById('cf-name');
  const name    = nameEl?.value?.trim();
  const serving = document.getElementById('cf-serving')?.value?.trim() || '1 serving';
  const cal     = parseFloat(document.getElementById('cf-cal')?.value)   || 0;
  const p       = parseFloat(document.getElementById('cf-p')?.value)     || 0;
  const c       = parseFloat(document.getElementById('cf-c')?.value)     || 0;
  const f       = parseFloat(document.getElementById('cf-f')?.value)     || 0;
  const fiber   = parseFloat(document.getElementById('cf-fiber')?.value) || 0;
  const sodium  = parseFloat(document.getElementById('cf-sodium')?.value)|| 0;

  if (!name) {
    if (nameEl) nameEl.style.borderColor = '#e74c3c';
    return;
  }

  // Save to custom food library
  const customs = getCustomFoods(cid);
  const newFood = { id: Date.now(), cat: 'Custom', name, serving, cal, p, c, f, fiber, sodium };
  customs.push(newFood);
  saveCustomFoods(cid, customs);

  // If this came from a barcode scan, share it with everyone
  if (window._nutrCustomBarcode) {
    _saveSharedFood({ ...newFood, code: window._nutrCustomBarcode }).catch(() => {});
    window._nutrCustomBarcode = null;
  }

  // Add directly to diary
  const diary = getNutrDiary(cid, date);
  if (!diary[meal]) diary[meal] = [];
  diary[meal].push({ id: newFood.id, name, cal, p, c, f, fiber, sodium, qty: 1, serving });
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
  // Use 'in' or != null checks — zero-calorie products (Coke Zero, etc.) are valid
  const useServing = nut['energy-kcal_serving'] != null;
  const hasData = useServing || nut['energy-kcal_100g'] != null;
  if (!hasData) return null;
  const cal = Math.round((useServing ? nut['energy-kcal_serving'] : nut['energy-kcal_100g']) || 0);
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
  // Check shared cache first (works offline, faster)
  const cached = getSharedFoodsCache().find(f => f.code === barcode);
  if (cached) return cached;

  if (!window._networkOk?.()) throw new Error('offline');
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,brands,serving_size,nutriments,image_small_url`;
  const resp = await fetch(url);
  if (resp.status === 404) throw new Error('not_found');
  if (!resp.ok) throw new Error('network');
  const data = await resp.json();
  if (data.status === 0 || !data.product) throw new Error('not_found');
  const mapped = _offMapProduct(data.product);
  if (!mapped) throw new Error('not_found');
  _saveSharedFood(mapped).catch(() => {}); // persist for all clients
  return mapped;
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
  _openWeightModal(food, foodId);
}

/* ══════════════════════════════════════════════════════════════
   BARCODE SCANNER — ZXing JS (iOS Safari + Android Chrome)
   Lazy-loads @zxing/library from jsDelivr CDN on first use.
   Falls back to manual barcode entry if camera is denied.
══════════════════════════════════════════════════════════════ */
function _loadZXing() {
  if (window.ZXing) return Promise.resolve();
  if (window._zxingLoadPromise) return window._zxingLoadPromise;
  window._zxingLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
    s.onload  = () => { window._zxingLoadPromise = null; resolve(); };
    s.onerror = () => { window._zxingLoadPromise = null; reject(new Error('ZXing load failed')); };
    document.head.appendChild(s);
  });
  return window._zxingLoadPromise;
}

async function openNutrBarcodeScanner() {
  // Always try live camera first (ZXing works on iOS Safari + Android)
  if (!navigator.mediaDevices?.getUserMedia) {
    return openNutrBarcodeManual();
  }
  try {
    await _loadZXing();
    openNutrBarcodeCameraScanner();
  } catch (_) {
    // ZXing CDN failed (offline) — fall back to manual
    openNutrBarcodeManual();
  }
}

function openNutrBarcodeManual() {
  document.getElementById('nutrBarcodeModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'nutrBarcodeModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:4300;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box';
  modal.innerHTML = `<div style="background:var(--surface);border-radius:14px;padding:24px 20px;width:100%;max-width:360px">
    <div style="font-family:var(--display);font-weight:700;font-size:22px;letter-spacing:1px;margin-bottom:8px">Enter Barcode</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:14px">Type the barcode digits from your product.</div>
    <input class="fit-input" id="nutrBarcodeInput" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="e.g. 3017620422003" style="font-size:16px;letter-spacing:1px;margin-bottom:14px" autofocus>
    <div id="nutrBarcodeStatus" style="font-family:'Geist Mono',monospace;font-size:10px;color:var(--muted);margin-bottom:14px;min-height:14px"></div>
    <div style="display:flex;gap:10px">
      <button class="ob-next-btn" style="flex:1" onclick="nutrBarcodeManualLookup()">Look Up →</button>
      <button class="ob-back-btn" onclick="document.getElementById('nutrBarcodeModal').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('nutrBarcodeInput')?.focus(), 60);
}

async function nutrBarcodeManualLookup() {
  const input  = document.getElementById('nutrBarcodeInput');
  const status = document.getElementById('nutrBarcodeStatus');
  const code   = (input?.value || '').replace(/\D/g, '');
  if (!code || code.length < 8) {
    if (status) { status.textContent = 'Barcode must be at least 8 digits'; status.style.color = '#e74c3c'; }
    return;
  }
  if (status) { status.textContent = 'Looking up...'; status.style.color = 'var(--muted)'; }
  try {
    const food = await nutrOnlineLookupBarcode(code);
    document.getElementById('nutrBarcodeModal')?.remove();
    window._nutrOffMap = window._nutrOffMap || {};
    window._nutrOffMap[food.id] = food;
    _openQtyModalForFood(food, food.id);
  } catch (err) {
    if (err.message === 'not_found') {
      if (status) {
        status.innerHTML = `Product not found. <span style="text-decoration:underline;cursor:pointer" onclick="document.getElementById('nutrBarcodeModal').remove();openNutrCustomFood('manual','${code}')">Add it for everyone →</span>`;
        status.style.color = '#e74c3c';
      }
    } else if (err.message === 'offline') {
      if (status) { status.textContent = 'No connection — try again when online.'; status.style.color = '#e74c3c'; }
    } else {
      if (status) { status.textContent = 'Lookup failed — check connection.'; status.style.color = '#e74c3c'; }
    }
  }
}

function openNutrBarcodeCameraScanner() {
  document.getElementById('nutrBarcodeCamModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'nutrBarcodeCamModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:4400;background:#000;display:flex;flex-direction:column';
  modal.innerHTML = `
    <div style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,.6)">
      <div style="font-family:var(--display);font-weight:700;font-size:20px;letter-spacing:1px;color:#fff">Scan Barcode</div>
      <button onclick="closeNutrBarcodeCam()" style="background:none;border:none;color:#fff;font-size:26px;line-height:1;cursor:pointer;padding:0 8px">×</button>
    </div>
    <div style="flex:1;position:relative;overflow:hidden">
      <video id="nutrBarcodeVideo" style="width:100%;height:100%;object-fit:cover" playsinline muted autoplay></video>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;max-width:300px;height:110px;border:2px solid var(--accent);border-radius:10px;pointer-events:none;box-shadow:0 0 0 9999px rgba(0,0,0,.4)"></div>
    </div>
    <div id="nutrBarcodeCamStatus" style="padding:14px 20px;text-align:center;font-family:'Geist Mono',monospace;font-size:11px;color:#fff;background:rgba(0,0,0,.6)">Point camera at barcode…</div>
    <div style="padding:10px 20px 24px;background:rgba(0,0,0,.6);display:flex;justify-content:center">
      <button onclick="closeNutrBarcodeCam();openNutrBarcodeManual()" style="background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:10px 24px;font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:1px;cursor:pointer">Enter Manually</button>
    </div>`;
  document.body.appendChild(modal);

  let reader = null;

  AppState._nutrBarcodeAbort = () => {
    try { reader?.reset(); } catch (_) {}
    document.getElementById('nutrBarcodeCamModal')?.remove();
  };

  const video = document.getElementById('nutrBarcodeVideo');
  const status = document.getElementById('nutrBarcodeCamStatus');

  try {
    reader = new ZXing.BrowserMultiFormatReader();
    reader.decodeFromVideoDevice(null, video, async (result, err) => {
      if (!result) return; // err fires every frame with no barcode — ignore
      const code = result.getText();
      try { reader.reset(); } catch (_) {}

      if (status) status.textContent = 'Found: ' + code + ' — looking up…';
      haptic('success');

      try {
        const food = await nutrOnlineLookupBarcode(code);
        closeNutrBarcodeCam();
        window._nutrOffMap = window._nutrOffMap || {};
        window._nutrOffMap[food.id] = food;
        _openQtyModalForFood(food, food.id);
      } catch (err) {
        closeNutrBarcodeCam();
        if (err.message === 'not_found') {
          showFitToast('Product not found — add it to share with everyone');
          setTimeout(() => openNutrCustomFood('manual', code), 400);
        } else if (err.message === 'offline') {
          showFitToast('No connection — scan requires internet');
        } else {
          showFitToast('Lookup failed — check connection');
        }
      }
    });
  } catch (err) {
    if (status) status.textContent = 'Camera error: ' + (err.message || 'denied');
    setTimeout(() => { closeNutrBarcodeCam(); openNutrBarcodeManual(); }, 1800);
  }
}

function closeNutrBarcodeCam() {
  if (AppState._nutrBarcodeAbort) { AppState._nutrBarcodeAbort(); AppState._nutrBarcodeAbort = null; }
  document.getElementById('nutrBarcodeCamModal')?.remove();
}
