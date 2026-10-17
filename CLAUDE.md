# PokéDate

Le dernier chiffre du jour, du mois et de l'année d'une date donnent le numéro d'un Pokémon (1–1025).
Nuxt 4 rendu côté serveur sur Cloudflare Workers, Bun, SCSS, Nuxt Icon (Lucide), oxlint, oxfmt, Vitest, Playwright.

## Commandes

- `bun run dev` : développement (nécessite `bun run sprites` une première fois)
- `bun run check` : lint, formatage, types, tests unitaires — à lancer avant chaque commit
- `bun run test:e2e` : build + tests Playwright (ordinateur et mobile)
- Déploiement : automatique à chaque push sur `main`, une fois la CI verte (job `deploy` de `ci.yml`).
  `bun run deploy` (manuel) seulement sur demande explicite.

## Conventions

- Noms de fonctions et de variables explicites plutôt que des commentaires. Un commentaire seulement pour
  expliquer un choix non évident, toujours en anglais.
- Commits atomiques au format Conventional Commits, en anglais (`feat(card): …`, `fix(security): …`).
- Aucune mention de Claude dans les commits ni les PR (pas de `Co-Authored-By`, pas de lien de session,
  pas de « Generated with Claude Code »).
- Travail sur une branche + PR, fusion en avance rapide pour garder un historique linéaire.
- Textes de l'interface en français, tutoiement.
- Icônes : `<Icon name="lucide:…" />`, pas d'emoji dans l'interface (seulement dans les textes partagés).
- Actions GitHub épinglées par hash de commit ; Renovate (messages en anglais) gère les mises à jour.
- `bunfig.toml` : Bun et Renovate ignorent les versions publiées depuis moins d'un jour.
- Hooks Lefthook : format + lint au commit, types + tests unitaires au push. Ne pas les contourner.

## Architecture

- `shared/` : types du domaine et logique pure (règle de la date, combat, types), utilisés par l'app et le serveur.
- `server/data/pokemon.json` garde des clés courtes pour rester léger ; `server/utils/pokedex.ts` les traduit
  en noms explicites (`PokemonDetail`). Ne pas exposer les clés courtes ailleurs.
- `generated/` (hors dépôt) : images, cris et aperçus produits par `bun run sprites`, copiés dans le build.
- Design system dans `app/assets/scss/abstracts` : utiliser les fonctions `color()`, `space()`, `radius()`…
  plutôt que des valeurs en dur.
- Composants rangés par domaine (`components/layout`, `pokemon`, `date`, `duel`, `ui`) ; `pathPrefix: false`
  garde le nom du fichier comme nom de composant (`<PokemonCard>`, pas `<PokemonPokemonCard>`).
- Styles : un fichier `.scss` à côté de chaque `.vue` (`PokemonCard.vue` + `PokemonCard.scss`), chargé en
  `<style scoped lang="scss" src="./PokemonCard.scss">`. N'importer que les modules utilisés
  (`abstracts/tokens`, `abstracts/functions`, `abstracts/mixins`). Le global (`app/assets/scss/base`) est
  réservé au reset, à la typographie et aux briques partagées.

## Points de vigilance

- Confidentialité : jamais de date de naissance dans un lien partagé, une URL de résultat de duel ou un journal.
- Vue reste en 3.5.x tant que Nuxt n'accepte pas Vue 3.6 (sinon deux copies de Vue sont installées).
- `siteUrl` (`https://pokedate.fr`) alimente les liens canoniques, le sitemap et l'activation de la mesure
  d'audience. `www.pokedate.fr` et l'adresse `workers.dev` redirigent vers lui (`server/utils/canonicalHost.ts`).
