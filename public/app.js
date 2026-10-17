// PokéDate — le dernier chiffre du jour, du mois et de l'année donnent le numéro du Pokémon.

const SPR = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const CRY = "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest";
const art = (id, shiny) => `${SPR}/other/official-artwork/${shiny ? "shiny/" : ""}${id}.png`;
const mini = (id, shiny) => `${SPR}/${shiny ? "shiny/" : ""}${id}.png`;

const TYPES = {
  normal: ["Normal", "#9FA19F", "⭐"], fire: ["Feu", "#E62829", "🔥"], water: ["Eau", "#2980EF", "💧"],
  electric: ["Électrik", "#E0AE00", "⚡"], grass: ["Plante", "#3FA129", "🌿"], ice: ["Glace", "#3DCEF3", "❄️"],
  fighting: ["Combat", "#FF8000", "🥊"], poison: ["Poison", "#9141CB", "☠️"], ground: ["Sol", "#915121", "⛰️"],
  flying: ["Vol", "#81B9EF", "🪶"], psychic: ["Psy", "#EF4179", "🔮"], bug: ["Insecte", "#91A119", "🐛"],
  rock: ["Roche", "#AFA981", "🪨"], ghost: ["Spectre", "#704170", "👻"], dragon: ["Dragon", "#5060E1", "🐉"],
  dark: ["Ténèbres", "#624D4E", "🌙"], steel: ["Acier", "#60A1B8", "⚙️"], fairy: ["Fée", "#EF70EF", "✨"],
};

// Efficacité offensive : attaquant → { défenseur: multiplicateur } (les ×1 sont omis)
const CHART = {
  normal: { rock: .5, ghost: 0, steel: .5 },
  fire: { fire: .5, water: .5, grass: 2, ice: 2, bug: 2, rock: .5, dragon: .5, steel: 2 },
  water: { fire: 2, water: .5, grass: .5, ground: 2, rock: 2, dragon: .5 },
  electric: { water: 2, electric: .5, grass: .5, ground: 0, flying: 2, dragon: .5 },
  grass: { fire: .5, water: 2, grass: .5, poison: .5, ground: 2, flying: .5, bug: .5, rock: 2, dragon: .5, steel: .5 },
  ice: { fire: .5, water: .5, grass: 2, ice: .5, ground: 2, flying: 2, dragon: 2, steel: .5 },
  fighting: { normal: 2, ice: 2, poison: .5, flying: .5, psychic: .5, bug: .5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: .5 },
  poison: { grass: 2, poison: .5, ground: .5, rock: .5, ghost: .5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: .5, poison: 2, flying: 0, bug: .5, rock: 2, steel: 2 },
  flying: { electric: .5, grass: 2, fighting: 2, bug: 2, rock: .5, steel: .5 },
  psychic: { fighting: 2, poison: 2, psychic: .5, dark: 0, steel: .5 },
  bug: { fire: .5, grass: 2, fighting: .5, poison: .5, flying: .5, psychic: 2, ghost: .5, dark: 2, steel: .5, fairy: .5 },
  rock: { fire: 2, ice: 2, fighting: .5, ground: .5, flying: 2, bug: 2, steel: .5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: .5 },
  dragon: { dragon: 2, steel: .5, fairy: 0 },
  dark: { fighting: .5, psychic: 2, ghost: 2, dark: .5, fairy: .5 },
  steel: { fire: .5, water: .5, electric: .5, ice: 2, rock: 2, steel: .5, fairy: 2 },
  fairy: { fire: .5, fighting: 2, poison: .5, dragon: 2, dark: 2, steel: .5 },
};
const eff = (atk, defTypes) => defTypes.reduce((m, d) => m * (CHART[atk][d] ?? 1), 1);

const STAT_LABELS = ["PV", "Attaque", "Défense", "Atq. Spé.", "Déf. Spé.", "Vitesse"];
const GENS = [null, ["I", "Kanto"], ["II", "Johto"], ["III", "Hoenn"], ["IV", "Sinnoh"], ["V", "Unys"], ["VI", "Kalos"], ["VII", "Alola"], ["VIII", "Galar"], ["IX", "Paldea"]];

