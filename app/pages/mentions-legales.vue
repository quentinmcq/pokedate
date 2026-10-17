<script setup lang="ts">
const { portfolioUrl } = useRuntimeConfig().public

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
        <a href="https://pokeapi.co" target="_blank" rel="noopener">PokeAPI</a>. Pour toute demande concernant un
        contenu, écris à l'éditeur : il sera retiré rapidement si nécessaire.
      </p>
    </section>

    <section aria-labelledby="personal-data">
      <h2 id="personal-data">Données personnelles</h2>
      <ul>
        <li>PokéDate ne demande aucun compte et n'enregistre aucune donnée sur ses serveurs.</li>
        <li>
          Les dates saisies servent uniquement à calculer ton Pokémon. Les liens que tu partages ne contiennent jamais
          ta date de naissance, seulement le numéro du Pokémon.
        </li>
        <li>
          Ton Pokédex est enregistré dans ton navigateur (stockage local) et ne quitte jamais ton appareil. Tu peux
          l'effacer en supprimant les données du site dans ton navigateur.
        </li>
        <li>
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

<style scoped lang="scss">
@use '../assets/scss/abstracts/functions' as *;

.legal {
  max-width: 720px;
  margin: 0 auto;
  padding: space(8) 0 space(4);
  line-height: 1.6;
  color: color('text-muted');

  h1 {
    color: color('text');
    margin-bottom: space(8);
  }

  h2 {
    color: color('text');
    font-size: font-size('xl');
    margin: space(8) 0 space(3);
  }

  p,
  ul {
    margin: 0 0 space(3);
  }

  ul {
    padding-left: space(5);
  }

  li + li {
    margin-top: space(2);
  }

  address {
    font-style: normal;
  }

  a {
    color: color('highlight');
    text-underline-offset: 3px;
  }
}
</style>
