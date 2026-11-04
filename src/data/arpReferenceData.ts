import { RegulatoryRuleReference } from '../types/arp';

export const ARP_RULES_REGISTRY: RegulatoryRuleReference[] = [
  {
    id: 'TAB-10',
    title: 'Valeurs minimales des rayons du tracé en plan',
    document: 'Guide ARP - Cerema',
    edition: 'Août 2022',
    chapter: 'Chapitre 4 (Tracé en plan et profil en long)',
    section: '§ 1.1',
    table: 'Tableau 10',
    page: 'p. 57',
    formula: 'Rm = 240 m (R1), 125 m (R2) ; Rdn = 400 m ; 110 km/h: Rm=400 m, Rdn=650 m',
    status: 'CONFIRME_OFFICIEL',
    description: 'Fixe le rayon minimal absolu Rm (associé au dévers maximal 7%) et le rayon minimal au dévers normal Rdn (2,5%). Mesurés au droit de l\'axe géométrique de la voie.'
  },
  {
    id: 'TAB-11',
    title: 'Longueurs des raccordements progressifs (clothoïdes)',
    document: 'Guide ARP - Cerema',
    edition: 'Août 2022',
    chapter: 'Chapitre 4 (Tracé en plan et profil en long)',
    section: '§ 1.3',
    table: 'Tableau 11',
    page: 'p. 58',
    formula: '2 voies : L = max(2·l·|Δd| ; 6 · R^0.4) | 3 voies & 2x2 voies : L = max(2·l·|Δd| ; 12 · R^0.4)',
    status: 'CONFIRME_OFFICIEL',
    description: 'Les courbes de rayon R < 1,5 · Rdn sont introduites obligatoirement par un raccordement progressif. Le terme 2·l·|Δd| correspond à la longueur minimale de gauchissement pour le basculement du dévers.'
  },
  {
    id: 'TAB-12',
    title: 'Valeurs limites du profil en long',
    document: 'Guide ARP - Cerema',
    edition: 'Août 2022',
    chapter: 'Chapitre 4 (Tracé en plan et profil en long)',
    section: '§ 2.1',
    table: 'Tableau 12',
    page: 'p. 60',
    formula: 'R1: P_max=6%, R_saillant=3100 m, R_rentrant=2100 m | R2: P_max=7%, R_saillant=1300 m, R_rentrant=1300 m | 110 km/h: 5200 m / 3000 m',
    status: 'CONFIRME_OFFICIEL',
    description: 'Valeurs limites mesurées au droit de l\'axe géométrique. Une déclivité > 6% n\'est à utiliser qu\'en cas de stricte nécessité.'
  },
  {
    id: 'DEVERS-LOI',
    title: 'Loi de variation continue du dévers',
    document: 'Guide ARP - Cerema',
    edition: 'Août 2022',
    chapter: 'Chapitre 3 (§ 4.2 p.45) & Chapitre 6 (§ 2.4 p.91)',
    section: '§ 4.2 & § 2.4',
    table: 'Tableau 8 & Texte p.45/91',
    page: 'p. 45, 91',
    formula: 'd = 0.025 + (0.07 - 0.025) · [(1/R - 1/Rdn) / (1/Rm - 1/Rdn)]',
    status: 'CONFIRME_OFFICIEL',
    description: 'Pente transversale de la chaussée orientée vers l\'intérieur du virage pour R < Rdn, calculée linéairement selon 1/R entre 2,5% (à Rdn) et 7% (à Rm). Pour R >= Rdn, chaussée en toit à 2,5% vers l\'extérieur.'
  },
  {
    id: 'DEVERS-RD-PENTE',
    title: 'Dévers et pente résultante en relief difficile',
    document: 'Guide ARP - Cerema',
    edition: 'Août 2022',
    chapter: 'Chapitre 6 (Routes en relief difficile ou site contraint)',
    section: '§ 2.4 & § 3.2',
    table: 'Texte p.91-92',
    page: 'p. 91-92',
    formula: 'P_résultante = d + p <= 10% (limite absolue du raccordement)',
    status: 'CONFIRME_OFFICIEL',
    description: 'Possibilité de réduire le dévers de base (sans descendre sous 2,5%) en cas de forte pente longitudinale, neige/verglas fréquent ou pour limiter la longueur de variation. Pente résultante maximale <= 10%.'
  },
  {
    id: 'CLOTH-RD-REDUC',
    title: 'Réduction de clothoïde en relief difficile',
    document: 'Guide ARP - Cerema',
    edition: 'Août 2022',
    chapter: 'Chapitre 6 (Routes en relief difficile ou site contraint)',
    section: '§ 3.2',
    table: 'Texte p.92',
    page: 'p. 92',
    formula: 'L_réduite >= Lg / 2 = l · |Δd| (avec P_résultante <= 10%)',
    status: 'CONFIRME_OFFICIEL',
    description: 'Le basculement de dévers peut s\'effectuer sur au moins la moitié de la longueur de gauchissement Lg/2, et commencer avant la clothoïde voire dans l\'alignement droit si la clothoïde est supprimée.'
  },
  {
    id: 'TAB-14',
    title: 'Réduction complémentaire de la largeur roulable en relief difficile',
    document: 'Guide ARP - Cerema',
    edition: 'Août 2022',
    chapter: 'Chapitre 6 (Routes en relief difficile ou site contraint)',
    section: '§ 2.1',
    table: 'Tableau 14',
    page: 'p. 90',
    formula: 'Élevé : Chaussée 6,50 m, BDD 1,75 m | Intermédiaire : 6,00 m / 1,50 m | Modéré : 5,50 m / 1,50 m (ou 1,25 m / 1,00 m si TMJA < 2000 et PL < 100)',
    status: 'CONFIRME_OFFICIEL',
    description: 'Profils en travers minimaux admissibles en relief difficile sur route neuve. Dissymétrie de BDD possible au profit du sens montant pour favoriser les cycles.'
  },
  {
    id: 'TAB-15',
    title: 'Pentes maximales admissibles sur route neuve en relief difficile',
    document: 'Guide ARP - Cerema',
    edition: 'Août 2022',
    chapter: 'Chapitre 6 (Routes en relief difficile ou site contraint)',
    section: '§ 3.1',
    table: 'Tableau 15',
    page: 'p. 92',
    formula: 'P_max = 8% (neige/verglas en hiver) ; 10% (routes non soumises)',
    status: 'CONFIRME_OFFICIEL',
    description: 'Déconseillé de dépasser ces valeurs de pente maintenues sur de longues sections. Pour les lacets, limiter la pente du profil en long à <= 5% sur le bord intérieur.'
  },
  {
    id: 'TAB-06',
    title: 'Surlargeur de voie en courbe',
    document: 'Guide ARP - Cerema',
    edition: 'Août 2022',
    chapter: 'Chapitre 3 (§ 2.3 p.41) & Chapitre 6 (§ 2.2 p.90)',
    section: '§ 2.3 & § 2.2',
    table: 'Tableau 6',
    page: 'p. 41, 90-91',
    formula: 'R < 200 m : voie = 3,50 + 50/R (cas général) | Relief difficile : 3,50 + 25/R (50 <= R <= 200 m), 3,50 + 30/R (R < 50 m)',
    status: 'CONFIRME_OFFICIEL',
    description: 'Surlargeur appliquée sur chaque bord de voie intérieur à la courbe. Épures de giration requises pour R < 125 m. Longueur d\'introduction >= 20 m hors partie circulaire.'
  },
  {
    id: 'LACET-RADII',
    title: 'Rayons internes minimaux en lacet',
    document: 'Guide ARP - Cerema',
    edition: 'Août 2022',
    chapter: 'Chapitre 6 (Routes en relief difficile)',
    section: '§ 2.3',
    table: 'Tableau de référence p.91',
    page: 'p. 91',
    formula: 'Chaussée 8 m : R_int_min = 6,50 m | Voie 6 m : Semi-remorque 11 m, Autocar 13,50 m | Voie 5 m : Semi-remorque 17 m, Autocar 21 m',
    status: 'CONFIRME_OFFICIEL',
    description: 'Permet la giration des poids lourds de gabarit réglementaire.'
  },
  {
    id: 'COORD-PLAN-LONG',
    title: 'Coordination du tracé en plan et du profil en long',
    document: 'Guide ARP - Cerema',
    edition: 'Août 2022',
    chapter: 'Chapitre 4 (Tracé en plan et profil en long)',
    section: '§ 3',
    page: 'p. 61',
    formula: 'Rv > 6 · Rh (si Rh < 1 500 m)',
    status: 'CONFIRME_OFFICIEL',
    description: 'Faire coïncider courbes en plan et paraboles en long. Éviter impérativement le début d\'un virage en crête (point haut).'
  },
  {
    id: 'ENCHAIN-PROGRESS',
    title: 'Progressivité des rayons successifs',
    document: 'Guide ARP - Cerema',
    edition: 'Août 2022',
    chapter: 'Chapitre 4 (Tracé en plan)',
    section: '§ 1.2',
    page: 'p. 57-58',
    formula: '0,67 < R / R\' < 1,50 (si au moins une courbe < 1,5 · Rdn)',
    status: 'CONFIRME_OFFICIEL',
    description: 'Assure une transition de courbure physiologique pour le conducteur évitant les freinages brutaux d\'urgence.'
  },
  {
    id: 'VISIB-DEPASSEMENT',
    title: 'Offre de visibilité de dépassement',
    document: 'Guide ARP - Cerema',
    edition: 'Août 2022',
    chapter: 'Chapitre 2 (Visibilité)',
    section: '§ 10',
    page: 'p. 28',
    formula: 'Distance de visibilité >= 500 m sur au moins 25% du linéaire',
    status: 'CONFIRME_OFFICIEL',
    description: 'Sur route bidirectionnelle à 2 voies. Permet le dépassement sûr des véhicules lents sans créer de pelotons de congestion.'
  }
];

