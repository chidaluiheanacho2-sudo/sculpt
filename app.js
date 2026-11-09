"use strict";
/* Sculpt — face, skin, posture and hydration routine. All data stays on this device. */
const VERSION = "1.5.0";
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => iso(new Date());
const parseISO = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
const nice = s => parseISO(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const uid = () => Math.random().toString(36).slice(2, 10);
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- content ---------- */
const CHECKS = [
  { id: "am", name: "Morning skincare", sub: "Cleanse, moisturise, SPF" },
  { id: "pm", name: "Evening skincare", sub: "Cleanse, eye serum, moisturise" },
  { id: "posture", name: "Posture routine", sub: "About 8 minutes" },
  { id: "salt", name: "Kept salt low", sub: "No takeaway, crisps or processed meat" },
  { id: "potassium", name: "3 potassium foods", sub: "Potato, banana, yogurt, tomatoes, spinach" },
  { id: "sleep", name: "7½ hours or more in bed", sub: "Puffiness and eye bags get worse on short sleep" },
  { id: "lymph", name: "Morning lymph drain", sub: "About 6 minutes, see Debloat" },
  { id: "gut", name: "Gut foods", sub: "Fibre, a fermented food, 3 different plants" },
  { id: "oral", name: "Brushed and flossed", sub: "2 minutes twice a day, floss at night" },
  { id: "readam", name: "Read 20 pages (morning)", sub: "About 25 minutes, before you open your phone" },
  { id: "readpm", name: "Read 20 pages (night)", sub: "Book instead of phone before bed" }
];
const SUPPS = [
  { id: "d3", name: "Vitamin D3", when: "am", sub: "With breakfast", note: "Take it with a meal that has some fat in it. The NHS suggests 10 micrograms (400 IU) a day through autumn and winter, when UK sunlight is too weak. Don't go above 100 micrograms (4,000 IU) a day." },
  { id: "omega3", name: "Omega-3 fish oil", when: "am", sub: "With breakfast", note: "Take it with food to cut fishy burps. If you eat oily fish (salmon, mackerel, sardines) once a week you may not need it. Keep EPA and DHA together under about 3 g a day, and ask a pharmacist first if you take blood thinners." },
  { id: "mg", name: "Magnesium glycinate", when: "pm", sub: "Evening", note: "A good form, gentle on the stomach, and evening suits it. The NHS says 400 mg a day or less from supplements. Loose stools mean the dose is too high." },
  { id: "ash", name: "Ashwagandha", when: "pm", sub: "Evening", flag: true, note: "Small studies show less stress and slightly better sleep, but the evidence is modest. There are rare reports of liver injury and UK and EU regulators have looked at its safety. Avoid it with thyroid problems or regular medicines. Stop and see a GP if you get yellow skin or eyes, dark pee or stomach pain. It's optional: many people use it for a stretch rather than forever." },
  { id: "creatine", name: "Creatine monohydrate", when: "am", sub: "Any time, same every day", note: "The most researched sports supplement, with strong evidence for strength and muscle, and safe for healthy adults in studies lasting years. Take 3 to 5 g a day, any time. It can add 1 to 2 kg of water inside your muscles in the first weeks, so don't read that as fat. Skip it with kidney problems or kidney-affecting medicines, and buy a batch-tested brand (Informed Sport or Informed Choice)." }
];
const QUIZ = [
  { q: "An hour after washing your face, with nothing on it, it feels…", o: [["Tight, maybe flaky", "dry"], ["Comfortable", "normal"], ["Shiny on the forehead and nose only", "combo"], ["Shiny all over", "oily"]] },
  { q: "By the middle of the day your forehead and nose are…", o: [["Dry or rough", "dry"], ["About the same", "normal"], ["A bit shiny", "combo"], ["Greasy", "oily"]] },
  { q: "Your pores look…", o: [["Barely visible", "dry"], ["Small", "normal"], ["Bigger on the nose", "combo"], ["Big on the nose and cheeks", "oily"]] },
  { q: "How often do you get spots?", o: [["Hardly ever", "clear"], ["Now and then", "some"], ["Most weeks", "acne"]] },
  { q: "Do new products sting, itch or go red?", o: [["Often", "sensitive"], ["Rarely or never", "tough"]] }
];
const TYPES = {
  dry: { name: "Dry", blurb: "Your skin makes less oil, so it loses water fast and can look dull or flaky. Keep it simple and creamy: a gentle cleanser that doesn't strip, and a richer moisturiser." },
  normal: { name: "Normal", blurb: "Your skin is fairly balanced. Your main jobs are keeping it that way and protecting it from the sun." },
  combo: { name: "Combination", blurb: "Oily through the T-zone (forehead, nose, chin), normal or dry on the cheeks. Use light products all over and treat the shiny zone." },
  oily: { name: "Oily", blurb: "Your skin makes a lot of oil, which means shine and bigger-looking pores, but it also ages slowly. Use a foaming cleanser and light, gel-style products. Don't skip moisturiser: stripped skin makes more oil." }
};
// Prices checked online in Nov 2026 at Boots/Superdrug; they change with offers.
const PRODUCTS = {
  cleanseGentle: { name: "CeraVe Hydrating Cleanser", size: "88 ml or 236 ml", price: "£6.50 / £12.49", where: "Boots, Superdrug" },
  cleanseFoam: { name: "CeraVe Foaming Cleanser", size: "236 ml", price: "about £15", where: "Boots, Superdrug (often on 3-for-2)" },
  niacin: { name: "The Ordinary Niacinamide 10% + Zinc 1%", size: "30 ml", price: "about £5–6", where: "Boots, Superdrug, Amazon" },
  moistLotion: { name: "CeraVe Moisturising Lotion", size: "236 ml", price: "£12.49", where: "Superdrug, Boots" },
  moistLight: { name: "The Ordinary Natural Moisturizing Factors + HA", size: "30 ml", price: "about £7", where: "Boots, Superdrug" },
  spfLight: { name: "Garnier Ambre Solaire Super UV SPF 50 fluid", size: "40 ml", price: "about £6.50", where: "Boots, Superdrug, supermarkets" },
  spfMatte: { name: "Nivea Sun shine-control face SPF 50", size: "50 ml", price: "£9.99", where: "Boots, Superdrug" },
  caffeine: { name: "The Ordinary Caffeine Solution 5% + EGCG", size: "30 ml", price: "about £6–7", where: "Boots, Superdrug" }
};
function routineFor(type, flags) {
  const oily = type === "oily" || type === "combo";
  const cleanser = oily && !flags.sensitive ? PRODUCTS.cleanseFoam : PRODUCTS.cleanseGentle;
  const moist = oily ? PRODUCTS.moistLight : PRODUCTS.moistLotion;
  const spf = oily ? PRODUCTS.spfMatte : PRODUCTS.spfLight;
  const am = [
    { step: "Cleanse", how: oily ? "Wash with lukewarm water and the cleanser for 30–60 s." : "Just splash with water, or a small amount of cleanser if you sweated overnight.", p: cleanser },
    ...(oily || flags.acne ? [{ step: "Treat", how: "2–3 drops of niacinamide over the whole face. Helps with oil, redness and the look of pores. Skip it on any day it stings.", p: PRODUCTS.niacin }] : []),
    { step: "Moisturise", how: "A pea-to-grape sized amount on damp skin.", p: moist },
    { step: "Sunscreen", how: "Two finger-lengths for face and neck, every morning, even when it's cloudy. The single best thing for long-term skin.", p: spf }
  ];
  const pm = [
    { step: "Cleanse", how: "Wash properly at night, for 60 s, to get sweat, sunscreen and grime off. After the gym too.", p: cleanser },
    { step: "Under the eyes", how: "One drop of caffeine serum, tapped in with your ring finger. Tightens and de-puffs for a few hours.", p: PRODUCTS.caffeine },
    { step: "Moisturise", how: "Same moisturiser as the morning.", p: moist }
  ];
  const cost = [...new Set([...am, ...pm].map(s => s.p.name))].length;
  return { am, pm, cost };
}
const TRENDS = [
  { name: "Ice roller, cold spoons, ice water dunk", v: "yes", t: "Works", d: "Cold shrinks blood vessels and pushes out fluid, so your face and eye bags look tighter for an hour or two. Great before uni or a photo. It's temporary, but it's real." },
  { name: "Gua sha and lymphatic drainage massage", v: "some", t: "Short-term only", d: "Pushing fluid toward your neck can de-puff for a few hours. It doesn't move fat or change your bone structure, whatever the videos say." },
  { name: "Mewing", v: "no", t: "No good evidence", d: "There's no solid evidence that tongue posture reshapes an adult's jaw. What does change how your jaw looks in profile is head posture (chin tucks) and body fat." },
  { name: "Chewing gum or jaw trainers", v: "no", t: "Mostly hype", d: "Can bulk the chewing muscles a little, which makes the face wider rather than sharper, and can irritate your jaw joint." },
  { name: "Face yoga", v: "some", t: "Weak evidence", d: "One small study showed slight changes in cheek fullness in middle-aged women. Fine if you enjoy it; not a substitute for fat loss." },
  { name: "Skin barrier repair and 3-step routines", v: "yes", t: "Works", d: "The \"skinimalism\" trend is right: a cleanser, a moisturiser and SPF beat a 10-step routine that irritates your skin." },
  { name: "Mouth taping", v: "no", t: "Don't", d: "Not proven to change your face, and it can be unsafe if your nose is blocked. Skip it." },
  { name: "Cutting salt and sugary drinks", v: "yes", t: "Works", d: "Less sodium means less water held under the skin, and you'll see it in your face within days. It's the fastest visible change on this list." }
];
const POSTURE = [
  { id: "tuck", name: "Chin tucks", cue: "Back against a wall. Slide your head straight back, making a double chin, as if someone is pulling a string at the back of your head. Keep your eyes level; don't nod.", sets: 2, reps: 10, hold: 5, levels: [[10, 5], [10, 8], [12, 10], [15, 10]], next: "Then do them lying face down, lifting your head slightly." },
  { id: "curl", name: "Neck curls (deep neck flexors)", cue: "Lie on your back, knees bent. Tuck your chin first, then lift your head 2–3 cm off the floor and hold. Front of the neck should work, not the big muscles at the side. If your chin pokes up, stop the set.", sets: 3, reps: 8, hold: 3, levels: [[8, 3], [10, 5], [10, 8], [12, 10]], next: "Then hold a small towel roll under your head and lift higher, or add a light pressure with your fingers on your forehead." },
  { id: "angel", name: "Wall angels", cue: "Back, head and bum against the wall, arms in a goalpost shape. Slide your arms up and down slowly, keeping your wrists and elbows on the wall as best you can.", sets: 2, reps: 10, hold: 2, levels: [[10, 2], [12, 2], [12, 3], [15, 3]] },
  { id: "pec", name: "Doorway chest stretch", cue: "Forearms on a door frame at shoulder height, step through until you feel a stretch across your chest. Tight chest muscles pull your shoulders and head forward.", sets: 2, reps: 1, hold: 30, levels: [[1, 30], [1, 40], [1, 45], [1, 60]] },
  { id: "prone", name: "Prone Y raises", cue: "Face down, forehead on a towel, arms in a Y with thumbs up. Squeeze your shoulder blades down and lift your arms a few cm. Works the upper back that holds your posture up.", sets: 2, reps: 10, hold: 2, levels: [[10, 2], [12, 2], [12, 3], [15, 3]], next: "Then hold 0.5–1 kg water bottles." }
];
const SALT = [
  ["Takeaway pizza (half)", "3–4 g"], ["Chicken shop meal", "3–5 g"], ["Ready meal or instant noodles", "2–3 g"], ["Ham or bacon, 2 slices", "1–1.5 g"],
  ["Stock cube", "1–2.5 g"], ["Soy sauce, 1 tbsp", "about 2.5 g"], ["2 slices of bread", "about 1 g"], ["Bag of crisps", "0.3–0.5 g"]
];
const POTASSIUM = [
  ["Baked potato with skin, medium", "about 900 mg"], ["Sweet potato, medium", "about 450 mg"], ["Spinach, cooked 100 g", "about 470 mg"], ["Banana", "about 420 mg"],
  ["Kidney or baked beans, half tin", "about 400 mg"], ["Greek yogurt, 200 g", "about 300 mg"], ["Chopped tomatoes, half tin", "about 400 mg"], ["Orange", "about 240 mg"]
];

/* ---------- state ---------- */
const KEY = "sculpt_v1";
function blank() {
  return { v: 1, settings: { goal: 3000, theme: "auto" }, skin: { type: null, flags: {}, answers: [] }, days: {}, posture: { level: {}, done: [] }, photos: [], rem: { start: "09:00", end: "21:00", every: 2, posture: "19:30", pm: "22:30", vit: "08:30", vitPm: "21:30", lymph: "07:30", oral: "22:15", readAm: "07:50", readPm: "21:45" }, supps: { on: { d3: true, omega3: true, mg: true, ash: true, creatine: false } }, gut: { week: "", plants: [] }, checkins: [], shave: { n: 0, last: "" } };
}
function fillDefaults(def, v) {
  if (v === null || typeof v !== "object" || Array.isArray(v) || def === null || typeof def !== "object" || Array.isArray(def)) return v === undefined ? def : v;
  for (const k of Object.keys(def)) v[k] = fillDefaults(def[k], v[k]);
  return v;
}
let S; try { S = fillDefaults(blank(), JSON.parse(localStorage.getItem(KEY)) || blank()); } catch { S = blank(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { toast("Couldn't save. Your phone may be low on storage."); } }
const day = (d = todayISO()) => (S.days[d] = S.days[d] || { water: 0, sugary: 0, checks: {} });
const peekDay = d => S.days[d] || { water: 0, sugary: 0, checks: {} };
const suppsOn = () => SUPPS.filter(x => S.supps.on[x.id]);
const mondayOf = () => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
function scoreOf(d) {
  const x = peekDay(d), w = Math.min(1, (x.water || 0) / S.settings.goal);
  const c = CHECKS.filter(k => x.checks[k.id]).length;
  return (w + c + (x.sugary ? 0 : (x.water || c ? 1 : 0))) / (CHECKS.length + 2);
}
function sugarFreeStreak() { let n = 0, d = todayISO(); if (!S.days[d]) d = addDays(d, -1); while (S.days[d] && !S.days[d].sugary && (S.days[d].water || Object.keys(S.days[d].checks).length)) { n++; d = addDays(d, -1); } return n; }

/* ---------- photos (IndexedDB) ---------- */
const idb = {
  db: null,
  open() { return this.db ? Promise.resolve(this.db) : new Promise((res, rej) => { const r = indexedDB.open("sculpt", 1); r.onupgradeneeded = () => r.result.createObjectStore("photos"); r.onsuccess = () => res(this.db = r.result); r.onerror = () => rej(r.error); }); },
  async put(k, v) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction("photos", "readwrite"); t.objectStore("photos").put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); },
  async get(k) { const db = await this.open(); return new Promise((res, rej) => { const r = db.transaction("photos").objectStore("photos").get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async del(k) { const db = await this.open(); return new Promise(res => { const t = db.transaction("photos", "readwrite"); t.objectStore("photos").delete(k); t.oncomplete = res; }); }
};
function compress(file, max = 1200) {
  return new Promise((res, rej) => { const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error("compress")), "image/jpeg", 0.85); };
    img.onerror = () => rej(new Error("That image couldn't be opened.")); img.src = url; });
}
const urls = {};
async function hydratePhotos() {
  for (const el of document.querySelectorAll("img[data-photo]")) { const k = el.dataset.photo;
    if (!urls[k]) { try { const b = await idb.get(k); if (b) urls[k] = URL.createObjectURL(b); } catch { } }
    if (urls[k]) el.src = urls[k]; }
}

