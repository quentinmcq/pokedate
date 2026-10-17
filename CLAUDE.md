# PokéDate

Le dernier chiffre du jour, du mois et de l'année d'une date donnent le numéro d'un Pokémon (1–1025).
Nuxt 4 rendu côté serveur sur Cloudflare Workers, Bun, SCSS, oxlint, oxfmt, Vitest, Playwright.

## Commandes

- `bun run dev` : développement (nécessite `bun run sprites` une première fois)
- `bun run check` : lint, formatage, types, tests unitaires — à lancer avant chaque commit
- `bun run test:e2e` : build + tests Playwright (ordinateur et mobile)
- `bun run deploy` : uniquement sur demande explicite, il met le site public à jour

## Conventions

- Pas de commentaires dans le code : des noms de fonctions et de variables explicites à la place.
- Commits atomiques au format Conventional Commits, en français (`feat(ui): …`, `fix(securite): …`).
- Aucune mention de Claude dans les commits ni les PR (pas de `Co-Authored-By`, pas de lien de session,
  pas de « Generated with Claude Code »).
- Travail sur une branche + PR, fusion en avance rapide pour garder un historique linéaire.
- Textes de l'interface en français, tutoiement.

## Architecture

- `shared/` : types du domaine et logique pure (règle de la date, combat, types), utilisés par l'app et le serveur.
- `server/data/pokemon.json` garde des clés courtes pour rester léger ; `server/utils/pokedex.ts` les traduit
  en noms explicites (`PokemonDetail`). Ne pas exposer les clés courtes ailleurs.
- `generated/` (hors dépôt) : images, cris et aperçus produits par `bun run sprites`, copiés dans le build.
- Design system dans `app/assets/scss/abstracts` : utiliser les fonctions `color()`, `space()`, `radius()`…
  plutôt que des valeurs en dur.

## Points de vigilance

- Confidentialité : jamais de date de naissance dans un lien partagé, une URL de résultat de duel ou un journal.
- Vue reste en 3.5.x tant que Nuxt n'accepte pas Vue 3.6 (sinon deux copies de Vue sont installées).
- `siteUrl` (`NUXT_PUBLIC_SITE_URL`) alimente les liens canoniques et le sitemap : à changer avec le domaine.
