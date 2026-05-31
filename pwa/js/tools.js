/* ══════════════════════════════════════════════════════════════
   TOOL PANELS
   - Peptide Dose Calculator  (renderPeptideCalc)
   - Anabolics Reference      (renderAnabolicsRef)
   Reference / calculation only. Nothing persisted.
══════════════════════════════════════════════════════════════ */

/* ── PEPTIDE LIBRARY ─────────────────────────────────────────── */
const PEPTIDE_DB = [
  { id:'bpc157',   name:'BPC-157',           defVial:5,  defBac:2, defDose:300,  range:'Typical: 250–500 mcg/day',                  note:'Healing / gut. Often split AM/PM or post-injury site.' },
  { id:'tb500',    name:'TB-500',            defVial:5,  defBac:2, defDose:2000, range:'Typical: 2–2.5 mg twice weekly (loading)',  note:'Loading 4–6 weeks then taper to weekly maintenance.' },
  { id:'cjc1295',  name:'CJC-1295 (no DAC)', defVial:5,  defBac:2, defDose:100,  range:'Typical: 100 mcg, 2–3× daily',               note:'Stack with Ipamorelin. Inject pre-bed for GH pulse.' },
  { id:'ipamor',   name:'Ipamorelin',        defVial:5,  defBac:2, defDose:200,  range:'Typical: 200–300 mcg, 2–3× daily',           note:'Pairs with CJC. Empty stomach, pre-bed or pre-AM cardio.' },
  { id:'hgh176',   name:'HGH Frag 176-191',  defVial:5,  defBac:2, defDose:500,  range:'Typical: 250–500 mcg, 1–3× daily',           note:'Fat-loss fragment. Fasted state for best lipolysis.' },
  { id:'semag',    name:'Semaglutide',       defVial:5,  defBac:2, defDose:250,  range:'Typical: 0.25–2.4 mg WEEKLY (titrate up)',   note:'Weekly dose. Start 0.25 mg/wk, titrate every 4 weeks.' },
  { id:'pt141',    name:'PT-141',            defVial:10, defBac:2, defDose:1000, range:'Typical: 0.5–2 mg as-needed',                note:'Sub-Q 30–60 min before. Watch for nausea / flush.' },
  { id:'hexarel',  name:'Hexarelin',         defVial:5,  defBac:2, defDose:150,  range:'Typical: 100–200 mcg, 2–3× daily',           note:'Strong GHRP. Tolerance builds — cycle 4–6 weeks on.' },
  { id:'ghrp2',    name:'GHRP-2',            defVial:5,  defBac:2, defDose:200,  range:'Typical: 100–300 mcg, 2–3× daily',           note:'Mild hunger increase. Pairs with CJC no-DAC.' },
  { id:'ghrp6',    name:'GHRP-6',            defVial:5,  defBac:2, defDose:200,  range:'Typical: 100–300 mcg, 2–3× daily',           note:'Strong hunger pulse — useful for bulks.' },
  { id:'selank',   name:'Selank',            defVial:5,  defBac:2, defDose:400,  range:'Typical: 250–500 mcg, 1–3× daily',           note:'Anxiolytic. Intranasal preferred but sub-Q works.' },
  { id:'semax',    name:'Semax',             defVial:5,  defBac:2, defDose:500,  range:'Typical: 250–600 mcg, 1–3× daily',           note:'Nootropic. Best intranasal; if injected, sub-Q.' },
];

const PepState = { pepId:'bpc157', vial:5, bac:2, dose:300, freq:'daily' };

function _pepGet(){ return PEPTIDE_DB.find(p => p.id === PepState.pepId) || PEPTIDE_DB[0]; }