const TYPE_TRAIT = {
  normal: "Fiable et adaptable, tu t'entends avec absolument tout le monde.",
  fire: "Tempérament de feu : tu t'enflammes vite, pour le meilleur.",
  water: "Calme en surface, profond à l'intérieur.",
  electric: "Toujours à 100 % de batterie (sauf le lundi matin).",
  grass: "Zen et patient, tu as la main verte… et le cœur aussi.",
  ice: "Cool en toutes circonstances. Un peu glacial au réveil.",
  fighting: "Jamais sans ton échauffement : aucun défi ne te fait peur.",
  poison: "Un humour piquant que tes potes adorent (à petite dose).",
  ground: "Les pieds sur terre : c'est toi le pilier du groupe.",
  flying: "Tête en l'air, mais toujours une longueur d'avance.",
  psychic: "Tu sais déjà ce que tes amis vont dire. C'est un peu inquiétant.",
  bug: "Petit mais travailleur, tu brilles en équipe.",
  rock: "Solide comme un roc… et têtu comme une pierre.",
  ghost: "Mystérieux, tu quittes les soirées sans prévenir personne.",
  dragon: "Charisme légendaire. Et tu le sais.",
  dark: "Un côté obscur… surtout avant le premier café.",
  steel: "Volonté d'acier et routine millimétrée.",
  fairy: "Tu mets des paillettes dans la vie des autres.",
};
const STAT_TRAIT = [
  "Ton super-pouvoir : l'endurance, tu tiens jusqu'au bout de la nuit.",
  "Ton super-pouvoir : foncer. Réfléchir, c'est pour après.",
  "Ton super-pouvoir : rien ne t'atteint, surtout pas les critiques.",
  "Ton super-pouvoir : une imagination qui déborde.",
  "Ton super-pouvoir : la sagesse, tes conseils valent de l'or.",
  "Ton super-pouvoir : la vitesse. Toujours premier arrivé au buffet.",
];

/* ---------------- utilitaires ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n, l = 2) => String(n).padStart(l, "0");
const fmt = (n, d = 1) => n.toLocaleString("fr-FR", { maximumFractionDigits: d });
const typeChip = (t, sm) => `<span class="type${sm ? " sm" : ""}" style="--c:${TYPES[t][1]}">${TYPES[t][2]} ${TYPES[t][0]}</span>`;

function hash(str) { // FNV-1a
  let h = 2166136261;
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2600);
}

const store = {
  get(k, fb) { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ---------------- la règle ---------------- */
function idFromDate({ d, m, y }) {
  const n = (d % 10) * 100 + (m % 10) * 10 + (y % 10);
  return n === 0 ? 1000 : n; // 0/0/0 → #1000, histoire de ne pas tomber sur rien
}
const isShiny = ({ d, m, y }) => hash(`${d}-${m}-${y}`) % 20 === 0; // ~5 % des dates
// Date « miroir » (jour = mois) : un des 25 Pokémon #1001–1025, inaccessibles autrement
const secretId = ({ d, m, y }) => (d === m ? 1001 + ((y * 31 + d) % 25) : null);

/* ---------------- données ---------------- */
let DATA, CHAINS;
const P = (id) => DATA[id - 1];

/* ---------------- champs de date ---------------- */
function setupDateField(root) {
  const inputs = $$("input", root);
  inputs.forEach((inp, i) => {
    inp.addEventListener("input", () => {
      inp.value = inp.value.replace(/\D/g, "");
      if (inp.value.length >= +inp.maxLength && inputs[i + 1]) inputs[i + 1].focus();
    });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !inp.value && inputs[i - 1]) inputs[i - 1].focus();
      if ((e.key === "/" || e.key === "." || e.key === "-") && inputs[i + 1]) { e.preventDefault(); inputs[i + 1].focus(); }
    });
    inp.addEventListener("focus", () => inp.select());
  });
}
function readDate(root) {
  const v = Object.fromEntries($$("input", root).map((i) => [i.dataset.part, i.value.trim()]));
  if (!v.d || !v.m || !v.y) return { error: "Il manque un morceau de la date." };
  if (v.y.length !== 4) return { error: "L'année s'écrit avec 4 chiffres (ex. 1995)." };
  const d = +v.d, m = +v.m, y = +v.y;
  const dt = new Date(2000, 0, 1);
  dt.setFullYear(y, m - 1, d);
  if (m < 1 || m > 12 || d < 1 || dt.getDate() !== d || dt.getMonth() !== m - 1)
    return { error: `Le ${pad(d)}/${pad(m)} n'existe pas… même chez les Pokémon 😅` };
  return { d, m, y, raw: v };
}
function writeDate(root, { d, m, y }) {
  const [a, b, c] = $$("input", root);
  a.value = pad(d); b.value = pad(m); c.value = pad(y, 4);
}

