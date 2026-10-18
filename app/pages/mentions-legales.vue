<script setup lang="ts">
const { portfolioUrl, cloudflareAnalyticsToken } = useRuntimeConfig().public
const hasAudienceMeasurement = !!cloudflareAnalyticsToken

usePageSeo({
  title: 'Mentions légales',
  description: 'Éditeur, hébergeur, propriété intellectuelle et données personnelles de PokéDate.',
})
</script>

<template>
  <article class="legal">
    <h1>Mentions légales</h1>

    <section aria-labelledby="publisher">
      <h2 id="publisher">Éditeur</h2>
      <p>
        PokéDate est un projet personnel, non commercial, édité par Quentin Macq, à titre non professionnel. Contact :
        <a :href="portfolioUrl" target="_blank" rel="noopener">quentin-macq.dev</a>.
      </p>
    </section>

    <section aria-labelledby="host">
      <h2 id="host">Hébergement</h2>
      <address>
        Cloudflare, Inc.<br />
        101 Townsend St, San Francisco, CA 94107, États-Unis<br />
        +1 (650) 319-8930 · <a href="https://www.cloudflare.com" target="_blank" rel="noopener">cloudflare.com</a>
      </address>
    </section>

    <section aria-labelledby="intellectual-property">
      <h2 id="intellectual-property">Propriété intellectuelle</h2>
      <p>
        Pokémon et les noms, images et sons associés sont des marques et des œuvres de Nintendo, Game Freak et The
        Pokémon Company. PokéDate est un projet de fan, sans lien avec ces sociétés et sans but commercial.
      </p>
      <p>
        Les données et les images proviennent de
        <a href="https://pokeapi.co" target="_blank" rel="noopener">PokeAPI</a>. Les descriptions du Pokédex des Pokémon
        les plus récents (n° 899 à 1025) viennent de
        <a href="https://www.pokepedia.fr" target="_blank" rel="noopener">Poképédia</a>, sous licence
        <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/deed.fr" target="_blank" rel="noopener"
          >CC BY-NC-SA 3.0</a
        >.
      </p>
      <p>Pour toute demande concernant un contenu, écris à l'éditeur : il sera retiré rapidement si nécessaire.</p>
    </section>

    <section aria-labelledby="personal-data">
      <h2 id="personal-data">Données personnelles</h2>
      <ul>
        <li>PokéDate ne demande aucun compte.</li>
        <li>
          Quand tu révèles ton Pokémon à partir d'une date, PokéDate l'ajoute aux derniers tirages : il enregistre ton
          pseudo (ou « Anonyme »), le numéro du Pokémon et l'heure, 5 tirages par jour au plus. Ils sont affichés
          publiquement sur la page des derniers tirages (les 50 plus récents) et supprimés au bout de 7 jours au plus.
          Tu peux retirer un tirage ou désactiver l'ajout automatique depuis la fiche du Pokémon. Ni ta date ni ton
          adresse IP ne sont enregistrées ; l'adresse IP sert seulement, sur le moment, à limiter le nombre de
          publications.
        </li>
        <li>
          Les dates saisies servent uniquement à calculer ton Pokémon. Les liens que tu partages ne contiennent jamais
          ta date de naissance, seulement le numéro du Pokémon.
        </li>
        <li>
          Ton Pokédex est enregistré dans ton navigateur (stockage local) et ne quitte jamais ton appareil. Tu peux
          l'effacer en supprimant les données du site dans ton navigateur.
        </li>
        <li v-if="hasAudienceMeasurement">
          Aucun cookie, aucun traceur publicitaire. Les visites sont comptées par
          <a href="https://www.cloudflare.com/web-analytics/" target="_blank" rel="noopener">Cloudflare Web Analytics</a
          >, qui ne dépose aucun cookie, ne stocke rien sur ton appareil et ne conserve ni ton adresse IP ni les
          paramètres des adresses (donc jamais ta date). Seules des statistiques globales en ressortent : pages vues,
          pays, type d'appareil, site d'origine. Les polices, images et sons sont servis par le site lui-même.
        </li>
        <li v-if="hasAudienceMeasurement">
          PokéDate compte aussi, jour par jour, le nombre total de certaines actions (Pokémon révélés, duels, tournois,
          partages…) et combien de fois chaque Pokémon est tiré, sans rien qui permette de savoir qui les a faites. Pour
          ne compter ni tes visites ni tes actions, ouvre
          <NuxtLink to="/?stats=off" class="text-link">pokedate.fr/?stats=off</NuxtLink> une fois sur chaque appareil.
        </li>
        <li v-else>
          Aucun cookie, aucune mesure d'audience, aucun traceur publicitaire. Les polices, images et sons sont servis
          par le site lui-même, sans appel à un service tiers.
        </li>
        <li>
          L'hébergeur conserve des journaux techniques en cas d'erreur, sans l'adresse complète des pages consultées.
        </li>
      </ul>
    </section>
  </article>
</template>

<style scoped lang="scss" src="./mentions-legales.scss" />
