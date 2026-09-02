// GrinKingdom seed rows — microbes part B: protists, bacteria, archaea & viruses.
// New groups referenced here (bordetella, archaeoglobus) are defined in groups.js.

export const MICROBE_B_ROWS = [
  /* protists & algae */
  ['amoeba', 'Brain-eating amoeba', 'Naegleria fowleri', '🧠', 'The rare amoeba that follows nerve cells into the brain — almost always fatal.', 'Not evaluated'],
  ['ciliate', 'Didinium', 'Didinium nasutum', '🦠', 'The barrel-shaped hunter that exists almost entirely to eat Paramecium.', 'Not evaluated'],
  ['ciliate', 'Tetrahymena', 'Tetrahymena thermophila', '🦠', 'The lab workhorse with seven different sexes.', 'Not evaluated'],
  ['kinetoplastid', 'Trypanosoma cruzi', 'Trypanosoma cruzi', '❤️', 'The kissing-bug parasite behind Chagas heart disease.', 'Not evaluated'],
  ['dinoflagellate', 'Karenia brevis', 'Karenia brevis', '🌊', 'The red tide flagellate that kills fish and chokes coasts.', 'Not evaluated'],
  ['dinoflagellate', 'Alexandrium catenella', 'Alexandrium catenella', '🐚', 'The chain-former whose toxin loads shellfish with paralytic poison.', 'Not evaluated'],
  ['brown-alga', 'Wakame', 'Undaria pinnatifida', '🍜', 'The kelp relative of miso soup — now invading foreign coasts.', 'Not evaluated'],
  ['brown-alga', 'Oarweed', 'Laminaria digitata', '🌊', 'The fingered kelp of low-tide forests, once burnt for iodine.', 'Not evaluated'],
  ['brown-alga-kelp', 'Kombu', 'Saccharina japonica', '🍜', 'The dashi kelp that underpins Japanese cooking.', 'Not evaluated'],
  ['red-alga', 'Nori', 'Pyropia yezoensis', '🍣', 'The paper-thin red alga wrapped around 8 billion sushi rolls a year.', 'Not evaluated'],
  ['green-alga', 'Chlorella', 'Chlorella vulgaris', '🟢', 'The single-celled superfood candidate of the 1950s space race.', 'Not evaluated'],
  ['water-mold-sapro', 'Phytophthora cinnamomi', 'Phytophthora cinnamomi', '🌳', 'The “biological bulldozer” killing jarrah forests and heathlands.', 'Not evaluated'],

  /* bacteria */
  ['enteric', 'Serratia marcescens', 'Serratia marcescens', '🍞', 'The red bacterium behind “bleeding bread” miracles.', 'Not evaluated'],
  ['vibrio', 'Vibrio parahaemolyticus', 'Vibrio parahaemolyticus', '🍣', 'The raw-oyster bacterium behind most seafood poisoning.', 'Not evaluated'],
  ['bacillus', 'Bacillus cereus', 'Bacillus cereus', '🍚', 'The “fried rice syndrome” spore-former that survives reheating.', 'Not evaluated'],
  ['clostridium', 'Clostridium perfringens', 'Clostridium perfringens', '🩸', 'The gas-gangrene bacterium — the fastest-dividing cell known.', 'Not evaluated'],
  ['strep', 'Streptococcus pyogenes', 'Streptococcus pyogenes', '😷', 'The strep throat and scarlet fever classic.', 'Not evaluated'],
  ['cyano-filament', 'Oscillatoria', 'Oscillatoria princeps', '🟦', 'The gliding blue-green filaments that “shimmer” across pond floors.', 'Not evaluated'],
  ['bordetella', 'Bordetella pertussis', 'Bordetella pertussis', '💨', 'The whooping cough bacterium that turns coughs into months of whoops.', 'Not evaluated'],

  /* archaea */
  ['halophile', 'Haloarcula marismortui', 'Haloarcula marismortui', '🧂', 'The square archaeon of the Dead Sea, with two genomes to prove it.', 'Not evaluated'],
  ['methanogen-thermo', 'Methanothermobacter thermautotrophicus', 'Methanothermobacter thermautotrophicus', '♨️', 'The hot-spring methanogen discovered in sewage sludge heat.', 'Not evaluated'],
  ['methanogen-rod', 'Methanosaeta concilii', 'Methanosaeta concilii', '🔥', 'The acetate specialist that finishes biogas digesters\u2019 work.', 'Not evaluated'],
  ['pyrococcus', 'Pyrococcus horikoshii', 'Pyrococcus horikoshii', '🌋', 'The 100 °C vent archaeon dragged from the Okinawa Trough.', 'Not evaluated'],
  ['archaeoglobus', 'Archaeoglobus fulgidus', 'Archaeoglobus fulgidus', '🛢️', 'The oilfield archaeon that makes oil “sour” with its sulfur waste.', 'Not evaluated'],

  /* viruses */
  ['coronavirus', 'SARS-CoV-1', 'Severe acute respiratory syndrome coronavirus 1', '🫁', 'The 2002 epidemic coronavirus that burned out in eight months.', 'Not evaluated'],
  ['coronavirus', 'Human coronavirus OC43', 'Human coronavirus OC43', '🤧', 'The common-cold coronavirus that jumped from cattle around 1890.', 'Not evaluated'],
  ['flavivirus', 'Japanese encephalitis virus', 'Orthoflavivirus japonicum', '🦟', 'The rice-paddy virus that is Asia\u2019s main cause of viral encephalitis.', 'Not evaluated'],
  ['flavivirus', 'Tick-borne encephalitis virus', 'Orthoflavivirus encephalitidis', '🕷️', 'The forest virus lying in wait in tick saliva.', 'Not evaluated'],
  ['flavivirus', 'Usutu virus', 'Orthoflavivirus usutuense', '🐦', 'The African virus quietly killing Europe\u2019s blackbirds.', 'Not evaluated'],
  ['paramyxovirus', 'Canine distemper virus', 'Canine morbillivirus', '🐕', 'The virus that wipes through lions, seals and puppies alike.', 'Not evaluated'],
  ['rhabdovirus', 'Bovine ephemeral fever virus', 'Bovine ephemeral fever virus', '🐄', 'The three-day fever virus that lays cattle low — briefly.', 'Not evaluated'],
  ['flavivirus', 'Omsk haemorrhagic fever virus', 'Orthoflavivirus omskense', '🧤', 'The muskrat-trapper’s fever of the Siberian taiga.', 'Not evaluated'],
  ['bunyavirus', 'La Crosse virus', 'La Crosse orthobunyavirus', '🦟', 'The treehole-mosquito virus behind children’s summer encephalitis.', 'Not evaluated'],
  ['phage-rna', 'Phage Qβ', 'Escherichia virus Qbeta', '🧬', 'The tiny RNA phage behind a lifetime of evolution experiments.', 'Not evaluated'],
  ['phage-sipho', 'Phage T5', 'Escherichia virus T5', '🧬', 'The syringe-phage with a two-stage DNA injection.', 'Not evaluated'],
  ['giant-virus', 'Faustovirus', 'Faustovirus E9', '👹', 'The giant virus named for a deal with the devil — it infects amoebas.', 'Not evaluated'],
  ['giant-virus', 'Mollivirus sibericum', 'Mollivirus sibericum', '🧊', 'The 30,000-year-old giant virus revived from Siberian permafrost.', 'Not evaluated'],
  ['plant-virus', 'Banana bunchy top virus', 'Banana bunchy top virus', '🍌', 'The aphid-borne virus that stunts banana trees into bunches of sticks.', 'Not evaluated'],
  ['plant-virus', 'African cassava mosaic virus', 'African cassava mosaic virus', '🥔', 'The whitefly-borne virus threatening a staple for 800 million people.', 'Not evaluated'],
  ['plant-virus2', 'Rice dwarf virus', 'Rice dwarf virus', '🌾', 'The leafhopper virus that turns rice into pale dwarfs.', 'Not evaluated'],
  ['plant-virus3', 'Grapevine fanleaf virus', 'Grapevine fanleaf virus', '🍇', 'The nematode-spread virus ageing vineyards before their time.', 'Not evaluated'],
  ['parvovirus', 'Mink enteritis virus', 'Mink enteritis virus', '🦡', 'The mink-farm parvovirus that leak-proofed vaccines for pets.', 'Not evaluated'],
  ['picornavirus', 'Encephalomyocarditis virus', 'Encephalomyocarditis virus', '🐭', 'The rodent virus that can stop a pig\u2019s heart.', 'Not evaluated'],
  ['reovirus', 'Epizootic haemorrhagic disease virus', 'Epizootic hemorrhagic disease virus', '🦌', 'The midge-borne orbivirus that fells white-tailed deer each autumn.', 'Not evaluated'],
  ['poxvirus', 'Camelpox virus', 'Camelpox virus', '🐪', 'The camel-only cousin of smallpox.', 'Not evaluated'],
  ['phage-myo', 'Phage T4', 'Escherichia virus T4', '🧬', 'The classic laboratory phage with a contractile tail.', 'Not evaluated'],
]
