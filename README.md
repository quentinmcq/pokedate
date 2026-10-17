# PokéDate

Le dernier chiffre du jour, du mois et de l'année d'une date donnent un Pokémon : 17/10/2026 → 7·0·6 → **#706 Muplodocus**.

https://pokedate.quentin-macq.workers.dev

## Démarrer

```bash
bun install
bun run sprites   # images et cris des 1025 Pokémon, une seule fois (~5 min)
bun run dev
```

## Commandes

| Commande           | Rôle                                               |
| ------------------ | -------------------------------------------------- |
| `bun run check`    | Lint, formatage, types et tests unitaires          |
| `bun run test:e2e` | Tests Playwright sur le build Cloudflare           |
| `bun run preview`  | Build servi par `wrangler dev`                     |
| `bun run deploy`   | Vérifications puis mise en ligne (Cloudflare)      |
| `bun run data`     | Régénère `server/data/pokemon.json` depuis PokeAPI |

## Qualité

| Quand        | Quoi                                    |
| ------------ | --------------------------------------- |
| Commit       | Formatage et lint des fichiers modifiés |
| Push         | Types et tests unitaires                |
| Pull request | Tout, plus les tests Playwright (CI)    |
| Chaque lundi | Mises à jour des dépendances (Renovate) |

## Stack

Nuxt 4 en SSR sur Cloudflare Workers · Bun · SCSS · Nuxt Icon (Lucide) · nuxt-security · oxlint / oxfmt ·
Vitest / Playwright · Lefthook · Renovate.

## Structure

| Dossier      | Contenu                                                     |
| ------------ | ----------------------------------------------------------- |
| `app/`       | Pages, composants, composables, design system SCSS          |
| `server/`    | API (`/api/pokemon/:id`, `/api/pokedex`), sitemap, robots   |
| `shared/`    | Types et logique partagés : règle de la date, types, combat |
| `scripts/`   | Génération des données et des images                        |
| `test/`      | Vitest                                                      |
| `e2e/`       | Playwright                                                  |
| `generated/` | Images et cris générés, hors dépôt                          |

---

Projet de fan non officiel. Pokémon © Nintendo / Game Freak / The Pokémon Company.
