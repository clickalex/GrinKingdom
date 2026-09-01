// GrinKingdom — the 8 kingdoms of life metadata.
// Each kingdom gets its own landing page, accent color and a teaser list of species.

export const KINGDOMS = [
  {
    id: 'viruses',
    name: 'Viruses',
    emoji: '🦠',
    color: '#F43F8E',
    tagline: 'Code-breakers at the edge of life',
    blurb:
      'Not quite alive, not quite not — viruses are packages of genetic code that hijack living cells to make copies of themselves. They outnumber every other life form on Earth.',
    members: ['SARS-CoV-2', 'Influenza A', 'Bacteriophage T4', 'HIV', 'Tobacco mosaic virus'],
  },
  {
    id: 'archaea',
    name: 'Archaea',
    emoji: '🌋',
    color: '#F59E0B',
    tagline: 'The ancient survivors',
    blurb:
      'Some of the oldest life on the planet, archaea thrive where almost nothing else can — boiling vents, salt flats, acid lakes and the guts of cows.',
    members: ['Halobacterium', 'Methanobrevibacter', 'Pyrolobus fumarii', 'Thermococcus'],
  },
  {
    id: 'bacteria',
    name: 'Bacteria',
    emoji: '🧫',
    color: '#14B8A6',
    tagline: 'The invisible majority',
    blurb:
      'Trillions live in and on you right now. Bacteria are single-celled powerhouses that shape soil, oceans, digestion — and occasionally cause disease.',
    members: ['E. coli', 'Streptococcus', 'Cyanobacteria', 'Lactobacillus', 'Deinococcus radiodurans'],
  },
  {
    id: 'protists',
    name: 'Protists',
    emoji: '🫧',
    color: '#FACC15',
    tagline: 'The everything-else eukaryotes',
    blurb:
      'A wonderfully messy group of single-celled (and some multi-celled) organisms — from pond-water amoebas to the malaria parasite and giant kelp forests.',
    members: ['Amoeba', 'Paramecium', 'Euglena', 'Plasmodium', 'Giant kelp', 'Slime mold'],
  },
  {
    id: 'fungi',
    name: 'Fungi',
    emoji: '🍄',
    color: '#8B5CF6',
    tagline: "Nature's recyclers",
    blurb:
      'Neither plant nor animal, fungi are the great decomposers and networkers. They gave us bread, beer, penicillin — and the largest living organism on Earth.',
    members: ['Button mushroom', 'Yeast', 'Penicillium', 'Fly agaric', 'Cordyceps', 'Truffle'],
  },
  {
    id: 'plants',
    name: 'Plants',
    emoji: '🌱',
    color: '#22C55E',
    tagline: 'The solar-powered makers',
    blurb:
      'Plants turn sunlight, water and air into food for nearly every other living thing. From moss to giant sequoias, they make the oxygen we breathe.',
    members: ['Oak', 'Sunflower', 'Venus flytrap', 'Giant sequoia', 'Bamboo', 'Cacao'],
  },
  {
    id: 'animals',
    name: 'Animals',
    emoji: '🐘',
    color: '#F97316',
    tagline: 'The movers & shakers',
    blurb:
      'From sponges to blue whales, animals are the kingdom that eats, moves and explores. Over 1.5 million species described — and counting.',
    members: ['Tiger', 'Blue whale', 'Monarch butterfly', 'Octopus', 'Bald eagle', 'Great white shark'],
  },
  {
    id: 'humans',
    name: 'Humans',
    emoji: '🧬',
    color: '#3B82F6',
    tagline: 'The storytellers',
    blurb:
      'Homo sapiens — one species among millions, yet the only one that builds encyclopedias of all the others. Our closest cousins: the Neanderthals.',
    members: ['Homo sapiens', 'Homo neanderthalensis'],
  },
]

export const KINGDOM_MAP = Object.fromEntries(KINGDOMS.map((k) => [k.id, k]))