/* ---------- ui ---------- */
const ui = { debSeg: "why", hlSeg: "supps", tab: "today", skinSeg: "routine", coach: null, quiz: null, photoAngle: "front", cmpA: null, cmpB: null, confirm: null };
function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2200); }
const ICON_TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function renderToday() {
  const d = day(), goal = S.settings.goal, pct = Math.min(100, Math.round(d.water / goal * 100));
  const hist = [...Array(14)].map((_, i) => addDays(todayISO(), i - 13));
  const streak = sugarFreeStreak();
  return `${sundayBanner()}<section class="card">
    <div class="hydro">
      <div class="glass" style="--pct:${pct}" role="img" aria-label="${pct}% of today's water goal"><div class="fill"><svg viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M0 6 Q25 0 50 6 T100 6 T150 6 T200 6 V12 H0Z"/></svg></div><div class="marks"><i></i><i></i><i></i></div></div>
      <div class="side">
        <div><div class="ml num">${(d.water / 1000).toFixed(d.water % 100 ? 2 : 1)}<small> of ${(goal / 1000).toFixed(1)} L</small></div>
        <p class="small muted">${d.water >= goal ? "Goal hit. Keep sipping through the evening if you trained." : `${((goal - d.water) / 1000).toFixed(1)} L to go. Spread it out: a glass every hour or two.`}</p></div>
        <div class="addw"><button class="btn water" data-act="water" data-v="250">+250 ml</button><button class="btn water" data-act="water" data-v="500">+500 ml</button>
        <button class="btn sm" data-act="water" data-v="750">+750 ml</button><button class="btn sm ghost" data-act="water" data-v="-250" aria-label="Undo 250 ml">Undo</button></div>
      </div>
    </div>
    <div class="sugar"><div><b>${d.sugary ? `${d.sugary} sugary drink${d.sugary > 1 ? "s" : ""} today` : "No sugary drinks today"}</b><div class="small muted">${streak > 0 ? `${streak} day${streak > 1 ? "s" : ""} in a row on water only` : "Water, sparkling water, black coffee or tea only"}</div></div>
      <button class="btn sm" data-act="sugar">${d.sugary ? "Had another" : "I had one"}</button></div>
  </section>
  <section class="card"><h3>Today's routine</h3>
    <ul class="checks">${CHECKS.map(c => `<li><button class="check" data-act="check" data-id="${c.id}" aria-pressed="${!!d.checks[c.id]}"><span class="dot">${ICON_TICK}</span><span><b>${c.name}</b><span class="sub">${c.sub}</span></span>${c.id === "posture" && !d.checks.posture ? `<span class="small" style="color:var(--amber);font-weight:600">Start</span>` : ""}</button></li>`).join("")}</ul>
    <div class="streak" aria-label="Last 14 days">${hist.map(x => { const s = scoreOf(x); return `<i ${S.days[x] ? `data-v style="--v:${s.toFixed(2)}"` : ""} class="${x === todayISO() ? "today" : ""}" title="${nice(x)}: ${Math.round(s * 100)}%"></i>`; }).join("")}</div>
    <div class="legend"><span>2 weeks ago</span><span>Today</span></div>
  </section>
  ${vitCard()}
  <section class="card"><h3>Reminders</h3>
    <p class="small muted">Apps saved to your home screen can't send their own notifications on iPhone without a server, so Sculpt adds repeating reminders to your Calendar instead. Download once, tap “Add All”.</p>
    <div class="row">
      <div><label class="lbl" for="rStart">Water from</label><input id="rStart" type="time" value="${S.rem.start}"></div>
      <div><label class="lbl" for="rEnd">until</label><input id="rEnd" type="time" value="${S.rem.end}"></div>
      <div><label class="lbl" for="rEvery">every</label><select id="rEvery">${[1, 1.5, 2, 3].map(h => `<option value="${h}" ${+S.rem.every === h ? "selected" : ""}>${h} h</option>`).join("")}</select></div>
    </div>
    <div class="row" style="margin-top:8px">
      <div><label class="lbl" for="rPos">Posture</label><input id="rPos" type="time" value="${S.rem.posture}"></div>
      <div><label class="lbl" for="rPm">Evening skincare</label><input id="rPm" type="time" value="${S.rem.pm}"></div>
    </div>
    <div class="row" style="margin-top:8px">
      <div><label class="lbl" for="rLy">Lymph drain</label><input id="rLy" type="time" value="${S.rem.lymph}"></div>
      <div><label class="lbl" for="rVit">Morning vitamins</label><input id="rVit" type="time" value="${S.rem.vit}"></div>
    </div>
    <div class="row" style="margin-top:8px">
      <div><label class="lbl" for="rVp">Evening vitamins</label><input id="rVp" type="time" value="${S.rem.vitPm}"></div>
      <div><label class="lbl" for="rOr">Teeth at night</label><input id="rOr" type="time" value="${S.rem.oral}"></div>
    </div>
    <div class="row" style="margin-top:8px">
      <div><label class="lbl" for="rRa">Read (morning)</label><input id="rRa" type="time" value="${S.rem.readAm}"></div>
      <div><label class="lbl" for="rRp">Read (night)</label><input id="rRp" type="time" value="${S.rem.readPm}"></div>
    </div>
    <div class="row" style="margin-top:12px"><button class="btn primary" data-act="ics">Add reminders to Calendar</button></div>
  </section>`;
}