function renderPeptideCalc() {
  const p = _pepGet();
  const opts = PEPTIDE_DB.map(x => `<option value="${x.id}"${x.id===PepState.pepId?' selected':''}>${x.name}</option>`).join('');
  return `
    <div class="chart-card">
      <div class="chart-title">Peptide</div>
      <div class="tool-section">
        <label class="tool-section-title">Select Peptide</label>
        <select class="tool-select" id="pep-select" onchange="pepOnSelect(this.value)">${opts}</select>
        <div class="tool-helper">${p.note}</div>
      </div>
    </div>

    <div class="chart-card">
      <div class="chart-title">Reconstitution</div>
      <div class="ob-input-row" style="margin-bottom:14px">
        <div class="ob-field" style="margin:0">
          <label class="ob-label">Vial Size (mg)</label>
          <input class="ob-input" type="number" inputmode="decimal" step="0.1" min="0" id="pep-vial" value="${PepState.vial}" oninput="pepUpdate()">
        </div>
        <div class="ob-field" style="margin:0">
          <label class="ob-label">BAC Water (mL)</label>
          <input class="ob-input" type="number" inputmode="decimal" step="0.1" min="0.1" id="pep-bac" value="${PepState.bac}" oninput="pepUpdate()">
        </div>
      </div>
      <div class="ob-field" style="margin:0">
        <label class="ob-label">Desired Dose (mcg)</label>
        <input class="ob-input" type="number" inputmode="decimal" step="1" min="0" id="pep-dose" value="${PepState.dose}" oninput="pepUpdate()">
        <div class="tool-helper" id="pep-range">${p.range}</div>
      </div>
    </div>

    <div class="chart-card">
      <div class="chart-title">Result</div>
      <div class="tool-result-grid">
        <div class="tool-result">
          <div class="tool-result-val" id="pep-units">—</div>
          <div class="tool-result-lbl">Insulin Units</div>
        </div>
        <div class="tool-result">
          <div class="tool-result-val" id="pep-volume">—</div>
          <div class="tool-result-lbl">Volume (mL)</div>
        </div>
      </div>
      <div class="tool-helper" id="pep-concentration" style="text-align:center;margin-top:10px"></div>
    </div>

    <div class="chart-card">
      <div class="chart-title">Frequency</div>
      <div class="tool-freq-row">
        <button class="tool-freq-btn${PepState.freq==='daily'?' active':''}" onclick="pepSetFreq('daily')">Daily</button>
        <button class="tool-freq-btn${PepState.freq==='eod'?' active':''}"   onclick="pepSetFreq('eod')">EOD</button>
        <button class="tool-freq-btn${PepState.freq==='twice'?' active':''}" onclick="pepSetFreq('twice')">2× Daily</button>
      </div>
      <div class="tool-helper" id="pep-weekly" style="margin-top:14px;text-align:center;font-size:12px;color:var(--text)"></div>
    </div>

    <div class="chart-card">
      <div class="chart-title">Reconstitution Guide</div>
      <div id="pep-guide"></div>
    </div>

    <div class="chart-card" style="background:rgba(231,76,60,.04);border-color:rgba(231,76,60,.25)">
      <div class="tool-helper" style="font-size:11px;color:var(--muted);line-height:1.6">
        Reference / educational use only. Calculations assume a standard U-100 insulin syringe (100 units = 1 mL).
        Not medical advice. Verify dose against current research literature before use.
      </div>
    </div>
  `;
}

function pepOnSelect(id) {
  const p = PEPTIDE_DB.find(x => x.id === id); if (!p) return;
  PepState.pepId = id;
  PepState.vial  = p.defVial;
  PepState.bac   = p.defBac;
  PepState.dose  = p.defDose;
  // Re-render to update input defaults + helper
  const body = document.getElementById('feature-peptides-body');
  if (body) body.innerHTML = renderPeptideCalc();
  pepUpdate();
}

function pepSetFreq(f) {
  PepState.freq = f;
  document.querySelectorAll('.tool-freq-btn').forEach(b => b.classList.remove('active'));
  const map = { daily:0, eod:1, twice:2 };
  const btns = document.querySelectorAll('.tool-freq-btn');
  if (btns[map[f]]) btns[map[f]].classList.add('active');
  pepUpdate();
}