/* ---------------- Pokédex perso ---------------- */
const dex = store.get("pokedate.dex", {});
function catchMon(id, shiny) {
  const isNew = !dex[id];
  dex[id] = { s: (dex[id]?.s || 0) | (shiny ? 1 : 0) };
  store.set("pokedate.dex", dex);
  updateDexCount();
  return isNew;
}
function updateDexCount() { $("#dexCount").textContent = Object.keys(dex).length; }

/* ---------------- thème ---------------- */
function setAccent(types) {
  const r = document.documentElement.style;
  r.setProperty("--accent", TYPES[types[0]][1]);
  r.setProperty("--accent-2", TYPES[types[1] || types[0]][1]);
}

/* ---------------- carte Pokémon ---------------- */
function heightHint(h) {
  if (h <= 0.3) return "Tient dans ta poche 👖";
  if (h <= 0.7) return "Tient dans ton sac à dos 🎒";
  if (h < 1.4) return "T'arrive à peu près à la taille";
  if (h <= 2) return "À peu près ta hauteur 🧍";
  return `${fmt(h / 1.7)}× ta taille 🦒`;
}
function weightHint(w) {
  if (w < 0.25) return "Plus léger qu'une baguette 🥖";
  return `≈ ${fmt(Math.round(w / 0.25), 0)} baguette${w >= 0.5 ? "s" : ""} 🥖`;
}

function matchupsHtml(types) {
  const groups = { weak: [], resist: [], immune: [] };
  for (const t of Object.keys(TYPES)) {
    const m = eff(t, types);
    if (m === 0) groups.immune.push([t, m]);
    else if (m > 1) groups.weak.push([t, m]);
    else if (m < 1) groups.resist.push([t, m]);
  }
  groups.weak.sort((a, b) => b[1] - a[1]);
  const lbl = (m) => (m === 4 ? "×4" : m === 0.25 ? "×¼" : m === 0.5 ? "×½" : m === 0 ? "×0" : "×2");
  const row = (title, arr) =>
    arr.length ? `<div class="row"><em>${title}</em>${arr.map(([t, m]) => `<span class="type sm" style="--c:${TYPES[t][1]}">${TYPES[t][2]} ${TYPES[t][0]}<span class="mult">${lbl(m)}</span></span>`).join("")}</div>` : "";
  return row("Faible contre", groups.weak) + row("Résiste à", groups.resist) + row("Immunisé contre", groups.immune);
}

function evoHtml(p) {
  const stages = CHAINS[p.evo] || [[p.id]];
  if (stages.flat().length < 2) return "";
  const many = stages.some((s) => s.length > 3);
  return `<div><p class="block-title">Évolutions</p><div class="evo${many ? " many" : ""}">${stages
    .map((s) => `<div class="stage-col">${s.map((id) =>
      `<button type="button" data-goto="${id}" class="${id === p.id ? "current" : ""}"><img loading="lazy" src="${mini(id)}" alt="" onerror="this.src='${art(id)}'">${esc(P(id).fr)}</button>`).join("")}</div>`)
    .join('<span class="arrow">→</span>')}</div></div>`;
}

function formulaHtml(raw, id) {
  const chunk = (s) => `<span class="chunk"><span>${s.slice(0, -1)}</span><b>${s.slice(-1)}</b></span>`;
  const n = idFromDate({ d: +raw.d, m: +raw.m, y: +raw.y });
  return `<div class="formula">${chunk(pad(raw.d))}<span>/</span>${chunk(pad(raw.m))}<span>/</span>${chunk(raw.y)}
    <span class="arrow">→</span><span class="num">N° ${pad(id, 3)}</span>${n === 1000 ? '<span>(000 devient 1000 !)</span>' : ""}</div>`;
}

let current = null; // { id, shiny, date }