function renderQuiz() {
  const a = ui.quiz || [];
  return `<section class="card"><h3>What's your skin type?</h3><p class="small muted">Five quick questions. Answer for your skin on a normal day, not after the gym.</p>
    ${QUIZ.map((q, i) => `<div class="q"><fieldset><legend>${i + 1}. ${q.q}</legend>${q.o.map(([t, v], j) => `<label class="opt"><input type="radio" name="q${i}" value="${v}" data-act="quizPick" data-i="${i}" ${a[i] === v ? "checked" : ""}><span>${t}</span></label>`).join("")}</fieldset></div>`).join("")}
    <div class="row"><button class="btn primary" data-act="quizDone">See my routine</button>${S.skin.type ? `<button class="btn ghost" data-act="quizCancel">Cancel</button>` : ""}</div></section>`;
}
function stepHTML(s) { return `<li><div><b>${s.step}</b><p class="small" style="margin:2px 0 6px">${s.how}</p><div class="prod small"><span>${esc(s.p.name)}<br><span class="muted">${s.p.size}, ${s.p.where}</span></span><span class="price">${s.p.price}</span></div></div></li>`; }
function renderSkin() {
  if (!S.skin.type || ui.quiz) return renderQuiz();
  const T = TYPES[S.skin.type], f = S.skin.flags, r = routineFor(S.skin.type, f);
  const seg = `<div class="seg" role="group">${[["routine", "Routine"], ["eyes", "Eye bags"], ["shave", "Shave & clean"], ["trends", "Trends"]].map(([v, l]) => `<button data-act="skinSeg" data-v="${v}" aria-pressed="${ui.skinSeg === v}">${l}</button>`).join("")}</div>`;
  let body;
  if (ui.skinSeg === "eyes") body = `<section class="card"><h3>Eye bags</h3>
    <p class="small">Two things cause them: <b>fluid</b> (salt, short sleep, alcohol, hay fever, crying, lying flat) and <b>fat pads</b> under the eye, which are mostly genetic. Fluid you can fix in days. Fat pads soften with fat loss but often don't fully go; if they bother you later, that's a GP or dermatologist conversation.</p></section>
    <section class="card"><h3>Morning de-puff, 5 minutes</h3><ol class="steps">
      <li><div><b>Cold first</b><p class="small" style="margin:0">Two spoons kept in the fridge, or a cold flannel, on each eye for 1–2 minutes.</p></div></li>
      <li><div><b>Caffeine serum</b><p class="small" style="margin:0">One drop under each eye, tapped in with your ring finger, never rubbed.</p></div></li>
      <li><div><b>Drink 500 ml</b><p class="small" style="margin:0">Being dehydrated makes your body hang on to fluid.</p></div></li>
      <li><div><b>Sunscreen up to the lower lid</b><p class="small" style="margin:0">Sun damage thins this skin over time and makes bags look worse.</p></div></li></ol></section>
    <section class="card"><h3>More that helps</h3><ul class="tips small">
      <li><b>Bags or dark circles?</b> Puffy and worse in the morning means fluid or fat pads. Flat dark shadow means thin skin, pigment or tear-trough shadow. Different problems, different fixes.</li>
      <li><b>Cold tea bags</b> (green or black, chilled) or a chilled roller for 5 minutes in the morning. It shrinks the puffiness for a few hours.</li>
      <li><b>Caffeine serums</b> give a small, temporary tightening. Worth it, but they won't change the structure.</li>
      <li><b>Vitamin C in the morning, retinol 2 nights a week</b> (patch test first, keep it off the lid edge) thickens thin skin slowly. Give it 8 to 12 weeks.</li>
      <li><b>Lymph taps</b>: ring finger, inner corner to temple, 10 light taps each side. It's part of the morning drain on the Debloat tab.</li>
      <li><b>Give it 4 weeks.</b> If the puffiness barely shifts after sleep, salt and water are sorted, it's probably structural. A dermatologist can then advise.</li>
      <li><b>See a GP</b> for sudden swelling in one eye, pain, redness, or any change in your vision.</li></ul></section>
    <section class="card"><h3>At night</h3><ul class="tips small">
      <li>Sleep 7½–9 hours at roughly the same time. This matters more than any product.</li>
      <li>Use one extra pillow so fluid doesn't pool around your eyes overnight.</li>
      <li>Keep salty food earlier in the day; a salty late dinner shows up under your eyes in the morning.</li>
      <li>Itchy, puffy eyes with sneezing is probably hay fever or a dust allergy. A pharmacist can suggest a non-drowsy antihistamine.</li>
      <li>Don't rub your eyes. It inflames the skin and darkens it.</li></ul></section>`;
  else if (ui.skinSeg === "shave") body = shaveView();
  else if (ui.skinSeg === "trends") body = `<section class="card"><h3>What actually works</h3><p class="small muted">Popular face trends from TikTok, checked against the evidence.</p>
    ${TRENDS.map(t => `<div class="trend"><div class="h"><b>${t.name}</b><span class="verdict ${t.v}">${t.t}</span></div><p class="small" style="margin:0">${t.d}</p></div>`).join("")}</section>
    <section class="card flat"><h3>The honest bit about face fat</h3><p class="small" style="margin:0">You can't burn fat from your cheeks on purpose. Your face leans out as your overall body fat drops, and for most people it's one of the first places to show it. Fat loss plus less salt, more water and better sleep is what gives the sculpted look. Your meal plan in Guggz's Planner handles the fat loss; this app handles the rest.</p></section>`;
  else body = `<section class="card"><h3>Morning</h3><ol class="steps">${r.am.map(stepHTML).join("")}</ol></section>
    <section class="card"><h3>Evening</h3><ol class="steps">${r.pm.map(stepHTML).join("")}</ol></section>
    <section class="card flat"><h3>Rules that matter</h3><ul class="tips small">
      <li>Start one new product at a time, a week apart, so you know what any reaction came from.</li>
      <li>Give anything 6–8 weeks before deciding it doesn't work.</li>
      <li>Wash your face after training and change your pillowcase twice a week.</li>
      ${f.acne ? "<li>If spots are painful, deep or leave marks, see your GP. Prescription treatments work far better than anything in a shop.</li>" : ""}
      ${f.sensitive ? "<li>Your skin reacts easily: patch-test new products on your jaw for 2–3 days first and avoid scrubs and fragrance.</li>" : ""}</ul></section>`;
  return `<section class="card"><p class="small muted" style="margin:0">Your skin type</p><div class="type">${T.name}${f.acne ? ", spot-prone" : ""}${f.sensitive ? ", sensitive" : ""}</div><p class="small">${T.blurb}</p>
    <div class="row"><button class="btn sm" data-act="quizStart">Retake the quiz</button><span class="small muted">${r.cost} products in total.</span></div></section>${seg}${body}`;
}