function pepUpdate() {
  const vial = parseFloat(document.getElementById('pep-vial')?.value) || 0;
  const bac  = parseFloat(document.getElementById('pep-bac')?.value)  || 0;
  const dose = parseFloat(document.getElementById('pep-dose')?.value) || 0;
  PepState.vial = vial; PepState.bac = bac; PepState.dose = dose;

  const unitsEl   = document.getElementById('pep-units');
  const volEl     = document.getElementById('pep-volume');
  const concEl    = document.getElementById('pep-concentration');
  const weeklyEl  = document.getElementById('pep-weekly');
  const guideEl   = document.getElementById('pep-guide');

  if (!(vial > 0 && bac > 0 && dose > 0)) {
    if (unitsEl)  unitsEl.textContent  = '—';
    if (volEl)    volEl.textContent    = '—';
    if (concEl)   concEl.textContent   = '';
    if (weeklyEl) weeklyEl.textContent = '';
    if (guideEl)  guideEl.innerHTML    = '<div class="tool-helper">Enter vial size, BAC water, and dose to generate steps.</div>';
    return;
  }

  // mg/mL concentration
  const mgPerMl   = vial / bac;                       // mg per mL
  const mcgPerMl  = mgPerMl * 1000;                   // mcg per mL
  const mcgPerUnit = mcgPerMl / 100;                  // 100 units = 1 mL
  const volumeMl  = dose / mcgPerMl;                  // mL needed for dose
  const units     = volumeMl * 100;                   // insulin units

  if (unitsEl) unitsEl.textContent = units.toFixed(units < 10 ? 1 : 0);
  if (volEl)   volEl.textContent   = volumeMl.toFixed(volumeMl < 0.1 ? 3 : 2);
  if (concEl)  concEl.textContent  = `Concentration: ${mgPerMl.toFixed(2)} mg/mL  ·  ${mcgPerUnit.toFixed(1)} mcg/unit`;

  // Weekly total
  const perDay = PepState.freq === 'daily' ? 1 : PepState.freq === 'eod' ? 0.5 : 2;
  const weeklyMcg = dose * perDay * 7;
  const weeklyMg  = weeklyMcg / 1000;
  if (weeklyEl) {
    const freqLbl = PepState.freq === 'daily' ? 'daily' : PepState.freq === 'eod' ? 'every other day' : 'twice daily';
    weeklyEl.innerHTML = `<b style="color:var(--accent)">Weekly total: ${weeklyMcg.toLocaleString()} mcg</b> (${weeklyMg.toFixed(2)} mg) · ${dose} mcg ${freqLbl}`;
  }

  // Reconstitution guide
  if (guideEl) {
    const u10 = (10 / 100) * mcgPerMl;   // mcg in 10 units
    const u20 = (20 / 100) * mcgPerMl;
    const steps = [
      `Swab the rubber stopper of your <b>${vial} mg</b> vial with alcohol.`,
      `Draw <b>${bac} mL</b> bacteriostatic water into a syringe.`,
      `Slowly inject the BAC water down the inside wall of the vial — do not blast it onto the powder.`,
      `Gently swirl until fully dissolved. Do not shake.`,
      `Store reconstituted vial refrigerated (2–8 °C). Use within ~30 days.`,
      `Concentration: <b>${mgPerMl.toFixed(2)} mg/mL</b>. Each <b>10 units</b> on the syringe = <b>${u10.toFixed(0)} mcg</b>. Each <b>20 units</b> = <b>${u20.toFixed(0)} mcg</b>.`,
      `For your <b>${dose} mcg</b> dose: draw to <b>${units.toFixed(units < 10 ? 1 : 0)} units</b> (≈ ${volumeMl.toFixed(2)} mL).`,
    ];
    guideEl.innerHTML = steps.map((s,i) => `
      <div class="tool-step">
        <div class="tool-step-num">${i+1}</div>
        <div class="tool-step-txt">${s}</div>
      </div>`).join('');
  }
}