function showPokemon(id, { date = null, raw = null, shiny = false, animate = true } = {}) {
  const p = P(id);
  current = { id, shiny, date };
  setAccent(p.types);
  const isNew = catchMon(id, shiny);
  const total = p.stats.reduce((a, b) => a + b, 0);
  const best = p.stats.indexOf(Math.max(...p.stats));
  const gen = GENS[p.gen];
  const secret = date && secretId(date);

  const el = $("#result");
  el.hidden = false;
  el.innerHTML = `
    ${raw ? formulaHtml(raw, id) : `<p class="explore-note">Exploration du Pokédex${date ? "" : ` · <button type="button" data-back>revenir à ma date</button>`}</p>`}
    <article class="card" style="--accent:${TYPES[p.types[0]][1]}">
      <div class="card-grid">
        <div class="stage${animate ? " hidden-mon" : ""}">
          <span class="bignum">${pad(id, 4)}</span>
          <div class="halo"></div>
          <img class="art" src="${art(id, shiny)}" alt="${esc(p.fr)}" width="320" height="320">
          <span class="who">Qui est-ce&nbsp;?</span>
          <span class="ball reveal-ball" aria-hidden="true"></span>
          <div class="tools">
            <button class="icon-btn" type="button" data-cry title="Écouter son cri" aria-label="Écouter son cri">🔊</button>
            <button class="icon-btn" type="button" data-shiny aria-pressed="${shiny}" title="Version chromatique (shiny)" aria-label="Version shiny">✨</button>
          </div>
          ${date && shiny ? '<span class="shiny-badge">✨ Shiny ! 1 date sur 20</span>' : ""}
        </div>
        <div class="info">
          <div class="id-line">N° ${pad(id, 4)} · Gén. ${gen[0]} (${gen[1]})
            ${p.rare === 1 ? '<span class="tag">Légendaire</span>' : ""}${p.rare === 2 ? '<span class="tag myth">Fabuleux</span>' : ""}${p.baby ? '<span class="tag baby">Bébé</span>' : ""}
            ${isNew ? '<span class="tag" style="background:#7dffa9">Nouveau !</span>' : ""}
          </div>
          <h2 class="mon-name">${esc(p.fr)}<small>${esc(p.en)} · ${esc(p.genus)}</small></h2>
          <div class="types">${p.types.map((t) => typeChip(t)).join("")}</div>
          <p class="desc">${esc(p.desc)}${p.descEn ? '<span class="en">(pas encore traduit en français)</span>' : ""}</p>
          <p class="horoscope"><strong>Si tu étais ${esc(p.fr)}…</strong> ${TYPE_TRAIT[p.types[0]]} ${STAT_TRAIT[best]}</p>
          <div class="facts">
            <div class="fact"><div class="k">Taille</div><div class="v">${fmt(p.h)} m</div><div class="hint">${heightHint(p.h)}</div></div>
            <div class="fact"><div class="k">Poids</div><div class="v">${fmt(p.w)} kg</div><div class="hint">${weightHint(p.w)}</div></div>
            <div class="fact"><div class="k">Talents</div><div class="v">${p.ab.map(([n, h]) => esc(n) + (h ? ' <span class="hint">(caché)</span>' : "")).join("<br>")}</div></div>
          </div>
          <div>
            <p class="block-title">Statistiques de base</p>
            <div class="stats">
              ${p.stats.map((v, i) => `<span class="lbl">${STAT_LABELS[i]}</span><span class="val">${v}</span><div class="bar"><i data-w="${Math.min(100, (v / 200) * 100)}" class="${i === best ? "top" : ""}"></i></div>`).join("")}
              <div class="total"><span>Total</span><span>${total}</span></div>
            </div>
          </div>
          <div><p class="block-title">Types face à lui</p><div class="matchups">${matchupsHtml(p.types)}</div></div>
          ${evoHtml(p)}
          <div class="card-actions">
            <button class="btn primary small" type="button" data-share>Partager 📤</button>
            ${date ? '<button class="btn ghost small" type="button" data-duel>Défier un ami ⚔️</button>' : ""}
          </div>
        </div>
      </div>
    </article>
    ${secret ? `<button type="button" class="secret" data-goto="${secret}">
        <img src="${art(secret)}" alt="">
        <div><b>🌌 Date miroir ! Le jour et le mois sont identiques.</b>
        <span>Un Pokémon rare (#1001–1025) surgit : <strong>${esc(P(secret).fr)}</strong>. Clique pour le découvrir.</span></div>
      </button>` : ""}`;

  if (secret) catchMon(secret, false);

  const stage = $(".stage", el);
  const reveal = () => {
    stage.classList.remove("hidden-mon");
    $$(".bar i", el).forEach((b) => (b.style.width = b.dataset.w + "%"));
    if (shiny || p.rare) confetti(shiny ? ["#ffd23f", "#fff3b0", "#ffffff"] : [TYPES[p.types[0]][1], "#ffd23f", "#ffffff"]);
  };
  if (animate) {
    const t = setTimeout(reveal, 1300);
    stage.addEventListener("click", () => { clearTimeout(t); reveal(); }, { once: true });
  } else requestAnimationFrame(() => requestAnimationFrame(reveal));

  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------------- interactions carte ---------------- */
$("#result").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || !current) return;
  if (b.dataset.goto) return showPokemon(+b.dataset.goto, { animate: false });
  if ("back" in b.dataset) return $("#formMe").requestSubmit();
  if ("cry" in b.dataset) {
    new Audio(`${CRY}/${current.id}.ogg`).play().catch(() => toast("Cri indisponible sur ce navigateur 🙉"));
    b.animate([{ transform: "scale(1.3)" }, { transform: "scale(1)" }], 300);
  }
  if ("shiny" in b.dataset) {
    current.shiny = !current.shiny;
    b.setAttribute("aria-pressed", current.shiny);
    $(".stage img.art").src = art(current.id, current.shiny);
    if (current.shiny) sparkles($(".stage"));
  }
  if ("share" in b.dataset) share();
  if ("duel" in b.dataset) {
    switchTab("duel");
    writeDate($$("#formDuel [data-date]")[0], current.date);
    $$("#formDuel [data-date]")[1].querySelector("input").focus();
  }
});

