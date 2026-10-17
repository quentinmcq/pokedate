# PokéDate

Entre une date → le dernier chiffre du **jour**, du **mois** et de l'**année** donnent le numéro du Pokémon.
Ex. 17/10/2026 → 7 · 0 · 6 → **#706 Muplodocus**. Si les trois chiffres sont 0 (ex. 10/10/2020) → #1000.

Site 100 % statique (HTML/CSS/JS, aucune dépendance, aucun build).

## Contenu

- `public/index.html`, `styles.css`, `app.js` : l'app
- `public/data/pokemon.json` : les 1025 Pokémon (noms FR/EN, types, stats, talents, description, évolutions), ~370 Ko (~110 Ko compressé)
- `scripts/fetch-pokemon.mjs` : régénère le JSON depuis PokeAPI (`node scripts/fetch-pokemon.mjs public/data/pokemon.json`)
- Les images et les cris sont chargés depuis le dépôt GitHub de PokeAPI

## Fonctionnalités

- Révélation façon « Qui est-ce ? » (silhouette puis Pokémon)
- Shiny chanceux : environ 1 date sur 20 sort en version chromatique (toujours la même pour une date donnée)
- Date miroir (jour = mois, ex. 04/04) : un Pokémon bonus parmi les #1001–1025
- Horoscope Pokémon, taille et poids en « baguettes », faiblesses/résistances, évolutions cliquables, cri
- Duel d'anniversaires entre deux dates (mini-combat au niveau 50)
- Pokédex perso sauvegardé dans le navigateur
- Liens partageables : `?date=1995-03-12` ou `?a=1995-03-12&b=1998-07-25&na=Moi&nb=Toi`

## Tester en local

```bash
python3 -m http.server 8787 -d public
```

## Déployer sur Cloudflare

```bash
npx wrangler deploy
```

Ça publie `public/` sur `pokedate.<ton-compte>.workers.dev`. Pour un sous-domaine de ton site
(ex. `pokedate.mondomaine.fr`), ajoute dans `wrangler.jsonc` :

```jsonc
"routes": [{ "pattern": "pokedate.mondomaine.fr", "custom_domain": true }]
```