/* posture */
const lvlOf = id => Math.min(3, S.posture.level[id] || 0);
function doseOf(e) { const [reps, hold] = e.levels[lvlOf(e.id)]; return { sets: e.sets, reps, hold }; }
function doseText(e) { const d = doseOf(e); return d.reps === 1 ? `${d.sets} × ${d.hold} s` : `${d.sets} × ${d.reps}, ${d.hold} s hold`; }
function renderPosture() {
  if (ui.coach) return renderCoach();
  const done = S.posture.done, last = done[done.length - 1];
  const total = POSTURE.reduce((a, e) => { const d = doseOf(e); return a + d.sets * d.reps * (d.hold + 2) + d.sets * 20; }, 0);
  return `<section class="card"><h3>Head and neck posture</h3>
    <p class="small">Forward head posture, where your head sits in front of your shoulders, hides your jawline in side photos and makes a double chin look bigger. A 2018 review of trials found that exercise programmes like this one improve it. Expect visible change in 6–8 weeks if you do it most days.</p>
    <div class="row"><button class="btn primary" data-act="coachStart">Start guided routine</button><span class="small muted">About ${Math.round(total / 60)} min. ${done.length ? `Done ${done.length} time${done.length > 1 ? "s" : ""}, last on ${nice(last)}.` : ""}</span></div></section>
  <section class="card">${POSTURE.map(e => `<div class="ex"><div class="h"><h3 style="margin:0">${e.name}</h3><span class="dose">${doseText(e)}</span></div><p class="small" style="margin:6px 0 4px">${e.cue}</p>
    <p class="small muted" style="margin:0">Level ${lvlOf(e.id) + 1} of 4${lvlOf(e.id) === 3 && e.next ? `. ${e.next}` : ". Moves up after 6 routines at this level."}</p></div>`).join("")}</section>
  <section class="card flat"><h3>All day</h3><ul class="tips small">
    <li>Phone at eye level, not in your lap. Looking down puts several times the weight of your head through your neck.</li>
    <li>On shift at Home Bargains or the arena: stand tall, ears over shoulders, and do 5 chin tucks every time you're on a break.</li>
    <li>Laptop on a stack of books at uni so the top of the screen is at eye level.</li></ul></section>`;
}
function coachPlan() { const out = []; POSTURE.forEach(e => { const d = doseOf(e); for (let s = 1; s <= d.sets; s++) out.push({ e, set: s, sets: d.sets, reps: d.reps, hold: d.hold }); }); return out; }
function renderCoach() {
  const c = ui.coach, step = c.plan[c.i];
  if (!step) return `<section class="card coach"><h2 style="margin-top:0">Routine done</h2><p class="small muted" style="margin-inline:auto">Ticked off for today.</p><button class="btn primary" data-act="coachClose">Back</button></section>`;
  const C = 2 * Math.PI * 100, frac = c.phase === "hold" ? c.left / step.hold : c.phase === "rest" ? c.left / 20 : 1;
  return `<section class="card coach" aria-live="polite">
    <p class="small muted" style="margin:0 auto">${step.e.name}, set ${step.set} of ${step.sets}</p>
    <div class="ring"><svg viewBox="0 0 220 220"><circle class="bg" cx="110" cy="110" r="100"/><circle class="fg" cx="110" cy="110" r="100" stroke-dasharray="${C}" stroke-dashoffset="${(C * (1 - frac)).toFixed(1)}"/></svg>
      <div class="in"><div class="phase">${c.phase === "hold" ? "Hold" : c.phase === "rest" ? "Rest" : c.phase === "between" ? "Relax" : "Ready"}</div><div class="big num">${c.phase === "ready" ? `${c.rep}/${step.reps}` : c.left}</div><div class="small muted">${step.reps > 1 ? `Rep ${Math.min(c.rep + (c.phase === "hold" ? 1 : 0), step.reps)} of ${step.reps}` : ""}</div></div></div>
    <p class="small" style="margin:0 auto 14px">${step.e.cue}</p>
    <div class="row" style="justify-content:center">${c.phase === "ready" ? `<button class="btn primary" data-act="coachGo">Start set</button>` : ""}<button class="btn" data-act="coachSkip">Skip set</button><button class="btn ghost" data-act="coachClose">Stop</button></div>
  </section>`;
}
let coachTimer = null, actx = null;
function beep(f = 880, ms = 120) { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f; g.gain.value = 0.15; o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + ms / 1000); } catch { } if (navigator.vibrate) navigator.vibrate(60); }
function coachTick() {
  const c = ui.coach; if (!c) return; const step = c.plan[c.i];
  c.left--; if (c.left > 0) { if (c.left <= 3) beep(660, 60); return render(); }
  if (c.phase === "hold") { c.rep++; beep(1040, 180);
    if (c.rep >= step.reps) { c.i++; c.rep = 0; if (c.i >= c.plan.length) return finishCoach(); c.phase = "rest"; c.left = 20; }
    else { c.phase = "between"; c.left = 2; }
  } else if (c.phase === "between") { c.phase = "hold"; c.left = step.hold; beep(880, 100); }
  else if (c.phase === "rest") { c.phase = "ready"; stopCoachTimer(); beep(880, 200); }
  render();
}
function stopCoachTimer() { clearInterval(coachTimer); coachTimer = null; }
function finishCoach() {
  stopCoachTimer(); const t = todayISO();
  if (S.posture.done[S.posture.done.length - 1] !== t) S.posture.done.push(t);
  day().checks.posture = true;
  const n = S.posture.done.length;
  if (n % 6 === 0) { POSTURE.forEach(e => { S.posture.level[e.id] = Math.min(3, (S.posture.level[e.id] || 0) + 1); }); toast("Nice work. Every exercise moves up a level."); }
  save(); ui.coach.i = ui.coach.plan.length; render();
}

/* debloat */
function renderDebloatWhy() {
  return `<section class="card"><h3>Why your face holds water</h3><p class="small">Sodium makes your body hold extra water, and a lot of it shows in your face and under your eyes. Potassium helps your kidneys get rid of sodium. So: <b>less processed salt, more potassium, plenty of water</b>. Done for a week, most people see a less puffy face.</p>
    <p class="small muted" style="margin:0">The NHS says adults should have no more than 6 g of salt a day (about a teaspoon). Most of it comes from processed and takeaway food, not the salt you add.</p></section>
  <section class="card"><h3>Where the salt hides</h3><table><thead><tr><th>Food</th><th class="n">Salt</th></tr></thead><tbody>${SALT.map(([a, b]) => `<tr><td>${a}</td><td class="n">${b}</td></tr>`).join("")}</tbody></table>
    <p class="small muted" style="margin-top:8px">On UK labels, red traffic light for salt means more than 1.5 g per 100 g. Rough figures; check the packet.</p></section>
  <section class="card"><h3>Potassium foods</h3><table><thead><tr><th>Food</th><th class="n">Potassium</th></tr></thead><tbody>${POTASSIUM.map(([a, b]) => `<tr><td>${a}</td><td class="n">${b}</td></tr>`).join("")}</tbody></table>
    <p class="small muted" style="margin-top:8px">Get it from food rather than supplements. Your meal plan already has potatoes, sweet potatoes, bananas, yogurt and tomatoes every day.</p></section>
  <section class="card"><h3>Water</h3><ul class="tips small">
    <li>Your goal is ${(S.settings.goal / 1000).toFixed(1)} L. For someone around 77 kg who trains and works on their feet, 3–3.5 L is a sensible target. Pale straw-coloured pee means you're on track.</li>
    <li>Drink 500 ml with breakfast and a bottle during every gym session or shift.</li>
    <li>Fizzy drinks, energy drinks and juice are out. A 500 ml cola has about 53 g of sugar and 210 kcal. Sparkling water with lemon or lime scratches the same itch.</li>
    <li>Black coffee and tea count towards your water.</li></ul>
    <div class="row" style="margin-top:10px"><label class="lbl" for="goal" style="margin:0">Daily goal</label><select id="goal" data-act-change="goal">${[2500, 3000, 3500, 4000].map(g => `<option value="${g}" ${S.settings.goal === g ? "selected" : ""}>${g / 1000} L</option>`).join("")}</select></div></section>
  <section class="card flat"><h3>Other things that puff your face</h3><ul class="tips small">
    <li><b>Alcohol</b> dehydrates you, then your body over-corrects and holds water. The day after a night out is the puffiest your face will look.</li>
    <li><b>Short sleep</b> raises cortisol and fluid retention.</li>
    <li><b>Big late carb-and-salt meals</b> such as takeaway at midnight.</li>
    <li><b>Creatine</b> adds water inside your muscles, not your face, so you don't need to stop it for this.</li></ul></section>`;
}