function sparkles(stage) {
  for (let i = 0; i < 8; i++) {
    const s = document.createElement("span");
    s.className = "sparkle";
    s.textContent = "✦";
    s.style.cssText = `left:${15 + Math.random() * 70}%;top:${15 + Math.random() * 60}%;animation-delay:${Math.random() * .6}s;color:#ffe680`;
    stage.appendChild(s);
    setTimeout(() => s.remove(), 2400);
  }
}

async function share() {
  const p = P(current.id);
  const url = new URL(location.href.split("?")[0]);
  let text;
  if (current.date) {
    const { d, m, y } = current.date;
    url.searchParams.set("date", `${pad(y, 4)}-${pad(m)}-${pad(d)}`);
    text = `Ma date (${pad(d)}/${pad(m)}) me donne ${p.fr} #${current.id}${current.shiny ? " ✨ SHINY" : ""} ! Et toi, quel Pokémon es-tu ?`;
  } else text = `Regarde ${p.fr} (#${current.id}) sur PokéDate !`;
  if (navigator.share) {
    try { await navigator.share({ title: "PokéDate", text, url: url.href }); } catch {}
  } else {
    try { await navigator.clipboard.writeText(`${text} ${url.href}`); toast("Lien copié, envoie-le à tes potes 📋"); }
    catch { prompt("Copie ce lien :", url.href); }
  }
}

/* ---------------- formulaire principal ---------------- */
function submitMe(e) {
  e?.preventDefault();
  const r = readDate($("#formMe [data-date]"));
  $("#errMe").textContent = r.error || "";
  if (r.error) return;
  const date = { d: r.d, m: r.m, y: r.y };
  const shiny = isShiny(date);
  history.replaceState(null, "", `?date=${pad(r.y, 4)}-${pad(r.m)}-${pad(r.d)}`);
  showPokemon(idFromDate(date), { date, raw: r.raw, shiny });
}
$("#formMe").addEventListener("submit", submitMe);
$("#btnToday").addEventListener("click", () => {
  const t = new Date();
  writeDate($("#formMe [data-date]"), { d: t.getDate(), m: t.getMonth() + 1, y: t.getFullYear() });
  submitMe();
});
$("#btnRandom").addEventListener("click", () => {
  const start = new Date(1950, 0, 1).getTime();
  const t = new Date(start + Math.random() * (Date.now() - start));
  writeDate($("#formMe [data-date]"), { d: t.getDate(), m: t.getMonth() + 1, y: t.getFullYear() });
  submitMe();
});

