export interface FaqItem {
  question: string
  answer: string
}

export const HOME_FAQ: FaqItem[] = [
  {
    question: 'Comment PokéDate trouve mon Pokémon ?',
    answer:
      "On prend le dernier chiffre du jour, du mois et de l'année de ta date, et on les met bout à bout. Le 17/10/2026 donne 7, 0 et 6 : c'est le Pokémon n° 706, Muplodocus. Si les trois chiffres sont 0, tu tombes sur le n° 1000.",
  },
  {
    question: 'Quel Pokémon suis-je selon ma date de naissance ?',
    answer:
      "Entre ta date d'anniversaire dans le formulaire en haut de la page : ton Pokémon s'affiche avec ses types, ses statistiques, ses faiblesses et ses évolutions. Tes amis nés le même jour que toi, à quelques années près, peuvent tomber sur un autre Pokémon.",
  },
  {
    question: "C'est quoi un Pokémon shiny ?",
    answer:
      "C'est une version aux couleurs rares. Environ une date sur vingt donne un Pokémon shiny, et c'est toujours la même pour une date donnée : à toi de voir si la tienne en fait partie.",
  },
  {
    question: 'Comment trouver les Pokémon n° 1001 à 1025 ?',
    answer:
      'Ils ne sortent pas avec la règle habituelle. Il faut une « date miroir », où le jour et le mois sont identiques (01/01, 02/02… 12/12) : un de ces Pokémon rares apparaît alors en bonus.',
  },
  {
    question: 'Mes données sont-elles enregistrées ?',
    answer:
      "Il n'y a ni compte, ni cookie, ni traceur. Ton Pokédex est enregistré uniquement dans ton navigateur, et les liens que tu partages ne contiennent jamais ta date de naissance. Seule exception, si tu le décides : publier un tirage enregistre ton pseudo, le Pokémon et l'heure, visibles par tous pendant 7 jours au plus.",
  },
]