/* ══════════════════════════════════════════════════════════════
   ANABOLICS REFERENCE
══════════════════════════════════════════════════════════════ */
const ANABOLIC_DB = [
  // Testosterone esters
  { id:'test-e',  name:'Testosterone Enanthate',  cat:'AAS', halfLife:'~7 days',     beg:'300–500 mg/wk', int:'500–750 mg/wk', adv:'750 mg+/wk',
    detect:'~3 months', arom:'high', tags:['Bulk','Recomp','Strength'],
    sides:['Estrogen rise (water, gyno risk)','Acne / oily skin','HPTA suppression','Elevated hematocrit','BP elevation'], pct:'Yes' },
  { id:'test-c',  name:'Testosterone Cypionate',  cat:'AAS', halfLife:'~8 days',     beg:'300–500 mg/wk', int:'500–750 mg/wk', adv:'750 mg+/wk',
    detect:'~3 months', arom:'high', tags:['Bulk','Recomp','Strength'],
    sides:['Estrogen rise','Acne','HPTA suppression','Hematocrit rise','BP elevation'], pct:'Yes' },
  { id:'test-p',  name:'Testosterone Propionate', cat:'AAS', halfLife:'~2 days',     beg:'50–100 mg EOD', int:'100–150 mg EOD', adv:'150 mg+ EOD',
    detect:'~2–3 weeks', arom:'high', tags:['Cut','Recomp'],
    sides:['Painful injections (PIP)','Frequent pinning','Estrogen rise','HPTA suppression','Acne'], pct:'Yes' },
  { id:'test-s',  name:'Testosterone Suspension', cat:'AAS', halfLife:'~24 h',       beg:'50–100 mg/day', int:'100 mg/day',     adv:'100–200 mg pre-workout',
    detect:'~1–2 days',  arom:'high', tags:['Strength','Cut'],
    sides:['Daily injections required','Severe PIP','Sharp estrogen swings','HPTA suppression','BP spikes'], pct:'Yes' },

  // Nandrolone
  { id:'npp',     name:'Nandrolone Phenylprop (NPP)', cat:'AAS', halfLife:'~3 days', beg:'200–300 mg/wk', int:'300–500 mg/wk', adv:'500 mg+/wk',
    detect:'~12 months', arom:'low', tags:['Bulk','Recovery'],
    sides:['Progestin sides (deca-dick)','Prolactin rise','HPTA suppression','Joint/skin lubrication','Long recovery'], pct:'Yes' },
  { id:'deca',    name:'Nandrolone Decanoate (Deca)', cat:'AAS', halfLife:'~7–12 days', beg:'200–400 mg/wk', int:'400–600 mg/wk', adv:'600 mg+/wk',
    detect:'~18 months', arom:'low', tags:['Bulk','Recovery'],
    sides:['Deca-dick / libido drop','Prolactin rise','Slow kick-in','Long detection','Heavy suppression'], pct:'Yes' },

  // Trenbolone
  { id:'tren-a',  name:'Trenbolone Acetate',  cat:'AAS', halfLife:'~2 days',  beg:'(not recommended)', int:'50–75 mg EOD',  adv:'75–100 mg EOD',
    detect:'~5 months', arom:'none', tags:['Cut','Recomp','Strength'],
    sides:['Night sweats / insomnia','Tren cough','Aggression / anxiety','Cardio impairment','Prolactin sides'], pct:'Yes' },
  { id:'tren-e',  name:'Trenbolone Enanthate', cat:'AAS', halfLife:'~7 days', beg:'(not recommended)', int:'200–300 mg/wk', adv:'300–400 mg/wk',
    detect:'~5 months', arom:'none', tags:['Cut','Recomp','Strength'],
    sides:['Night sweats','Insomnia','Aggression','BP elevation','Prolactin sides'], pct:'Yes' },

  // Boldenone
  { id:'eq',      name:'Boldenone (EQ)', cat:'AAS', halfLife:'~14 days', beg:'300–500 mg/wk', int:'500–800 mg/wk', adv:'800 mg+/wk',
    detect:'~5 months', arom:'low', tags:['Bulk','Recomp'],
    sides:['Hematocrit / RBC rise','Increased appetite','Slow kick-in (6+ wk)','Mild estrogenic','Anxiety in some users'], pct:'Yes' },

  // Masteron
  { id:'mast-e',  name:'Masteron Enanthate',  cat:'AAS', halfLife:'~7 days', beg:'300–400 mg/wk', int:'400–600 mg/wk', adv:'600 mg+/wk',
    detect:'~3 months', arom:'none', tags:['Cut','Recomp'],
    sides:['Hair loss acceleration','Acne','HPTA suppression','Aggression','Dry joints'], pct:'Yes' },
  { id:'mast-p',  name:'Masteron Propionate', cat:'AAS', halfLife:'~2 days', beg:'100 mg EOD',   int:'100–150 mg EOD', adv:'150 mg+ EOD',
    detect:'~3 weeks',  arom:'none', tags:['Cut','Recomp'],
    sides:['Hair loss','Acne','HPTA suppression','PIP from prop','Aggression'], pct:'Yes' },

  // Orals
  { id:'anavar',   name:'Anavar (Oxandrolone)',  cat:'AAS', halfLife:'~9 h',  beg:'20–40 mg/day', int:'40–60 mg/day', adv:'60–80 mg/day',
    detect:'~3 weeks',  arom:'none', tags:['Cut','Strength','Recomp'],
    sides:['Hepatic strain (mild)','Lipid impact (LDL↑/HDL↓)','HPTA suppression','Headaches','Pumps'], pct:'Yes' },
  { id:'winny',    name:'Winstrol (Stanozolol)', cat:'AAS', halfLife:'~9 h',  beg:'25–50 mg/day', int:'50 mg/day',    adv:'50–75 mg/day',
    detect:'~9 weeks',  arom:'none', tags:['Cut','Strength'],
    sides:['Joint dryness / pain','Lipid impact','Hepatic strain','Tendon brittleness','Hair loss'], pct:'Yes' },
  { id:'dbol',     name:'Dianabol (Methandrostenolone)', cat:'AAS', halfLife:'~5 h', beg:'20–30 mg/day', int:'30–50 mg/day', adv:'50 mg+/day',
    detect:'~5 weeks',  arom:'high', tags:['Bulk','Strength'],
    sides:['Water retention','BP elevation','Hepatic strain','Gyno risk','Hunger / lethargy'], pct:'Yes' },
  { id:'adrol',    name:'Anadrol (Oxymetholone)', cat:'AAS', halfLife:'~9 h', beg:'25–50 mg/day', int:'50 mg/day',    adv:'50–100 mg/day',
    detect:'~8 weeks',  arom:'moderate', tags:['Bulk','Strength'],
    sides:['Strong hepatic strain','BP spikes','Water bloat','Headaches / lethargy','Appetite loss at high doses'], pct:'Yes' },
  { id:'primo',    name:'Primobolan (Methenolone)', cat:'AAS', halfLife:'~10 days (E)', beg:'300–500 mg/wk', int:'500–700 mg/wk', adv:'700 mg+/wk',
    detect:'~5 months', arom:'none', tags:['Cut','Recomp'],
    sides:['Mild hair loss risk','Mild lipid impact','HPTA suppression','High cost / fakes common','Slow kick-in'], pct:'Yes' },
  { id:'sdrol',    name:'Superdrol (Methasterone)', cat:'AAS', halfLife:'~8 h', beg:'10 mg/day', int:'20 mg/day', adv:'30 mg/day',
    detect:'~5 weeks',  arom:'none', tags:['Bulk','Strength'],
    sides:['Severe hepatic strain','Crushing lipid profile','Lethargy / back pumps','BP spikes','HPTA shutdown'], pct:'Yes' },

  // SARMs
  { id:'lgd',      name:'LGD-4033 (Ligandrol)',  cat:'SARM', halfLife:'~24 h', beg:'5 mg/day',  int:'7.5 mg/day',  adv:'10 mg/day',
    detect:'~3–4 weeks', arom:'none', tags:['Bulk','Recomp'],
    sides:['HPTA suppression (mod)','Mild lipid impact','Water retention','Hepatic strain (mild)','Lethargy'], pct:'Yes' },
  { id:'rad',      name:'RAD-140 (Testolone)',   cat:'SARM', halfLife:'~16–20 h', beg:'5 mg/day', int:'10 mg/day', adv:'15–20 mg/day',
    detect:'~3 weeks',   arom:'none', tags:['Bulk','Strength','Recomp'],
    sides:['HPTA suppression','Aggression','Headaches','Hepatic strain','Hair shedding'], pct:'Yes' },
  { id:'mk677',    name:'MK-677 (Ibutamoren)',   cat:'SARM', halfLife:'~24 h', beg:'10 mg/day', int:'20 mg/day', adv:'25 mg/day',
    detect:'~weeks (uncommonly tested)', arom:'none', tags:['Bulk','Recovery'],
    sides:['Intense hunger','Water retention','Lethargy / tingling hands','Prolactin rise','Insulin resistance risk'], pct:'No' },
  { id:'card',     name:'Cardarine (GW-501516)', cat:'SARM', halfLife:'~24 h', beg:'10 mg/day', int:'15 mg/day', adv:'20 mg/day',
    detect:'~weeks (rarely tested)', arom:'none', tags:['Cut','Recovery'],
    sides:['Animal carcinogen signal at high dose','Headaches','Run 8 wk max windows','Limited human data','None acute typical'], pct:'No' },
  { id:'ost',      name:'Ostarine (MK-2866)',    cat:'SARM', halfLife:'~24 h', beg:'10 mg/day', int:'20 mg/day', adv:'25 mg/day',
    detect:'~3–4 weeks', arom:'none', tags:['Recomp','Cut','Recovery'],
    sides:['Mild HPTA suppression','Mild lipid impact','Possible hepatic strain','Joint relief reported','Vision tint (rare)'], pct:'Maybe' },
];