/* ---------- v1.1: vitamins, lymph drain, gut, oral ---------- */
function gutWeek() { const m = mondayOf(); if (S.gut.week !== m) { S.gut.week = m; S.gut.plants = []; } }
function vitCard() {
  const on = suppsOn(), d = peekDay(todayISO()), t = d.supps || {};
  if (!on.length) return "";
  const done = on.filter(x => t[x.id]).length;
  return `<section class="card"><h3>Vitamins <span class="small muted">${done} of ${on.length} taken</span></h3>
    <ul class="checks">${on.map(x => `<li><button class="check" data-act="supp" data-id="${x.id}" aria-pressed="${!!t[x.id]}"><span class="dot">${ICON_TICK}</span><span><b>${esc(x.name)}</b><span class="sub">${esc(x.sub)}</span></span></button></li>`).join("")}</ul>
    <p class="small muted" style="margin:8px 0 0">Add or remove supplements, and read the safety notes, in the Health tab.</p></section>`;
}
function lymphView() {
  const d = peekDay(todayISO()), done = !!d.checks.lymph;
  const st = [
    ["Drink first (30 sec)", "A big glass of water. Then 5 slow belly breaths: hand on your stomach, breathe in through your nose so it rises, out slowly. Deep breathing moves fluid through the vessels in your chest."],
    ["Collarbones (30 sec)", "Flat fingers just above each collarbone. Press very lightly and release, 10 times each side. Pressure should be about what you'd use to stroke a cat. Lymph vessels sit just under the skin, so hard pressing does nothing."],
    ["Neck (45 sec)", "Slide from just under your ear, down the side of your neck, to the collarbone. 5 slow strokes each side."],
    ["Face sweeps (2 min)", "With a little moisturiser, stroke outwards: chin to ear, side of nose to ear, forehead centre to temples. 5 strokes each, always towards the ears, then down the neck."],
    ["Under the eyes (30 sec)", "Ring finger, light taps from the inner corner to the temple, 10 each side. Never tug."],
    ["Ears (30 sec)", "Small circles in front of and behind each ear, 10 times, then stroke down the neck."],
    ["Body (2 min)", "Stroke arms from wrist to armpit, 5 each. Then legs: pump your ankles 20 times, stroke from ankle up to the top of the thigh, 5 each. Always towards your heart."],
    ["Finish", "Another glass of water, and a 10 minute walk if you can. Moving your muscles is what really pumps lymph around."]
  ];
  return `<section class="card"><h3>Morning lymph drain</h3>
    <p class="small">About 6 minutes. Gentle massage and movement can move trapped fluid and make your face look less puffy for a few hours. Be realistic: there's no good evidence it "detoxes" you or changes anything long term, and proper lymphatic drainage is a medical treatment for swelling conditions. Think of it as a calm, free way to wake the face up. Pair it with less salt and more water for real results.</p>
    <ol class="steps">${st.map(([a, b]) => `<li><div><b>${esc(a)}</b><p class="small" style="margin:0">${esc(b)}</p></div></li>`).join("")}</ol>
    <div class="row" style="margin-top:12px"><button class="btn ${done ? "" : "primary"}" data-act="check" data-id="lymph">${done ? "Done today. Tap to undo" : "Mark morning drain done"}</button></div></section>
  <section class="card flat"><h3>Skip it if</h3><ul class="tips small">
    <li>You have a cold sore, infected spots, a rash, or a fever.</li>
    <li>You can feel a hard or growing lump in your neck. Don't massage it; see a GP.</li>
    <li>One side of your face or one leg is swollen for no clear reason. That needs a GP, not a massage.</li></ul></section>`;
}
function gutView() {
  gutWeek();
  const n = S.gut.plants.length, pct = Math.min(100, Math.round(n / 30 * 100)), d = peekDay(todayISO());
  const list = (t, a) => `<section class="card"><h3>${t}</h3><ul class="tips small">${a.map(x => `<li>${x}</li>`).join("")}</ul></section>`;
  return `<section class="card"><h3>Gut health, the simple version</h3>
    <p class="small">Your gut bacteria live on fibre. The most useful things you can do are: <b>eat about 30 g of fibre a day</b> (most UK adults get around 20 g), <b>eat lots of different plants</b>, and <b>add some fermented food</b>. Build up gradually over 2 to 3 weeks. Bloating at first is normal and settles.</p>
    <div class="row" style="margin-top:8px"><button class="btn ${d.checks.gut ? "" : "primary"}" data-act="check" data-id="gut">${d.checks.gut ? "Gut foods done today" : "Mark gut foods done today"}</button></div></section>
  <section class="card"><h3>Plants this week: ${n} of 30</h3>
    <p class="small muted">Studies link more variety in plants (vegetables, fruit, beans, lentils, oats, nuts, seeds, herbs, spices) with a more varied gut microbiome. Around 30 different ones a week is the target. Each one counts once. It resets every Monday.</p>
    <div style="height:10px;border-radius:99px;background:var(--sunk);overflow:hidden;margin:8px 0"><div style="height:100%;width:${pct}%;background:var(--accent,#3b82f6)"></div></div>
    <div class="row"><input id="plantIn" type="text" placeholder="e.g. oats, spinach, lentils" aria-label="Plant eaten" style="flex:1"><button class="btn sm primary" data-act="gutAdd">Add</button></div>
    <p class="small" style="margin-top:8px">${S.gut.plants.map(x => `<button class="btn sm ghost" data-act="gutDel" data-id="${esc(x)}" aria-label="Remove ${esc(x)}">${esc(x)} ×</button>`).join(" ") || '<span class="muted">Nothing logged yet. Oats, banana and spinach are a start.</span>'}</p></section>
  ${list("Feed your gut (prebiotics)", ["<b>Oats</b> and <b>lentils</b>, <b>beans</b>, <b>chickpeas</b>: cheap, fibre-rich and already in your meal plan.", "<b>Onion, garlic, leeks</b>: in every bolognese, chilli and curry.", "<b>Slightly green bananas</b>, apples, berries, broccoli, spinach.", "<b>Cooked then cooled potato, sweet potato or rice</b>: cooling creates resistant starch, which gut bacteria love. Your batch-cooked boxes already do this.", "Nuts and seeds (a small handful) and chia or flax on oats."])}
  ${list("Add live bacteria (fermented)", ["<b>Plain live yogurt or kefir</b>, 1 to 2 portions a day. Check the label says \"live\" and has no added sugar.", "<b>Sauerkraut or kimchi</b> from the chilled aisle (unpasteurised), 2 tablespoons with a meal.", "Start small. A teaspoon for the first week is fine.", "Miso and kimchi are salty, so keep them as a small extra while you're debloating."])}
  ${list("Habits that matter as much as food", ["Eat slowly and at regular times.", "A 10 minute walk after meals helps digestion.", "Poor sleep and high stress upset the gut as well as the face.", "Limit alcohol, and cut back on ultra-processed food and sugary drinks, which you're already doing.", "Drink plenty of water as fibre goes up, or it can make you constipated."])}
  <section class="card flat"><h3>See a GP if</h3><ul class="tips small"><li>You see blood in your poo, or it's black.</li><li>Your bowel habit changes and stays changed for more than 3 weeks.</li><li>You lose weight without trying, or have bad or lasting stomach pain.</li><li>Bloating or pain doesn't settle after a few weeks of steady, gradual change. That can be IBS or something else a GP or dietitian can sort out.</li></ul></section>`;
}
function renderDebloat() {
  const seg = `<div class="seg" role="group">${[["why", "Debloat"], ["lymph", "Morning drain"], ["gut", "Gut"]].map(([v, l]) => `<button data-act="debSeg" data-v="${v}" aria-pressed="${ui.debSeg === v}">${l}</button>`).join("")}</div>`;
  return seg + (ui.debSeg === "lymph" ? lymphView() : ui.debSeg === "gut" ? gutView() : renderDebloatWhy());
}
function suppView() {
  return `<section class="card"><h3>Your supplements</h3>
    <p class="small muted">Switch each on or off. The ones that are on appear as ticks on the Today tab and in your Calendar reminders. Supplements aren't tested like medicines, so buy from known brands, and tell a pharmacist or GP what you take. This is general information, not medical advice.</p></section>
  ${SUPPS.map(x => `<section class="card ${S.supps.on[x.id] ? "" : "flat"}"><div class="row" style="justify-content:space-between;align-items:center"><h3 style="margin:0">${esc(x.name)}</h3><button class="btn sm ${S.supps.on[x.id] ? "" : "primary"}" data-act="suppOn" data-id="${x.id}">${S.supps.on[x.id] ? "Taking it" : x.id === "creatine" ? "Add it" : "Not taking"}</button></div>
    <p class="small muted" style="margin:4px 0">${esc(x.sub)}</p><p class="small" style="margin:0">${esc(x.note)}</p></section>`).join("")}
  <section class="card"><h3>What else is worth it at 18?</h3><ul class="tips small">
    <li><b>Food first.</b> Protein at each meal, 30 g of fibre, fruit and veg and oily fish weekly cover almost everything. Supplements fill gaps; they don't replace sleep, training or food.</li>
    <li><b>Vitamin D</b> in autumn and winter is the one the NHS recommends for nearly everyone, so you're right to take it.</li>
    <li><b>Creatine</b> is the only supplement with strong evidence for your training goals. It's optional, but the best value of the lot.</li>
    <li><b>Not crucial:</b> multivitamins, collagen, greens powders, fat burners, testosterone boosters and BCAAs have little or no good evidence for someone eating well.</li>
    <li><b>Feel tired all the time, pale, or low in mood?</b> Ask a GP for blood tests (iron, B12, vitamin D, thyroid) before spending money guessing.</li>
    <li><b>Caffeine</b> is fine in moderation before training. Keep it before about 2 pm so it doesn't wreck sleep, which matters more than any pill.</li></ul></section>
  <section class="card flat"><h3>Tweaks I'd suggest</h3><ul class="tips small">
    <li>Take D3, omega-3 and creatine together at breakfast, magnesium in the evening. One simple habit each.</li>
    <li>Treat ashwagandha as the least essential: consider using it for a limited stretch (for example 8 weeks), then see if you notice a difference before continuing.</li>
    <li>Change one thing at a time, so you can tell what's working and what's causing any stomach upset.</li></ul></section>`;
}
function oralView() {
  const d = peekDay(todayISO());
  return `<section class="card"><h3>Oral health routine</h3>
    <p class="small">Fluoride toothpaste, cleaning between teeth and cutting sugar frequency are what protect your teeth. Everything else is an extra.</p>
    <div class="row"><button class="btn ${d.checks.oral ? "" : "primary"}" data-act="check" data-id="oral">${d.checks.oral ? "Teeth done today" : "Mark brushed and flossed"}</button></div></section>
  <section class="card"><h3>Morning and night</h3><ol class="steps">
    <li><div><b>Morning</b><p class="small" style="margin:0">Brush for 2 minutes with fluoride toothpaste (1,350 to 1,500 ppm on the tube). Scrape or brush your tongue.</p></div></li>
    <li><div><b>Night</b><p class="small" style="margin:0">Floss or use interdental brushes first, then brush 2 minutes.</p></div></li>
    <li><div><b>Spit, don't rinse</b><p class="small" style="margin:0">Spit out the foam and leave the fluoride on your teeth. No water or mouthwash straight after, and nothing but water for the rest of the night.</p></div></li>
    <li><div><b>Mouthwash</b><p class="small" style="margin:0">Optional. Use an alcohol-free one at a different time to brushing, such as after lunch, so it doesn't wash the fluoride away.</p></div></li></ol></section>
  <section class="card"><h3>Miswak</h3><p class="small">A chewing stick from the Salvadora persica tree. Studies suggest it can reduce plaque and gum irritation about as well as a toothbrush in some trials, though the studies are small and uneven. Good as a midday extra, not a replacement for brushing with fluoride toothpaste.</p>
    <ul class="tips small"><li>Chew the end into soft bristles and use it for 2 to 3 minutes, brushing gently along the gums.</li><li>Cut off the used end every few days; a stick lasts 1 to 2 weeks.</li><li>Keep it clean and dry between uses.</li></ul></section>
  <section class="card"><h3>Coconut oil pulling</h3><p class="small">Swishing a spoon of oil around your mouth. Small studies show modest drops in plaque and mouth bacteria, but the research is limited and dental bodies say there isn't enough evidence to recommend it instead of normal care. It's harmless as an extra if you enjoy it.</p>
    <ul class="tips small"><li>1 tablespoon, swish gently for 5 to 10 minutes, before brushing.</li><li>Spit it into the bin, never the sink (it blocks pipes) and never swallow it.</li><li>Don't use it as an excuse to skip fluoride, or to put off a dentist.</li></ul></section>
  <section class="card"><h3>Other things that matter</h3><ul class="tips small">
    <li>How often you have sugar matters more than how much. Water-only between meals is the best thing you can do.</li>
    <li>Wait 30 minutes after fizzy, juice or sour drinks before brushing, because acid softens enamel.</li>
    <li>Sugar-free xylitol gum after meals helps saliva wash your teeth.</li>
    <li>Replace your toothbrush every 3 months. An electric one with a timer makes 2 minutes easy.</li>
    <li>Don't smoke or vape; both damage gums.</li>
    <li>Book a dentist check-up every 6 to 12 months. NHS dental care is free for people under 18, and for 18 year olds in full-time education, so check you qualify.</li>
    <li>Gums that bleed when you brush usually need more cleaning, not less. If it carries on after a week or two, or you have pain or a lasting bad taste, see a dentist.</li></ul></section>`;
}
function renderHealth() {
  const seg = `<div class="seg" role="group">${[["supps", "Vitamins"], ["oral", "Oral health"]].map(([v, l]) => `<button data-act="hlSeg" data-v="${v}" aria-pressed="${ui.hlSeg === v}">${l}</button>`).join("")}</div>`;
  return seg + (ui.hlSeg === "oral" ? oralView() : suppView());
}