export const ARP_GLOSSARY = [
  {
    term: 'Accotement',
    definition: 'Partie latérale de la plate-forme bordant la chaussée. Il comprend une bande dérasée de droite (BDD) et une berme.'
  },
  {
    term: 'Bande dérasée de droite (BDD)',
    definition: 'Bande contiguë à la chaussée à droite du sens de circulation considéré, stabilisée ou revêtue, dénuée de tout obstacle. Elle inclut la surlargeur structurelle S (0,25 m) et le marquage de rive.'
  },
  {
    term: 'Bande médiane équipée (BME)',
    definition: 'Partie roulable séparant les sens de circulation, offrant un espace de récupération (largeur recommandée 1,00 m, mini 0,70 m) et équipée de marquages/hachures pour dissuader les franchissements involontaires.'
  },
  {
    term: 'Clothoïde (Raccordement progressif)',
    definition: 'Courbe géométrique à courbure linéaire (A² = R · L) assurant la transition continue de courbure et le basculement progressif du dévers entre alignement et arc de cercle.'
  },
  {
    term: 'Dévers',
    definition: 'Pente transversale d\'un versant de chaussée orientée vers l\'intérieur du virage en courbe (pour compenser l\'accélération centrifuge) ou en toit vers l\'extérieur en alignement.'
  },
  {
    term: 'Longueur de gauchissement (Lg)',
    definition: 'Longueur nécessaire pour opérer la rotation transversale de la chaussée sans distorsion géométrique excessive : Lg = 2 · l · |Δd|.'
  },
  {
    term: 'Pente résultante',
    definition: 'Pente combinée sur la chaussée combinant la pente transversale (dévers) et la déclivité longitudinale du profil en long : ne doit jamais excéder 10% en raccordement progressif.'
  },
  {
    term: 'Rayon minimal au dévers normal (Rdn)',
    definition: 'Rayon en plan en deçà duquel la chaussée est déversée vers l\'intérieur et à partir duquel le dévers est normal (2,5% en toit vers l\'extérieur).'
  },
  {
    term: 'Rayon minimal absolu (Rm)',
    definition: 'Rayon minimal du tracé en plan associé au dévers maximal (7% dans le cas normal). R1: 240 m, R2: 125 m, Artère 110: 400 m.'
  },
  {
    term: 'Terre-plein central (TPC)',
    definition: 'Bande séparant physiquement deux chaussées sur une même plate-forme, comprenant deux bandes dérasées de gauche (BDG) et une bande médiane (BM).'
  },
  {
    term: 'V85',
    definition: 'Vitesse conventionnelle en dessous de laquelle roulent 85% des véhicules motorisés en circulation fluide.'
  },
  {
    term: 'Zone de sécurité',
    definition: 'Bande latérale dénuée de tout obstacle agressif (4 m en aménagement sur existant, 7 m en neuf, 8,50 m à 110 km/h).'
  }
];

