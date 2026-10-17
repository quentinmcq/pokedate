import type { TypeKey } from '../types/pokemon'

export const MAX_POKEMON = 1025

export const artUrl = (id: number, shiny = false) => `/sprites/${shiny ? 'art-shiny' : 'art'}/${id}.webp`
export const miniUrl = (id: number, shiny = false) => `/sprites/${shiny ? 'mini-shiny' : 'mini'}/${id}.webp`
export const cryUrl = (id: number) => `/cries/${id}.ogg`

export const TYPES: Record<TypeKey, [string, string, string, string]> = {
  normal: ['Normal', '#9FA19F', '⭐', '#14162b'],
  fire: ['Feu', '#D92B23', '🔥', '#ffffff'],
  water: ['Eau', '#2980EF', '💧', '#14162b'],
  electric: ['Électrik', '#E0AE00', '⚡', '#14162b'],
  grass: ['Plante', '#3FA129', '🌿', '#14162b'],
  ice: ['Glace', '#3DCEF3', '❄️', '#14162b'],
  fighting: ['Combat', '#FF8000', '🥊', '#14162b'],
  poison: ['Poison', '#9141CB', '☠️', '#ffffff'],
  ground: ['Sol', '#915121', '⛰️', '#ffffff'],
  flying: ['Vol', '#81B9EF', '🪶', '#14162b'],
  psychic: ['Psy', '#EF4179', '🔮', '#14162b'],
  bug: ['Insecte', '#91A119', '🐛', '#14162b'],
  rock: ['Roche', '#AFA981', '🪨', '#14162b'],
  ghost: ['Spectre', '#704170', '👻', '#ffffff'],
  dragon: ['Dragon', '#5060E1', '🐉', '#ffffff'],
  dark: ['Ténèbres', '#624D4E', '🌙', '#ffffff'],
  steel: ['Acier', '#60A1B8', '⚙️', '#14162b'],
  fairy: ['Fée', '#EF70EF', '✨', '#14162b'],
}
export const TYPE_KEYS = Object.keys(TYPES) as TypeKey[]
export const typeColor = (t: TypeKey) => TYPES[t][1]

const CHART: Record<TypeKey, Partial<Record<TypeKey, number>>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
}

export const typeEffect = (atk: TypeKey, defTypes: TypeKey[]) => defTypes.reduce((m, d) => m * (CHART[atk][d] ?? 1), 1)

export interface Matchups {
  weak: [TypeKey, number][]
  resist: [TypeKey, number][]
  immune: [TypeKey, number][]
}
export function matchupsFor(types: TypeKey[]): Matchups {
  const res: Matchups = { weak: [], resist: [], immune: [] }
  for (const t of TYPE_KEYS) {
    const m = typeEffect(t, types)
    if (m === 0) res.immune.push([t, m])
    else if (m > 1) res.weak.push([t, m])
    else if (m < 1) res.resist.push([t, m])
  }
  res.weak.sort((a, b) => b[1] - a[1])
  return res
}
export const multLabel = (m: number) => (m === 4 ? '×4' : m === 0.25 ? '×¼' : m === 0.5 ? '×½' : m === 0 ? '×0' : '×2')

export const STAT_LABELS = ['PV', 'Attaque', 'Défense', 'Atq. Spé.', 'Déf. Spé.', 'Vitesse']
export const GENS: [string, string][] = [
  ['', ''],
  ['I', 'Kanto'],
  ['II', 'Johto'],
  ['III', 'Hoenn'],
  ['IV', 'Sinnoh'],
  ['V', 'Unys'],
  ['VI', 'Kalos'],
  ['VII', 'Alola'],
  ['VIII', 'Galar'],
  ['IX', 'Paldea'],
]

export const TYPE_TRAIT: Record<TypeKey, string> = {
  normal: "Fiable et adaptable, tu t'entends avec absolument tout le monde.",
  fire: "Tempérament de feu : tu t'enflammes vite, pour le meilleur.",
  water: "Calme en surface, profond à l'intérieur.",
  electric: 'Toujours à 100 % de batterie (sauf le lundi matin).',
  grass: 'Zen et patient, tu as la main verte… et le cœur aussi.',
  ice: 'Cool en toutes circonstances. Un peu glacial au réveil.',
  fighting: 'Jamais sans ton échauffement : aucun défi ne te fait peur.',
  poison: 'Un humour piquant que tes potes adorent (à petite dose).',
  ground: "Les pieds sur terre : c'est toi le pilier du groupe.",
  flying: "Tête en l'air, mais toujours une longueur d'avance.",
  psychic: "Tu sais déjà ce que tes amis vont dire. C'est un peu inquiétant.",
  bug: 'Petit mais travailleur, tu brilles en équipe.',
  rock: 'Solide comme un roc… et têtu comme une pierre.',
  ghost: 'Mystérieux, tu quittes les soirées sans prévenir personne.',
  dragon: 'Charisme légendaire. Et tu le sais.',
  dark: 'Un côté obscur… surtout avant le premier café.',
  steel: "Volonté d'acier et routine millimétrée.",
  fairy: 'Tu mets des paillettes dans la vie des autres.',
}
export const STAT_TRAIT = [
  "Ton super-pouvoir : l'endurance, tu tiens jusqu'au bout de la nuit.",
  "Ton super-pouvoir : foncer. Réfléchir, c'est pour après.",
  "Ton super-pouvoir : rien ne t'atteint, surtout pas les critiques.",
  'Ton super-pouvoir : une imagination qui déborde.',
  "Ton super-pouvoir : la sagesse, tes conseils valent de l'or.",
  'Ton super-pouvoir : la vitesse. Toujours premier arrivé au buffet.',
]

export const formatNumber = (n: number, digits = 1) => n.toLocaleString('fr-FR', { maximumFractionDigits: digits })
export const padNumber = (n: number | string, len = 2) => String(n).padStart(len, '0')

export const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const pokemonPath = (p: { id: number; fr: string }) => `/pokemon/${p.id}-${slugify(p.fr)}`

export function heightHint(h: number) {
  if (h <= 0.3) return 'Tient dans ta poche 👖'
  if (h <= 0.7) return 'Tient dans ton sac à dos 🎒'
  if (h < 1.4) return "T'arrive à peu près à la taille"
  if (h <= 2) return 'À peu près ta hauteur 🧍'
  return `${formatNumber(h / 1.7)}× ta taille 🦒`
}
export function weightHint(w: number) {
  if (w < 0.25) return "Plus léger qu'une baguette 🥖"
  return `≈ ${formatNumber(Math.round(w / 0.25), 0)} baguette${w >= 0.5 ? 's' : ''} 🥖`
}