/* ---------------- duel ---------------- */
// Combat simplifié au niveau 50 : une attaque de puissance 80 du meilleur type, physique ou spéciale.
function fightStats(a, b) {
  const phys = a.stats[1] >= a.stats[3];
  const A = (phys ? a.stats[1] : a.stats[3]) + 5;
  const D = (phys ? b.stats[2] : b.stats[4]) + 5;
  const [type, mult] = a.types.map((t) => [t, eff(t, b.types)]).sort((x, y) => y[1] - x[1])[0];
  const dmg = Math.floor((35.2 * A / D + 2) * 1.5 * mult);
  const turns = dmg ? Math.ceil((b.stats[0] + 60) / dmg) : Infinity;
  return { type, mult, dmg, turns, phys };
}
const effText = (m) => (m === 0 ? "n'a aucun effet 🚫" : m >= 4 ? "est ultra efficace 💥" : m >= 2 ? "est super efficace 💥" : m < 1 ? "n'est pas très efficace…" : "touche normalement");

$("#formDuel").addEventListener("submit", (e) => {
  e.preventDefault();
  const [fa, fb] = $$("#formDuel [data-date]");
  const ra = readDate(fa), rb = readDate(fb);
  $("#errDuel").textContent = ra.error || rb.error || "";
  if (ra.error || rb.error) return;
  const nameA = $("#nameA").value.trim() || "Toi", nameB = $("#nameB").value.trim() || "Ton ami·e";
  const A = P(idFromDate(ra)), B = P(idFromDate(rb));
  const sA = isShiny(ra), sB = isShiny(rb);
  catchMon(A.id, sA); catchMon(B.id, sB);

  const ab = fightStats(A, B), ba = fightStats(B, A);
  const aFirst = A.stats[5] > B.stats[5] || (A.stats[5] === B.stats[5] && A.stats.reduce((x, y) => x + y) >= B.stats.reduce((x, y) => x + y));
  let winner = null;
  if (ab.turns === Infinity && ba.turns === Infinity) winner = null;
  else if (A.id === B.id) winner = null;
  else if (aFirst) winner = ab.turns <= ba.turns ? "A" : "B";
  else winner = ba.turns <= ab.turns ? "B" : "A";

  const fighter = (p, who, side, shiny, cls) => `
    <div class="fighter ${side} ${cls}" style="--accent:${TYPES[p.types[0]][1]}">
      ${cls === "win" ? '<span class="crown">👑</span>' : ""}
      <img src="${art(p.id, shiny)}" alt="${esc(p.fr)}">
      <div class="who-name">${esc(who)}</div>
      <h3>${esc(p.fr)}${shiny ? " ✨" : ""} <small style="color:var(--muted);font-size:.9rem">#${p.id}</small></h3>
      <div class="types">${p.types.map((t) => typeChip(t, true)).join("")}</div>
      <div class="power">Total stats <b>${p.stats.reduce((x, y) => x + y)}</b> · Vitesse <b>${p.stats[5]}</b></div>
    </div>`;
  const ko = (s) => (s.turns === Infinity ? "ne peut pas le toucher" : `le met K.O. en ${s.turns} tour${s.turns > 1 ? "s" : ""}`);
  const wName = winner === "A" ? nameA : nameB, wMon = winner === "A" ? A : B;

  const out = $("#duelResult");
  out.hidden = false;
  out.innerHTML = `
    <div class="arena">
      ${fighter(A, nameA, "left", sA, winner ? (winner === "A" ? "win" : "lose") : "")}
      <div class="vs-mid"><span>VS</span></div>
      ${fighter(B, nameB, "right", sB, winner ? (winner === "B" ? "win" : "lose") : "")}
    </div>
    <div class="verdict">
      <h2>${winner ? `🏆 ${esc(wName)} gagne avec ${esc(wMon.fr)} !` : A.id === B.id ? "🪞 Match miroir : même Pokémon, égalité parfaite !" : "🤝 Match nul !"}</h2>
      <ul>
        <li>${esc(A.fr)} attaque en ${TYPES[ab.type][2]} ${TYPES[ab.type][0]} : ça ${effText(ab.mult)} (×${fmt(ab.mult, 2)}) et ${ko(ab)}.</li>
        <li>${esc(B.fr)} attaque en ${TYPES[ba.type][2]} ${TYPES[ba.type][0]} : ça ${effText(ba.mult)} (×${fmt(ba.mult, 2)}) et ${ko(ba)}.</li>
        <li>${esc(aFirst ? A.fr : B.fr)} est ${A.stats[5] === B.stats[5] ? "aussi rapide mais plus costaud" : "plus rapide"} et frappe en premier.</li>
      </ul>
    </div>
    <div class="actions" style="margin-top:16px"><button class="btn ghost small" type="button" id="duelShare">Partager le duel 📤</button></div>`;
  setAccent(winner === "B" ? B.types : A.types);
  if (winner) setTimeout(() => confetti(["#ffd23f", TYPES[wMon.types[0]][1], "#fff"]), 900);
  out.scrollIntoView({ behavior: "smooth", block: "start" });

  $("#duelShare").onclick = async () => {
    const url = new URL(location.href.split("?")[0]);
    url.searchParams.set("a", `${ra.y}-${pad(ra.m)}-${pad(ra.d)}`);
    url.searchParams.set("b", `${rb.y}-${pad(rb.m)}-${pad(rb.d)}`);
    url.searchParams.set("na", nameA); url.searchParams.set("nb", nameB);
    const text = winner ? `${wName} gagne le duel PokéDate avec ${wMon.fr} ! Revanche ?` : "Match nul au duel PokéDate !";
    if (navigator.share) { try { await navigator.share({ title: "PokéDate", text, url: url.href }); } catch {} }
    else { try { await navigator.clipboard.writeText(`${text} ${url.href}`); toast("Lien du duel copié 📋"); } catch { prompt("Copie ce lien :", url.href); } }
  };
});