export const ROAD_TYPES_DATA = [
  {
    type: '4.1',
    name: 'Route ordinaire',
    chaussees: '1 chaussée bidirectionnelle',
    voies: '2 voies (hors créneaux)',
    vma: '80 km/h (possibilité 90 km/h selon décision CDSR / département)',
    domainTrafic: 'À partir de 1 500 véh./j jusqu\'à ~10 000 véh./j',
    carrefours: 'Plans ordinaires (avec ou sans tourne-à-gauche) ou giratoires',
    modesActifs: 'Circulation piétons en accotement, cycles en BDD revêtue ou aménagement dédié hors plateforme si fort trafic'
  },
  {
    type: '4.2',
    name: 'Route à trois voies affectées',
    chaussees: '1 chaussée',
    voies: '3 voies affectées (2+1 alternatif)',
    vma: '80 km/h sens 1 voie / 90 km/h sens 2 voies',
    domainTrafic: 'Adapté ~15 000 véh./j',
    carrefours: 'Plans ordinaires avec tourne-à-gauche obligatoire ou giratoires',
    modesActifs: 'Traitement des cycles hors largeur roulable à privilégier'
  },
  {
    type: '3.1',
    name: 'Artère interurbaine',
    chaussees: '2 chaussées séparées par TPC avec barrière',
    voies: '2x2 voies',
    vma: '90 ou 110 km/h',
    domainTrafic: '15 000 à 20 000 véh./j',
    carrefours: 'Giratoires ou demi-carrefours dénivelés/plans',
    modesActifs: 'Circulation cycles et piétons obligatoirement hors largeur roulable'
  },
  {
    type: '3.2',
    name: 'Route à 2 x 1 voie à carrefours plans',
    chaussees: '2 chaussées séparées par TPC avec barrière',
    voies: '1 voie par sens',
    vma: '90 km/h (110 km/h en créneau)',
    domainTrafic: '10 000 à 15 000 véh./j',
    carrefours: 'Giratoires exclusivement',
    modesActifs: 'Traitement obligatoirement hors largeur roulable'
  }
];