/* ---------- v1.2: weekly check-in and Sunday review ---------- */
const daysSince = ds => Math.round((parseISO(todayISO()) - parseISO(ds)) / 864e5);
function sundayBanner() {
  const last = S.checkins[S.checkins.length - 1], due = !last || daysSince(last.date) >= 6;
  if (!(new Date().getDay() === 0 || (last && daysSince(last.date) >= 9)) || !due) return "";
  return `<section class="card"><h3>${new Date().getDay() === 0 ? "It's Sunday" : "Check-in due"}</h3><p class="small">Log your weight and waist, then read your week. It takes a minute and tells you what to focus on next.</p>
    <div class="row"><button class="btn primary" data-act="goTab" data-v="progress">Open check-in</button></div></section>`;
}
function checkinView() {
  const list = S.checkins.slice(-6).reverse(), last = S.checkins[S.checkins.length - 1], due = !last || daysSince(last.date) >= 6;
  const diff = (a, b, k) => a[k] != null && b && b[k] != null ? (a[k] - b[k]) : null;
  const fmt = v => v == null ? "" : `<span class="small ${v <= 0 ? "" : "muted"}"> ${v > 0 ? "+" : ""}${v.toFixed(1)}</span>`;
  const rows = list.map(c => { const i = S.checkins.indexOf(c), prev = i > 0 ? S.checkins[i - 1] : null;
    return `<tr><td>${nice(c.date)}</td><td class="n">${c.w != null ? c.w + " kg" : "–"}${fmt(diff(c, prev, "w"))}</td><td class="n">${c.wa != null ? c.wa + " cm" : "–"}${fmt(diff(c, prev, "wa"))}</td><td class="n"><button class="btn sm ghost" data-act="ciDel" data-id="${c.date}" aria-label="Delete ${nice(c.date)}">×</button></td></tr>`; }).join("");
  const first = S.checkins[0], note = S.checkins.length >= 2 && first.w != null && last.w != null ? `<p class="small" style="margin:8px 0 0">Since ${nice(first.date)}: <b>${(last.w - first.w) > 0 ? "+" : ""}${(last.w - first.w).toFixed(1)} kg</b>${first.wa != null && last.wa != null ? `, waist <b>${(last.wa - first.wa) > 0 ? "+" : ""}${(last.wa - first.wa).toFixed(1)} cm` + "</b>" : ""}.</p>` : "";
  return `<section class="card"><h3>Weekly check-in ${due ? "" : '<span class="small muted">done this week</span>'}</h3>
    <p class="small muted">Once a week, same day, morning, after the toilet and before eating. One number is noisy, so look at the trend over weeks. Measure your waist at the belly button, relaxed. Then add a face photo below.</p>
    <div class="row"><div><label class="lbl" for="ciW">Weight (kg)</label><input id="ciW" type="number" inputmode="decimal" step="0.1" placeholder="${last && last.w != null ? last.w : "e.g. 77.5"}"></div>
    <div><label class="lbl" for="ciWa">Waist (cm)</label><input id="ciWa" type="number" inputmode="decimal" step="0.1" placeholder="${last && last.wa != null ? last.wa : "e.g. 84"}"></div></div>
    <div class="row" style="margin-top:10px"><button class="btn primary" data-act="ciSave">Save check-in</button></div>
    ${rows ? `<table style="margin-top:10px"><thead><tr><th>Date</th><th class="n">Weight</th><th class="n">Waist</th><th></th></tr></thead><tbody>${rows}</tbody></table>${note}` : ""}</section>`;
}
function reviewView() {
  const ds = [...Array(7)].map((_, i) => addDays(todayISO(), i - 6)), logged = ds.filter(d => S.days[d]);
  if (logged.length < 2) return `<section class="card"><h3>Your week</h3><p class="small muted">Use the app for a few days and your weekly review will appear here.</p></section>`;
  const goal = S.settings.goal, on = suppsOn(), n = logged.length;
  const waterDays = logged.filter(d => (S.days[d].water || 0) >= goal).length;
  const sugarFree = logged.filter(d => !S.days[d].sugary).length;
  const routine = Math.round(logged.reduce((a, d) => a + CHECKS.filter(k => S.days[d].checks[k.id]).length / CHECKS.length, 0) / n * 100);
  const vitPossible = on.length * n, vitDone = logged.reduce((a, d) => a + on.filter(x => (S.days[d].supps || {})[x.id]).length, 0);
  const vitPct = vitPossible ? Math.round(vitDone / vitPossible * 100) : null;
  gutWeek(); const plants = S.gut.plants.length;
  const sleepDays = logged.filter(d => S.days[d].checks.sleep).length;
  const items = [
    ["water", "Water goal", `${waterDays} of ${n} days`, waterDays / n, "Put a full bottle beside you at breakfast and finish it by lunch."],
    ["sugar", "Sugar-free drinks", `${sugarFree} of ${n} days`, sugarFree / n, "Keep sparkling water with lemon in the fridge for when you want something fizzy."],
    ["sleep", "Slept 7½ hours or more", `${sleepDays} of ${n} days`, sleepDays / n, "Set a fixed bedtime alarm, and put your phone on charge across the room."],
    ["routine", "Routine ticks", `${routine}%`, routine / 100, "Don't try to tick everything. Pick three checks (skin, water, sleep) and make those automatic first."]
  ];
  const readDone = logged.reduce((a, d) => a + (S.days[d].checks.readam ? 1 : 0) + (S.days[d].checks.readpm ? 1 : 0), 0);
  items.push(["read", "Reading sessions", `${readDone} of ${n * 2}`, readDone / (n * 2), "Tie it to something you already do: book next to your toothbrush at night, and the first 20 pages with your morning coffee."]);
  if (vitPct != null) items.push(["vit", "Vitamins taken", `${vitPct}%`, vitPct / 100, "Keep the vitamins next to your toothbrush or your breakfast bowl, and add the Calendar reminder."]);
  items.push(["plants", "Plants this week", `${plants} of 30`, plants / 30, "Add one new plant each day: a different veg in dinner, fruit with breakfast, a handful of nuts."]);
  const worst = items.slice().sort((a, b) => a[3] - b[3])[0], allGood = worst[3] >= 0.8;
  const cls = r => r >= 0.8 ? "var(--mint)" : r >= 0.5 ? "var(--amber)" : "var(--bad)";
  return `<section class="card"><h3>Your week</h3><p class="small muted">The last 7 days, ${n} of them logged.</p>
    ${items.map(([, a, b, r]) => `<div style="margin:10px 0"><div class="row" style="justify-content:space-between"><b class="small">${a}</b><span class="small">${b}</span></div><div style="height:8px;border-radius:99px;background:var(--sunk);overflow:hidden"><div style="height:100%;width:${Math.round(Math.min(1, r) * 100)}%;background:${cls(r)}"></div></div></div>`).join("")}
    <div class="sugar" style="margin-top:12px"><div><b>${allGood ? "Focus for next week: keep going" : "Focus for next week: " + worst[1].toLowerCase()}</b><div class="small muted">${allGood ? "Everything is on track. Don't add anything new. Consistency is the plan." : worst[4]}</div></div></div></section>`;
}


