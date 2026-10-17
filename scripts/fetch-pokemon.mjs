// Récupère les 1025 Pokémon depuis PokeAPI et écrit un JSON compact.
// Usage : node fetch.mjs <chemin/sortie.json>
import { writeFileSync } from "node:fs";

const OUT = process.argv[2];
const MAX = 1025;
const API = "https://pokeapi.co/api/v2";
const cache = new Map();

async function get(url, tries = 4) {
  if (cache.has(url)) return cache.get(url);
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status + " " + url);
      const j = await r.json();
      cache.set(url, j);
      return j;
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((res) => setTimeout(res, 800 * (i + 1)));
    }
  }
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0, done = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const k = i++;
      out[k] = await fn(items[k]);
      if (++done % 100 === 0) console.error(`  ${done}/${items.length}`);
    }
  }));
  return out;
}

const clean = (s) => s.replace(/[\n\f­\r]+/g, " ").replace(/\s+/g, " ").trim();
const pick = (arr, lang) => arr.find((x) => x.language.name === lang);
const idFromUrl = (u) => +u.split("/").filter(Boolean).pop();

console.error("Pokémon + espèces…");
const ids = Array.from({ length: MAX }, (_, i) => i + 1);
const raw = await pool(ids, 12, async (id) => {
  const [p, s] = await Promise.all([get(`${API}/pokemon/${id}`), get(`${API}/pokemon-species/${id}`)]);
  return { p, s };
});

console.error("Talents…");
const abilityUrls = [...new Set(raw.flatMap(({ p }) => p.abilities.map((a) => a.ability.url)))];
const abilityFr = {};
await pool(abilityUrls, 12, async (u) => {
  const a = await get(u);
  abilityFr[u] = pick(a.names, "fr")?.name || a.name;
});

console.error("Chaînes d'évolution…");
const chainUrls = [...new Set(raw.map(({ s }) => s.evolution_chain?.url).filter(Boolean))];
const chains = [];
const chainIndex = {};
await pool(chainUrls, 12, async (u) => {
  const c = await get(u);
  const stages = [];
  (function walk(node, depth) {
    const id = idFromUrl(node.species.url);
    if (id <= MAX) (stages[depth] ||= []).push(id);
    node.evolves_to.forEach((n) => walk(n, depth + 1));
  })(c.chain, 0);
  chainIndex[u] = chains.push(stages.filter(Boolean)) - 1;
});

const genNum = { "generation-i": 1, "generation-ii": 2, "generation-iii": 3, "generation-iv": 4, "generation-v": 5, "generation-vi": 6, "generation-vii": 7, "generation-viii": 8, "generation-ix": 9 };

const pokemon = raw.map(({ p, s }) => {
  const fr = pick(s.names, "fr")?.name || s.name;
  const en = pick(s.names, "en")?.name || s.name;
  const flav = s.flavor_text_entries.filter((f) => f.language.name === "fr");
  const flavEn = s.flavor_text_entries.filter((f) => f.language.name === "en");
  const desc = clean((flav.at(-1) || flavEn.at(-1))?.flavor_text || "");
  const descEn = !flav.length; // pas encore de traduction FR (souvent la Gen 9)
  const stat = (n) => p.stats.find((x) => x.stat.name === n).base_stat;
  const evoIdx = s.evolution_chain ? chainIndex[s.evolution_chain.url] : -1;
  return {
    id: p.id,
    fr, en,
    genus: pick(s.genera, "fr")?.genus || pick(s.genera, "en")?.genus || "",
    types: p.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
    h: p.height / 10,
    w: p.weight / 10,
    stats: ["hp", "attack", "defense", "special-attack", "special-defense", "speed"].map(stat),
    ab: p.abilities.sort((a, b) => a.slot - b.slot).map((a) => [abilityFr[a.ability.url], a.is_hidden ? 1 : 0]),
    desc,
    ...(descEn ? { descEn: 1 } : {}),
    gen: genNum[s.generation.name] || 0,
    rare: s.is_mythical ? 2 : s.is_legendary ? 1 : 0,
    baby: s.is_baby ? 1 : 0,
    evo: evoIdx,
  };
});

writeFileSync(OUT, JSON.stringify({ pokemon, chains }));
console.error(`OK → ${OUT} (${pokemon.length} Pokémon, ${chains.length} chaînes)`);
