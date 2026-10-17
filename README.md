# PokéDate

Entre une date → le dernier chiffre du **jour**, du **mois** et de l'**année** donnent le numéro du Pokémon.
Ex. 17/10/2026 → 7 · 0 · 6 → **#706 Muplodocus**. Si les trois chiffres sont 0 (ex. 10/10/2020) → #1000.

En ligne : https://pokedate.quentin-macq.workers.dev

## Stack

- [Nuxt 4](https://nuxt.com) (Vue 3), rendu côté serveur sur **Cloudflare Workers** (preset Nitro `cloudflare_module`)
- [Bun](https://bun.sh) comme gestionnaire de paquets
- SCSS (`sass-embedded`) avec un design system à base de tokens
- [oxlint](https://oxc.rs/docs/guide/usage/linter) et [oxfmt](https://oxc.rs/docs/guide/usage/formatter)
- [nuxt-security](https://nuxt-security.vercel.app) (CSP, en-têtes) et [@nuxt/fonts](https://fonts.nuxt.com) (polices auto-hébergées)
- [Vitest](https://vitest.dev) et [Playwright](https://playwright.dev) pour les tests

## Démarrer

```bash
bun install
bun run sprites   # télécharge les images et cris des 1025 Pokémon dans generated/ (une seule fois, ~5 min)
bun run dev       # http://localhost:3000
```

## Commandes

| Commande            | Rôle                                                            |
| ------------------- | --------------------------------------------------------------- |
| `bun run dev`       | Serveur de développement                                        |
| `bun run preview`   | Build + test dans le vrai runtime Cloudflare (`wrangler dev`)   |
| `bun run deploy`    | Build + mise en ligne sur Cloudflare Workers                    |
| `bun run check`     | Lint + formatage + types + tests unitaires                      |
| `bun run test:unit` | Tests unitaires et de composants (Vitest)                       |
| `bun run test:e2e`  | Build + tests fonctionnels dans Chrome, ordinateur et mobile    |
| `bun run lint:fix`  | Corrige ce qu'oxlint sait corriger                              |
| `bun run fmt`       | Formate tout le code                                            |
| `bun run sprites`   | (Re)génère images, cris et aperçus de partage dans `generated/` |
| `bun run data`      | Regénère `server/data/pokemon.json` depuis PokeAPI              |

Avant les tests fonctionnels la première fois : `bunx playwright install chromium`.

## Organisation

```
app/
  pages/              index (ma date), duel, pokedex, pokemon/index (les 1025), pokemon/[slug] (fiche)
  components/         PokemonCard, DateField, DateFormula, TypeChip, AppHeader, AppFooter
  composables/        usePokemon (données), useDex (Pokédex perso), useSeo, useUi (toast, partage, couleurs)
  assets/scss/        Design system
    abstracts/        tokens (couleurs, espaces, typo…), fonctions et mixins
    base/             variables CSS, reset, typographie, animations
    components/       boutons, champs, badges, carte Pokémon…
    layout/, pages/   en-tête, pied de page, styles propres à chaque page
server/
  api/                /api/pokemon/:id et /api/pokedex
  routes/             sitemap.xml et robots.txt
  data/pokemon.json   Les 1025 Pokémon (noms FR/EN, types, stats, talents, description, évolutions)
shared/               Règles du jeu, types, table des faiblesses, combat (app et serveur)
scripts/              Récupération des données, des images et des aperçus
test/                 Tests Vitest (unit/ : logique, nuxt/ : composants)
e2e/                  Tests Playwright (parcours, SEO, sécurité, accessibilité)
generated/            Images et cris générés (hors dépôt), copiés dans le site au build
docs/AUDIT.md         Audit sécurité, performance, accessibilité et SEO
```

## Fonctionnalités

- Révélation façon « Qui est-ce ? » (silhouette puis Pokémon)
- Shiny chanceux : environ 1 date sur 20 sort en version chromatique (toujours la même pour une date donnée)
- Date miroir (jour = mois, ex. 04/04) : un Pokémon bonus parmi les #1001–1025
- Horoscope Pokémon, taille et poids en « baguettes », faiblesses/résistances, évolutions cliquables, cri
- Duel d'anniversaires entre deux dates (mini-combat au niveau 50)
- Pokédex perso sauvegardé dans le navigateur
- Une fiche par Pokémon (`/pokemon/706-muplodocus`) et la liste complète (`/pokemon`)
- Liens partagés avec image d'aperçu, sans jamais contenir de date de naissance

## Confidentialité

Aucun compte, cookie ni traceur. Le Pokédex reste dans le navigateur, les liens partagés ne contiennent que des
numéros de Pokémon, le site ne fait appel à aucun service tiers et les URL des requêtes ne sont pas journalisées.

Projet de fan non officiel. Pokémon © Nintendo / Game Freak / The Pokémon Company.