/* ---------- v1.3: razor bumps ---------- */
function shaveView() {
  const n = S.shave.n, due = n >= 7, done = S.shave.last === todayISO();
  const st = [
    ["Wash first", "A gentle, non-comedogenic cleanser, using a soft cloth in small circles. This lifts dead skin that can trap hairs."],
    ["Warm and soften (5 min)", "Hold a warm, damp cloth on your beard area, or shave at the end of a shower. Warmth and moisture soften the hairs so they're less likely to curl back in."],
    ["Shaving cream, 1 to 2 minutes", "Apply a moisturising shaving cream or gel and leave it on, even with an electric razor. Never dry shave."],
    ["Sharp razor, with the grain", "Use a single-blade or electric razor. Shave slowly in the direction the hair grows, with short strokes and light pressure. Don't stretch the skin, and don't go over any area more than twice. Rinse the blade after each stroke."],
    ["Leave a little stubble", "Don't shave right down to the skin. About 1 mm left behind is less likely to curl into the skin."],
    ["Soothe", "Rinse with cool water and pat dry. Then apply your treatment (see below) and a light, non-greasy moisturiser."]
  ];
  return `<section class="card"><h3>Razor bumps</h3>
    <p class="small">Tight curly hair is the cause: once cut, the sharp tip can curl back into the skin and the skin reacts. Dermatologists say the most reliable fix is <b>growing your beard out</b>: bumps usually drop within a month and clear by about three months. If you need to shave, the routine below keeps it down.</p></section>
  <section class="card"><h3>Blade tracker</h3>
    <p class="small muted">A single blade stays sharp for about 5 to 7 shaves. Blunt blades tug the hair and cause bumps.</p>
    <div style="height:10px;border-radius:99px;background:var(--sunk);overflow:hidden;margin:8px 0"><div style="height:100%;width:${Math.min(100, Math.round(n / 7 * 100))}%;background:${due ? "var(--bad)" : n >= 5 ? "var(--amber)" : "var(--mint)"}"></div></div>
    <p class="small" style="margin:0 0 8px"><b>${n} of 7 shaves</b> on this blade${due ? ". Replace it now." : "."}</p>
    <div class="row"><button class="btn ${done ? "" : "primary"}" data-act="shaved">${done ? "Shave logged today" : "I shaved today"}</button><button class="btn" data-act="newBlade">New blade</button></div></section>
  <section class="card"><h3>Shave routine</h3><ol class="steps">${st.map(([a, b]) => `<li><div><b>${esc(a)}</b><p class="small" style="margin:0">${esc(b)}</p></div></li>`).join("")}</ol>
    <p class="small muted" style="margin-top:8px">Shave daily, or at least every 2 to 3 days. Train the hairs to grow one way by brushing gently with a clean, soft toothbrush each day. Never pluck or dig out a hair inside a bump.</p></section>
  <section class="card"><h3>Treatments, one at a time</h3>
    <p class="small muted">Start with one, use it for 4 to 6 weeks, and only then add another. Introducing several at once makes irritation likely and you won't know what helped.</p>
    <ul class="tips small">
      <li><b>Weeks 1 to 2: technique only.</b> Shave properly, switch to a single blade or electric razor, and moisturise. This alone helps many people.</li>
      <li><b>Salicylic or glycolic acid</b> (a toner, spray or roll-on) a few evenings a week, away from broken skin. They loosen dead skin around the hairs. Daily glycolic acid has some evidence in the research.</li>
      <li><b>Benzoyl peroxide</b> (a 2.5 to 5% gel) on the bumps, after shaving, to calm the inflamed ones. It can bleach towels and pillowcases.</li>
      <li><b>Adapalene</b> (a pharmacy retinoid) a few nights a week, to stop follicles blocking. Start slowly and always wear SPF in the morning.</li>
      <li><b>A GP or dermatologist</b> can prescribe a benzoyl peroxide and clindamycin combination, which cut pustules and bumps in trials, or a stronger retinoid.</li>
      <li><b>Laser hair removal</b> is the long-term option for dark skin. It must be a laser suited to dark skin (long-pulsed Nd:YAG), in a clinic with proper training. Ask about patch tests.</li></ul></section>

  <section class="card"><h3>Products and prices</h3>
    <p class="small muted">Prices from Amazon UK, checked 9 Nov 2026, and they change. Stars are Amazon ratings, which show what buyers think, not proof it works. Choose by ingredient and add one at a time.</p>
    <table><thead><tr><th>Product</th><th class="n">Price</th><th class="n">Rating</th></tr></thead><tbody>
      <tr><td>Tend Skin roll-on, 50 ml<br><span class="small muted">Aspirin with BHA and AHA. The original</span></td><td class="n">£11.90</td><td class="n">4.4</td></tr>
      <tr><td>Skin Doctors Ingrow Go lotion, 120 ml<br><span class="small muted">Multipacks run £21 to £34</span></td><td class="n">£11.24</td><td class="n">4.2</td></tr>
      <tr><td>Nad's Soothing Ingrow Solution, 125 ml</td><td class="n">£9.90</td><td class="n">4.2</td></tr>
      <tr><td>LYCON Ingrown X-It spray, 125 ml<br><span class="small muted">Salicylic acid</span></td><td class="n">not checked</td><td class="n">4.4</td></tr>
      <tr><td>INKEY List Glycolic Acid stick, 45 g<br><span class="small muted">Made for the body, so patch test on your jaw first</span></td><td class="n">not checked</td><td class="n">4.3</td></tr>
      <tr><td>Adapalene gel<br><span class="small muted">Pharmacy retinoid. Ask the pharmacist</span></td><td class="n">not checked</td><td class="n">n/a</td></tr></tbody></table>
    <p class="small" style="margin-top:8px"><b>Roughly £10 to £12</b> for the checked ones. The "Smoothing Solution" rollers sold as lookalikes cost £6 to £9 and their ratings swing from 1 to 4 stars, so buy the genuine brand.</p></section>
  <section class="card"><h3>Keep your face clean</h3>
    <p class="small">Most spots and bumps aren't about dirt, so scrubbing harder won't help. It's about not adding bacteria and not wrecking your skin barrier. These habits do most of the work.</p>
    <ul class="tips small">
      <li><b>Wash twice a day, no more.</b> Morning and night, with a gentle cleanser and lukewarm water, then pat dry. Over-washing and harsh scrubs make skin more irritated and more spotty.</li>
      <li><b>Wash your hands first.</b> Before you touch your face, apply anything or shave. Keep your hands off it the rest of the day.</li>
      <li><b>Wash after sweat and dust.</b> Rinse your face after the gym and after a shift at work, and shower soon after training. Change out of sweaty clothes.</li>
      <li><b>Pillowcase:</b> change it every week, or twice a week if you break out.</li>
      <li><b>Towel:</b> use a clean face towel every 2 to 3 days. Pat, don't rub, and never share it.</li>
      <li><b>Phone:</b> wipe the screen every day with a screen-safe wipe. It touches your cheek for hours.</li>
      <li><b>Razor:</b> rinse the blade after every stroke, shake dry, and replace it after about 7 shaves (use the tracker above). Wash an electric razor's head after each shave.</li>
      <li><b>Gym:</b> wipe benches and grips before you use them, and keep your hands off your face between sets. Wash caps, headbands and hoods weekly.</li>
      <li><b>Never pick or squeeze.</b> It pushes bacteria deeper and leaves dark marks and scars on darker skin. Use a spot patch instead.</li>
      <li><b>Moisturise and use SPF.</b> A healthy barrier keeps bacteria out. Skip antibacterial soap and alcohol toners, which are too harsh.</li>
      <li><b>Hair products:</b> keep oils and gels off your forehead, and wash your face after using them.</li></ul></section>
  <section class="card flat"><h3>Careful</h3><ul class="tips small">
    <li>Irritated skin on darker tones can leave dark marks. If something stings or peels, stop it for a week.</li>
    <li>Don't squeeze or scratch bumps. That's what causes scars and dark spots.</li>
    <li>See a GP or dermatologist if bumps are painful, full of pus, keep coming back, or leave marks or scars.</li>
    <li>Ratings on Amazon aren't evidence. Pick products by what's in them, not by stars.</li></ul></section>`;
}

