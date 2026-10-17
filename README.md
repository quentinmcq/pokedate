# PokéDate

Entre une date → le dernier chiffre du **jour**, du **mois** et de l'**année** donnent le numéro du Pokémon.
Ex. 17/10/2026 → 7 · 0 · 6 → **#706 Muplodocus**. Si les trois chiffres sont 0 (ex. 10/10/2020) → #1000.

En ligne : https://pokedate.quentin-macq.dev

## Stack

- [Nuxt 4](https://nuxt.com) (Vue 3), rendu côté serveur sur **Cloudflare Workers** (preset Nitro `cloudflare_module`)
- [Bun](https://bun.sh) comme gestionnaire de paquets
- SCSS (`sass-embedded`), [oxlint](https://oxc.rs/docs/guide/usage/linter) et [oxfmt](https://oxc.rs/docs/guide/usage/formatter)

## Commandes

| Commande           | Rôle                                                      |
| ------------------ | --------------------------------------------------------- |
| `bun install`      | Installe les dépendances                                  |
| `bun run dev`      | Serveur de dev sur http://localhost:3000                  |
| `bun run preview`  | Build + test dans le vrai runtime Cloudflare (`wrangler`) |
| `bun run deploy`   | Build + mise en ligne sur Cloudflare Workers              |
| `bun run check`    | Lint + vérification du formatage + types                  |
| `bun run lint:fix` | Corrige ce qu'oxlint sait corriger                        |
| `bun run fmt`      | Formate tout le code                                      |
| `bun run data`     | Regénère `server/data/pokemon.json` depuis PokeAPI        |

## Organisation

```
app/                  Code Vue (Nuxt 4)
  pages/              index (ma date), duel, pokedex, pokemon/[id]
  components/         PokemonCard, DateField, DateFormula, TypeChip, AppHeader
  composables/        usePokemon (données), useDex (Pokédex perso), useUi (toast, partage, couleurs)
  assets/scss/        Styles découpés par zone
server/
  api/                /api/pokemon/:id et /api/pokedex
  data/pokemon.json   Les 1025 Pokémon (noms FR/EN, types, stats, talents, description, évolutions)
shared/               Règles du jeu, types, table des faiblesses, combat (utilisés côté app et serveur)
scripts/              Script de récupération des données PokeAPI
```

Les images et les cris viennent du dépôt GitHub de PokeAPI.

## Fonctionnalités

- Révélation façon « Qui est-ce ? » (silhouette puis Pokémon)
- Shiny chanceux : environ 1 date sur 20 sort en version chromatique (toujours la même pour une date donnée)
- Date miroir (jour = mois, ex. 04/04) : un Pokémon bonus parmi les #1001–1025
- Horoscope Pokémon, taille et poids en « baguettes », faiblesses/résistances, évolutions cliquables, cri
- Duel d'anniversaires entre deux dates (mini-combat au niveau 50)
- Pokédex perso sauvegardé dans le navigateur
- Une page par Pokémon (`/pokemon/133`) et des liens partageables (`/?date=1995-03-12`,
  `/duel?a=1995-03-12&b=1998-07-25&na=Moi&nb=Toi`) avec titre et image d'aperçu propres

Projet de fan non officiel. Pokémon © Nintendo / Game Freak / The Pokémon Company.