/* ---------------- Pokédex ---------------- */
function renderDex() {
  const n = Object.keys(dex).length;
  $("#dexBar").style.width = (n / DATA.length) * 100 + "%";
  const shinies = Object.values(dex).filter((x) => x.s).length;
  $("#dexText").textContent = `${n} / ${DATA.length} découverts (${fmt((n / DATA.length) * 100)} %)${shinies ? ` · ${shinies} shiny ✨` : ""}`;
  const only = $("#dexOnly").checked;
  const list = only ? DATA.filter((p) => dex[p.id]) : DATA;
  $("#dexGrid").innerHTML = list.length
    ? list.map((p) => dex[p.id]
        ? `<button type="button" class="dex-cell${dex[p.id].s ? " shiny" : ""}" data-id="${p.id}"><img loading="lazy" src="${mini(p.id, dex[p.id].s)}" alt="" onerror="this.src='${art(p.id)}'"><b>${esc(p.fr)}</b>#${pad(p.id, 4)}</button>`
        : `<div class="dex-cell unknown"><span class="q">?</span>#${pad(p.id, 4)}</div>`).join("")
    : `<p class="dex-empty">Ton Pokédex est vide. Révèle ton premier Pokémon !</p>`;
}
$("#dexOnly").addEventListener("change", renderDex);
$("#dexGrid").addEventListener("click", (e) => {
  const c = e.target.closest("[data-id]");
  if (!c) return;
  switchTab("me");
  showPokemon(+c.dataset.id, { animate: false, shiny: !!dex[c.dataset.id]?.s });
});

/* ---------------- onglets ---------------- */
function switchTab(name) {
  $$(".tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === name));
  $$(".panel").forEach((p) => (p.hidden = p.id !== `tab-${name}`));
  if (name === "dex") renderDex();
}
$$(".tabs button").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

/* ---------------- confettis ---------------- */
function confetti(colors) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = $("#confetti"), ctx = c.getContext("2d");
  const dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const parts = Array.from({ length: 160 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35,
    vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, r: Math.random() * 6 + 4,
    rot: Math.random() * 6, vr: (Math.random() - .5) * .3, c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  (function frame(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
    }
    if (t - t0 < 3000) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(t0);
}

/* ---------------- démarrage ---------------- */
$$("[data-date]").forEach(setupDateField);
updateDexCount();

const res = await fetch("data/pokemon.json");
({ pokemon: DATA, chains: CHAINS } = await res.json());

const params = new URLSearchParams(location.search);
const parseIso = (s) => { const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s || ""); return m && { y: +m[1], m: +m[2], d: +m[3] }; };
if (params.get("a") && params.get("b")) {
  const a = parseIso(params.get("a")), b = parseIso(params.get("b"));
  if (a && b) {
    switchTab("duel");
    const [fa, fb] = $$("#formDuel [data-date]");
    writeDate(fa, a); writeDate(fb, b);
    $("#nameA").value = params.get("na") || ""; $("#nameB").value = params.get("nb") || "";
    $("#formDuel").requestSubmit();
  }
} else if (parseIso(params.get("date"))) {
  writeDate($("#formMe [data-date]"), parseIso(params.get("date")));
  submitMe();
}