const PCT_TEMPLATES = {
  none:    { label:'No PCT recommended', body:'Compounds selected do not warrant traditional PCT. Monitor lipids and bloodwork; consider OTC support.' },
  light:   { label:'Light PCT (SARM / mild)', body:
              'Weeks 1–4: Nolvadex 20 mg/day OR Enclomiphene 12.5 mg/day. ' +
              'Optional: low-dose HCGenerate / natural test support.' },
  classic: { label:'Classic PCT (AAS cycle)', body:
              'Wait for last ester clearance (Test E/C: 2 wk after; Test P: 3 days after; Tren A: 3 days; Tren E: 2 wk; Deca: 3 wk). ' +
              'Then: Weeks 1–2: Clomid 50 mg/day + Nolvadex 20 mg/day. ' +
              'Weeks 3–4: Clomid 25 mg/day + Nolvadex 10 mg/day. ' +
              'Consider HCG 500–1000 IU 2×/wk for last 2 weeks of cycle.' },
  heavy:   { label:'Heavy PCT (long ester / 19-nor)', body:
              'Wait 3 weeks after last pin (or longer for Deca). ' +
              'Weeks 1–2: Clomid 50 mg/day + Nolvadex 40 mg/day. ' +
              'Weeks 3–4: Clomid 50 mg/day + Nolvadex 20 mg/day. ' +
              'Weeks 5–6: Clomid 25 mg/day + Nolvadex 10 mg/day. ' +
              'HCG 1000 IU 2×/wk in final 2–3 weeks of cycle to restart Leydig cells. ' +
              'Caber 0.25 mg 2×/wk if prolactin issues with 19-nor.' },
};