/* progress */
function renderProgress() {
  const ph = S.photos.slice().sort((a, b) => b.date.localeCompare(a.date));
  const angle = ui.photoAngle, list = ph.filter(p => p.angle === angle);
  const A = list.find(p => p.id === ui.cmpA) || list[list.length - 1], B = list.find(p => p.id === ui.cmpB) || list[0];
  return `${checkinView()}${reviewView()}<section class="card"><h3>Face photos</h3><p class="small muted">Same light, same distance, no smile, every 2 weeks. Side photos show your jawline best: stand side-on, relaxed, ears over shoulders.</p>
    <div class="seg" role="group">${[["front", "Front"], ["side", "Side"]].map(([v, l]) => `<button data-act="angle" data-v="${v}" aria-pressed="${angle === v}">${l}</button>`).join("")}</div>
    <div class="row"><button class="btn primary" data-act="photo">Add ${angle} photo</button></div></section>
  ${list.length >= 2 ? `<section class="card"><h3>Compare</h3><div class="compare" style="--cut:50%"><img data-photo="${A.id}" alt="${nice(A.date)}"><img class="after" data-photo="${B.id}" alt="${nice(B.date)}"><span class="bar"></span><input type="range" min="0" max="100" value="50" aria-label="Compare slider" data-act-input="cut"></div>
    <div class="row" style="margin-top:10px;justify-content:space-between"><select data-act-change="cmpA" aria-label="Before photo">${list.map(p => `<option value="${p.id}" ${p.id === A.id ? "selected" : ""}>${nice(p.date)}</option>`).join("")}</select><select data-act-change="cmpB" aria-label="After photo">${list.map(p => `<option value="${p.id}" ${p.id === B.id ? "selected" : ""}>${nice(p.date)}</option>`).join("")}</select></div></section>` : ""}
  <section class="card">${list.length ? `<div class="ph">${list.map(p => `<figure><img data-photo="${p.id}" alt="${angle} photo ${nice(p.date)}"><figcaption>${nice(p.date)}${ui.confirm === p.id ? `<button class="btn sm" style="color:var(--bad)" data-act="delPhoto" data-id="${p.id}">Delete</button>` : `<button class="btn sm ghost" data-act="ask" data-id="${p.id}" aria-label="Delete photo">×</button>`}</figcaption></figure>`).join("")}</div>` : `<div class="empty">No ${angle} photos yet. Take your first today so you have something to compare against in February.</div>`}</section>
  <section class="card"><h3>Settings</h3>
    <div class="row"><label class="lbl" for="theme" style="margin:0">Appearance</label><select id="theme" data-act-change="theme">${[["auto", "Match phone"], ["light", "Light"], ["dark", "Dark"]].map(([v, l]) => `<option value="${v}" ${S.settings.theme === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
    <p class="small muted" style="margin-top:12px">Everything stays on this phone. Back it up now and then; photos stay on the phone and aren't in the backup.</p>
    <div class="row"><button class="btn sm" data-act="export">Back up</button><button class="btn sm" data-act="import">Restore</button></div>
    <p class="small muted" style="margin-top:10px">Sculpt ${VERSION}</p></section>`;
}

/* ---------- render ---------- */
function applyTheme() { const t = S.settings.theme; if (t === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.dataset.theme = t; }
function render() {
  $("#date").textContent = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const v = { today: renderToday, skin: renderSkin, posture: renderPosture, debloat: renderDebloat, health: renderHealth, progress: renderProgress }[ui.tab]();
  $("#view").innerHTML = v;
  document.querySelectorAll(".tab").forEach(b => b.dataset.tab === ui.tab ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current"));
  hydratePhotos();
}

/* ---------- reminders (.ics) ---------- */
function icsFile() {
  const now = new Date(), stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const start = todayISO().replace(/-/g, ""), ev = [];
  const add = (time, title, desc) => { const [h, m] = time.split(":").map(Number), e = h * 60 + m + 5; ev.push(["BEGIN:VEVENT", `UID:${uid()}-${pad(h)}${pad(m)}@sculpt`, `DTSTAMP:${stamp}`, `DTSTART:${start}T${pad(h)}${pad(m)}00`, `DTEND:${start}T${pad(Math.floor(e / 60) % 24)}${pad(e % 60)}00`, "RRULE:FREQ=DAILY", `SUMMARY:${title}`, `DESCRIPTION:${desc}`, "TRANSP:TRANSPARENT", "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${title}`, "TRIGGER:PT0M", "END:VALARM", "END:VEVENT"].join("\r\n")); };
  const toM = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; }, fromM = n => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`;
  const s = toM(S.rem.start), e = toM(S.rem.end), step = Math.round(+S.rem.every * 60);
  const slots = []; for (let t = s; t <= e; t += step) slots.push(t);
  const per = Math.round(S.settings.goal / Math.max(1, slots.length) / 50) * 50;
  slots.forEach(t => add(fromM(t), `Drink ${per} ml of water`, "Sculpt: water only, no sugary drinks."));
  add(S.rem.posture, "Posture routine (8 min)", "Chin tucks, neck curls, wall angels, chest stretch, Y raises. Open Sculpt for the guided timer.");
  add(S.rem.pm, "Evening skincare", "Cleanse, caffeine under the eyes, moisturise.");
  add(S.rem.lymph, "Morning lymph drain (6 min)", "Breathing, collarbones, neck, face sweeps, then a glass of water. Open Sculpt, Debloat, Morning drain.");
  const nm = w => suppsOn().filter(x => x.when === w).map(x => x.name).join(", ");
  if (nm("am")) add(S.rem.vit, "Take vitamins with breakfast", nm("am"));
  if (nm("pm")) add(S.rem.vitPm, "Take evening supplements", nm("pm"));
  add(S.rem.readAm, "Read 20 pages", "Morning reading. Book before phone.");
  add(S.rem.readPm, "Read 20 pages", "Night reading. Phone on charge across the room, then read.");
  add(S.rem.oral, "Floss, brush 2 min, spit, don't rinse", "Floss or interdental brushes first, then fluoride toothpaste. Nothing but water afterwards.");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sculpt//EN", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Sculpt", ...ev, "END:VCALENDAR"].join("\r\n");
}
async function shareOrDownload(name, text, type) {
  const blob = new Blob([text], { type });
  try { const f = new File([blob], name, { type }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f] }); return true; } } catch (e) { if (e && e.name === "AbortError") return false; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); return true;
}

/* ---------- events ---------- */
document.addEventListener("click", async ev => {
  const tab = ev.target.closest(".tab"); if (tab) { if (ui.coach && tab.dataset.tab !== "posture") { stopCoachTimer(); ui.coach = null; } ui.tab = tab.dataset.tab; ui.confirm = null; render(); window.scrollTo(0, 0); return; }
  const el = ev.target.closest("[data-act]"); if (!el || el.tagName === "SELECT") return;
  const a = el.dataset.act, D = el.dataset;
  switch (a) {
    case "water": { const d = day(); d.water = Math.max(0, d.water + +D.v); save(); render(); if (+D.v > 0 && d.water >= S.settings.goal && d.water - +D.v < S.settings.goal) toast("Water goal hit"); return; }
    case "sugar": day().sugary++; save(); render(); toast("Logged. Tomorrow's a fresh streak."); return;
    case "check": { if (D.id === "posture" && !day().checks.posture) { ui.tab = "posture"; render(); window.scrollTo(0, 0); return; } const d = day(); d.checks[D.id] = !d.checks[D.id]; save(); render(); return; }
    case "ics": S.rem = { start: $("#rStart").value || "09:00", end: $("#rEnd").value || "21:00", every: +$("#rEvery").value || 2, posture: $("#rPos").value || "19:30", pm: $("#rPm").value || "22:30", lymph: $("#rLy").value || "07:30", vit: $("#rVit").value || "08:30", vitPm: $("#rVp").value || "21:30", oral: $("#rOr").value || "22:15", readAm: $("#rRa").value || "07:50", readPm: $("#rRp").value || "21:45" }; save();
      if (await shareOrDownload("sculpt-reminders.ics", icsFile(), "text/calendar")) toast("Open the file and tap Add All"); return;
    case "quizStart": ui.quiz = (S.skin.answers || []).slice(); render(); window.scrollTo(0, 0); return;
    case "quizCancel": ui.quiz = null; render(); return;
    case "quizPick": ui.quiz = ui.quiz || []; ui.quiz[+D.i] = el.value; return;
    case "quizDone": { const q = ui.quiz || []; if (q.filter(Boolean).length < QUIZ.length) { toast("Answer all five questions."); return; }
      const votes = { dry: 0, normal: 0, combo: 0, oily: 0 }; q.slice(0, 3).forEach(v => votes[v]++);
      let type = Object.entries(votes).sort((x, y) => y[1] - x[1])[0][0]; if (votes.combo && votes.oily && votes.combo === votes.oily) type = "combo";
      S.skin = { type, flags: { acne: q[3] === "acne", sensitive: q[4] === "sensitive" }, answers: q }; ui.quiz = null; ui.skinSeg = "routine"; save(); render(); window.scrollTo(0, 0); return; }
    case "goTab": ui.tab = D.v; render(); window.scrollTo(0, 0); return;
    case "ciSave": { const w = parseFloat($("#ciW").value), wa = parseFloat($("#ciWa").value), okW = w >= 30 && w <= 250, okWa = wa >= 40 && wa <= 200;
      if (!okW && !okWa) { toast("Enter your weight in kg, your waist in cm, or both."); return; }
      const t = todayISO(); S.checkins = S.checkins.filter(c => c.date !== t); S.checkins.push({ date: t, w: okW ? Math.round(w * 10) / 10 : null, wa: okWa ? Math.round(wa * 10) / 10 : null });
      S.checkins.sort((a, b) => a.date.localeCompare(b.date)); S.checkins = S.checkins.slice(-104); save(); render(); toast("Check-in saved"); return; }
    case "ciDel": S.checkins = S.checkins.filter(c => c.date !== D.id); save(); render(); return;
    case "shaved": { const t = todayISO(); if (S.shave.last === t) { toast("Already logged today"); return; } S.shave.n++; S.shave.last = t; save(); render(); toast(S.shave.n >= 7 ? "Time for a new blade" : "Shave logged"); return; }
    case "newBlade": S.shave.n = 0; save(); render(); toast("Blade count reset"); return;
    case "debSeg": ui.debSeg = D.v; render(); window.scrollTo(0, 0); return;
    case "hlSeg": ui.hlSeg = D.v; render(); window.scrollTo(0, 0); return;
    case "supp": { const d = day(); d.supps = d.supps || {}; d.supps[D.id] = !d.supps[D.id]; save(); render(); return; }
    case "suppOn": S.supps.on[D.id] = !S.supps.on[D.id]; save(); render(); return;
    case "gutAdd": { const v = ($("#plantIn").value || "").trim().toLowerCase().slice(0, 30); if (!v) return; gutWeek(); if (!S.gut.plants.includes(v) && S.gut.plants.length < 80) S.gut.plants.push(v); save(); render(); return; }
    case "gutDel": gutWeek(); S.gut.plants = S.gut.plants.filter(x => x !== D.id); save(); render(); return;
    case "skinSeg": ui.skinSeg = D.v; render(); return;
    case "coachStart": ui.coach = { plan: coachPlan(), i: 0, rep: 0, phase: "ready", left: 0 }; render(); window.scrollTo(0, 0); return;
    case "coachGo": { const c = ui.coach, step = c.plan[c.i]; c.phase = "hold"; c.left = step.hold; beep(880, 100); stopCoachTimer(); coachTimer = setInterval(coachTick, 1000); render(); return; }
    case "coachSkip": { const c = ui.coach; stopCoachTimer(); c.i++; c.rep = 0; c.phase = "ready"; if (c.i >= c.plan.length) finishCoach(); else render(); return; }
    case "coachClose": stopCoachTimer(); ui.coach = null; render(); return;
    case "angle": ui.photoAngle = D.v; ui.cmpA = ui.cmpB = null; render(); return;
    case "photo": $("#filePhoto").click(); return;
    case "ask": ui.confirm = D.id; render(); return;
    case "delPhoto": S.photos = S.photos.filter(p => p.id !== D.id); idb.del(D.id).catch(() => { }); ui.confirm = null; save(); render(); return;
    case "export": { const data = { ...S, exportedAt: new Date().toISOString(), app: "sculpt" }; if (await shareOrDownload(`sculpt-backup-${todayISO()}.json`, JSON.stringify(data, null, 1), "application/json")) toast("Backup ready"); return; }
    case "import": $("#fileBackup").click(); return;
  }
});
document.addEventListener("change", async ev => {
  const el = ev.target;
  if (el.id === "filePhoto" && el.files[0]) { try { const b = await compress(el.files[0]), id = "p" + uid(); await idb.put(id, b); S.photos.push({ id, date: todayISO(), angle: ui.photoAngle }); save(); render(); toast("Photo saved"); } catch (e) { toast(e.message || "Couldn't save that photo."); } el.value = ""; return; }
  if (el.id === "fileBackup" && el.files[0]) { try { const d = JSON.parse(await el.files[0].text()); if (d.app !== "sculpt") throw 0; const keep = S.photos; S = fillDefaults(blank(), d); delete S.app; delete S.exportedAt; if (!S.photos.length) S.photos = keep; save(); applyTheme(); render(); toast("Restored"); } catch { toast("That file isn't a Sculpt backup."); } el.value = ""; return; }
  const a = el.dataset.actChange; if (!a) return;
  if (a === "goal") { S.settings.goal = +el.value; save(); render(); }
  if (a === "theme") { S.settings.theme = el.value; save(); applyTheme(); }
  if (a === "cmpA") { ui.cmpA = el.value; render(); }
  if (a === "cmpB") { ui.cmpB = el.value; render(); }
});
document.addEventListener("input", ev => { if (ev.target.dataset.actInput === "cut") ev.target.closest(".compare").style.setProperty("--cut", ev.target.value + "%"); });
document.addEventListener("visibilitychange", () => { if (!document.hidden && ui.tab === "today") render(); });

applyTheme(); render();
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => { });
