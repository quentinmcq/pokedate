# PokéDate

Le dernier chiffre du jour, du mois et de l'année d'une date donnent un Pokémon : 17/10/2026 → 7·0·6 → **#706 Muplodocus**.

https://pokedate.fr

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
| `bun run deploy`   | Mise en ligne manuelle (sinon automatique via CI)  |
| `bun run data`     | Régénère `server/data/pokemon.json` depuis PokeAPI |

## Mesure d'audience

[Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/), sans cookie. Le script ne se charge que
sur le domaine de `siteUrl` et seulement si le jeton du site est défini, dans les `vars` de `wrangler.jsonc` :
`NUXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN`.

## Qualité

| Quand            | Quoi                                    |
| ---------------- | --------------------------------------- |
| Commit           | Formatage et lint des fichiers modifiés |
| Push             | Types et tests unitaires                |
| Pull request     | Tout, plus les tests Playwright (CI)    |
| Merge sur `main` | Tout, puis déploiement sur Cloudflare   |
| Chaque lundi     | Mises à jour des dépendances (Renovate) |

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