const AnaState = {
  search:'',
  cat:'all',          // all|AAS|SARM
  tag:'all',          // all|Bulk|Cut|Recomp|Strength|Recovery
  arom:'all',         // all|none|low|moderate|high
  tab:'browse',       // browse|cycle|pct
  cycle: [],          // [{id, weeks, dose}]
};

function renderAnabolicsRef() {
  const tabs = `
    <div class="subtab-row">
      <button class="subtab${AnaState.tab==='browse'?' active':''}" onclick="anaSetTab('browse')">Compounds</button>
      <button class="subtab${AnaState.tab==='cycle'?' active':''}"  onclick="anaSetTab('cycle')">Cycle Builder</button>
      <button class="subtab${AnaState.tab==='pct'?' active':''}"    onclick="anaSetTab('pct')">PCT Plan</button>
    </div>`;
  let body = '';
  if (AnaState.tab === 'browse') body = _anaBrowseHtml();
  else if (AnaState.tab === 'cycle') body = _anaCycleHtml();
  else if (AnaState.tab === 'pct')   body = _anaPctHtml();
  return tabs + body + `
    <div class="chart-card" style="background:rgba(231,76,60,.04);border-color:rgba(231,76,60,.25)">
      <div class="tool-helper" style="font-size:11px;color:var(--muted);line-height:1.6">
        Reference / educational use only. Dose ranges reflect commonly reported user practice — not medical recommendation.
        Bloodwork pre / mid / post cycle is non-negotiable. Not a substitute for medical supervision.
      </div>
    </div>`;
}

function _anaBadge(level) {
  const lbl = { none:'No Arom', low:'Low Arom', moderate:'Mod Arom', high:'High Arom' }[level] || level;
  return `<span class="cmpd-badge arom-${level}">${lbl}</span>`;
}

function _anaBrowseHtml() {
  const cats   = ['all','AAS','SARM'];
  const tagOpts = ['all','Bulk','Cut','Recomp','Strength','Recovery'];
  const aroms  = ['all','none','low','moderate','high'];
  const aromLbl = { all:'All', none:'No Arom', low:'Low', moderate:'Mod', high:'High' };

  const search = `
    <div class="chart-card">
      <div class="tool-section">
        <label class="tool-section-title">Search</label>
        <input class="ob-input" type="text" placeholder="Search compound name…" id="ana-search" value="${esc(AnaState.search)}" oninput="anaOnSearch(this.value)">
      </div>
      <div class="tool-section">
        <label class="tool-section-title">Category</label>
        <div class="filter-row">
          ${cats.map(c => `<button class="filter-chip${AnaState.cat===c?' active':''}" onclick="anaSetFilter('cat','${c}')">${c==='all'?'All':c}</button>`).join('')}
        </div>
      </div>
      <div class="tool-section">
        <label class="tool-section-title">Use Case</label>
        <div class="filter-row">
          ${tagOpts.map(t => `<button class="filter-chip${AnaState.tag===t?' active':''}" onclick="anaSetFilter('tag','${t}')">${t==='all'?'All':t}</button>`).join('')}
        </div>
      </div>
      <div class="tool-section" style="margin-bottom:0">
        <label class="tool-section-title">Aromatization</label>
        <div class="filter-row">
          ${aroms.map(a => `<button class="filter-chip${AnaState.arom===a?' active':''}" onclick="anaSetFilter('arom','${a}')">${aromLbl[a]}</button>`).join('')}
        </div>
      </div>
    </div>`;

  const filtered = ANABOLIC_DB.filter(c => {
    if (AnaState.cat !== 'all' && c.cat !== AnaState.cat) return false;
    if (AnaState.tag !== 'all' && !c.tags.includes(AnaState.tag)) return false;
    if (AnaState.arom !== 'all' && c.arom !== AnaState.arom) return false;
    if (AnaState.search) {
      const q = AnaState.search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.tags.join(' ').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const list = filtered.length === 0
    ? `<div class="chart-card"><div class="chart-empty">No compounds match those filters.</div></div>`
    : filtered.map(c => `
        <div class="cmpd-card">
          <div class="cmpd-head">
            <div>
              <div class="cmpd-name">${esc(c.name)}</div>
              <div class="cmpd-cat">${c.cat}</div>
            </div>
            ${_anaBadge(c.arom)}
          </div>
          <div class="cmpd-tags">${c.tags.map(t => `<span class="cmpd-tag">${t}</span>`).join('')}</div>
          <div class="cmpd-spec-grid">
            <div class="cmpd-spec"><span>Half-life</span><b>${c.halfLife}</b></div>
            <div class="cmpd-spec"><span>Detection</span><b>${c.detect}</b></div>
            <div class="cmpd-spec"><span>Beginner</span><b>${c.beg}</b></div>
            <div class="cmpd-spec"><span>Intermediate</span><b>${c.int}</b></div>
            <div class="cmpd-spec"><span>Advanced</span><b>${c.adv}</b></div>
            <div class="cmpd-spec"><span>PCT</span><b>${c.pct}</b></div>
          </div>
          <div class="cmpd-effects">
            <div class="cmpd-effects-title">Key side effects</div>
            <ul>${c.sides.slice(0,5).map(s => `<li>${esc(s)}</li>`).join('')}</ul>
          </div>
          <div class="cmpd-pct-row">
            <span>Add to cycle builder</span>
            <button class="filter-chip" style="border-color:var(--accent);color:var(--accent)" onclick="anaAddToCycle('${c.id}')">+ Add</button>
          </div>
        </div>`).join('');

  return search + list;
}

function _anaCycleHtml() {
  const opts = ANABOLIC_DB.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  let rows = '';
  if (AnaState.cycle.length === 0) {
    rows = `<div class="chart-empty">No compounds yet. Add 2–4 below or from the Compounds tab.</div>`;
  } else {
    rows = AnaState.cycle.map((row, i) => {
      const c = ANABOLIC_DB.find(x => x.id === row.id);
      return `
        <div class="cycle-pick-row">
          <select onchange="anaCycleEdit(${i},'id',this.value)">
            ${ANABOLIC_DB.map(x => `<option value="${x.id}"${x.id===row.id?' selected':''}>${x.name}</option>`).join('')}
          </select>
          <input type="number" min="1" max="20" value="${row.weeks}" onchange="anaCycleEdit(${i},'weeks',this.value)" placeholder="Weeks">
          <button onclick="anaCycleRemove(${i})" aria-label="Remove">×</button>
        </div>`;
    }).join('');
  }

  // Total cycle length
  const maxWeeks = AnaState.cycle.length ? Math.max(...AnaState.cycle.map(r => r.weeks || 0)) : 0;
  let grid = '';
  if (maxWeeks > 0) {
    const weeks = Array.from({length: maxWeeks}, (_,i) => i+1);
    const head = `<tr><th>Compound</th>${weeks.map(w => `<th>W${w}</th>`).join('')}</tr>`;
    const body = AnaState.cycle.map(row => {
      const c = ANABOLIC_DB.find(x => x.id === row.id);
      const cells = weeks.map(w => w <= row.weeks ? `<td class="on">●</td>` : `<td>·</td>`).join('');
      return `<tr><td class="cycle-cell-name">${c?esc(c.name):'—'}</td>${cells}</tr>`;
    }).join('');
    grid = `
      <div class="chart-card">
        <div class="chart-title">Week-by-Week</div>
        <div class="cycle-grid"><table>${head}${body}</table></div>
        <div class="tool-helper" style="margin-top:10px">Cycle length: <b style="color:var(--accent)">${maxWeeks} weeks</b></div>
      </div>`;
  }

  return `
    <div class="chart-card">
      <div class="chart-title">Build Cycle</div>
      <div class="tool-helper" style="margin-bottom:10px">Pick 2–4 compounds and set the active weeks for each.</div>
      ${rows}
      ${AnaState.cycle.length < 4 ? `<button class="cycle-add-btn" onclick="anaCycleAdd()" style="margin-top:10px">+ Add Compound</button>` : ''}
    </div>
    ${grid}
  `;
}

function _anaPctHtml() {
  const proto = _anaSuggestPct();
  const cycleNames = AnaState.cycle.map(r => {
    const c = ANABOLIC_DB.find(x => x.id === r.id); return c ? c.name : '';
  }).filter(Boolean);

  return `
    <div class="chart-card">
      <div class="chart-title">Suggested PCT</div>
      ${cycleNames.length === 0
        ? `<div class="chart-empty">Add compounds in the Cycle Builder tab to generate a PCT plan.</div>`
        : `
          <div class="tool-helper" style="margin-bottom:10px">Based on:</div>
          <div class="cmpd-tags" style="margin-bottom:14px">${cycleNames.map(n => `<span class="cmpd-tag">${esc(n)}</span>`).join('')}</div>
          <div style="font-family:'Geist',sans-serif;font-size:15px;font-weight:700;color:var(--accent);margin-bottom:6px">${proto.label}</div>
          <div style="font-size:13px;color:var(--text);line-height:1.7">${proto.body}</div>
        `}
    </div>
    <div class="chart-card">
      <div class="chart-title">PCT Notes</div>
      <ul style="list-style:none;padding:0;margin:0">
        <li class="tool-step"><div class="tool-step-num">1</div><div class="tool-step-txt">Get full bloodwork pre-cycle and 4 weeks post-PCT (testosterone, LH, FSH, E2, lipids, liver, CBC).</div></li>
        <li class="tool-step"><div class="tool-step-num">2</div><div class="tool-step-txt">Time PCT start to last ester clearance (~5× half-life).</div></li>
        <li class="tool-step"><div class="tool-step-num">3</div><div class="tool-step-txt">Keep training and calories high during PCT to preserve gains.</div></li>
        <li class="tool-step"><div class="tool-step-num">4</div><div class="tool-step-txt">If LH/FSH/Test do not recover by 6 weeks post-PCT, see an endocrinologist.</div></li>
      </ul>
    </div>`;
}

function _anaSuggestPct() {
  if (!AnaState.cycle.length) return PCT_TEMPLATES.none;
  const sel = AnaState.cycle.map(r => ANABOLIC_DB.find(c => c.id === r.id)).filter(Boolean);
  const allSarmsNoPct = sel.every(c => c.cat === 'SARM' && (c.pct === 'No' || c.pct === 'Maybe'));
  const anyNandrolone = sel.some(c => /Nandrolone/i.test(c.name));
  const anyLongEster  = sel.some(c => /Enanthate|Cypionate|EQ|Primobolan|Decanoate/i.test(c.name));
  const anyAAS        = sel.some(c => c.cat === 'AAS');
  const anySarmYes    = sel.some(c => c.cat === 'SARM' && c.pct === 'Yes');

  if (allSarmsNoPct) return PCT_TEMPLATES.none;
  if (anyNandrolone) return PCT_TEMPLATES.heavy;
  if (anyAAS && anyLongEster) return PCT_TEMPLATES.heavy;
  if (anyAAS) return PCT_TEMPLATES.classic;
  if (anySarmYes) return PCT_TEMPLATES.light;
  return PCT_TEMPLATES.light;
}

/* ── ANABOLICS HANDLERS ─────────────────────────────────────── */
function _anaRerender() {
  const body = document.getElementById('feature-anabolics-body');
  if (body) body.innerHTML = renderAnabolicsRef();
}
function anaSetTab(t)         { AnaState.tab = t; _anaRerender(); }
function anaSetFilter(k, v)   { AnaState[k] = v; _anaRerender(); }
function anaOnSearch(v)       {
  AnaState.search = v;
  // Re-render only the list area would be nicer, but full re-render is fine for this scale
  // Preserve focus on search input
  const before = document.getElementById('ana-search');
  const caret  = before ? before.selectionStart : null;
  _anaRerender();
  const after = document.getElementById('ana-search');
  if (after) { after.focus(); if (caret != null) try { after.setSelectionRange(caret, caret); } catch(_){} }
}
function anaAddToCycle(id) {
  if (AnaState.cycle.length >= 4) { if (typeof showFitToast === 'function') showFitToast('Max 4 compounds'); return; }
  if (AnaState.cycle.some(r => r.id === id)) { if (typeof showFitToast === 'function') showFitToast('Already in cycle'); return; }
  AnaState.cycle.push({ id, weeks: 8 });
  AnaState.tab = 'cycle';
  _anaRerender();
}
function anaCycleAdd() {
  if (AnaState.cycle.length >= 4) return;
  const used = new Set(AnaState.cycle.map(r => r.id));
  const next = ANABOLIC_DB.find(c => !used.has(c.id)) || ANABOLIC_DB[0];
  AnaState.cycle.push({ id: next.id, weeks: 8 });
  _anaRerender();
}
function anaCycleEdit(i, key, val) {
  if (!AnaState.cycle[i]) return;
  if (key === 'weeks') {
    const n = Math.max(1, Math.min(20, parseInt(val,10) || 1));
    AnaState.cycle[i].weeks = n;
  } else if (key === 'id') {
    AnaState.cycle[i].id = val;
  }
  _anaRerender();
}
function anaCycleRemove(i) {
  AnaState.cycle.splice(i, 1);
  _anaRerender();
}
