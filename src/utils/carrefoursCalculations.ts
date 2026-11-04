import {
  CarrefourType,
  RegimePriorite,
  RoutePrincipaleType,
  VisibiliteFranchissementResult,
  TourneAGaucheResult,
  IlotSecondaireResult,
  GiratoireDimensionnementResult,
  CapaciteGiratoireSimplifieeResult,
  ModeleAccidentsResult
} from '../types/carrefour';

export function calculateVisibiliteFranchissement(params: {
  v85Kmh: number;
  regimePriorite: RegimePriorite;
  routePrincipaleType: RoutePrincipaleType;
  hasRampeSup2Percent?: boolean;
  reculObservationM?: number;
}): VisibiliteFranchissementResult {
  const {
    v85Kmh,
    regimePriorite,
    routePrincipaleType,
    hasRampeSup2Percent = false,
    reculObservationM = 4.0
  } = params;

  let baseTempsConseille = regimePriorite === 'STOP' ? 7.0 : 8.0;
  let baseTempsMin = regimePriorite === 'STOP' ? 5.5 : 6.5;

  if (routePrincipaleType === '3_VOIES') {
    baseTempsConseille += 0.8;
    baseTempsMin += 0.6;
  } else if (routePrincipaleType === '2x2_VOIES') {
    baseTempsConseille += 1.5;
    baseTempsMin += 1.0;
  }

  if (hasRampeSup2Percent) {
    baseTempsConseille += 0.7;
    baseTempsMin += 0.5;
  }

  const distanceVisibiliteConseilleeM = Math.round((v85Kmh * baseTempsConseille) / 3.6);
  const distanceVisibiliteMinM = Math.round((v85Kmh * baseTempsMin) / 3.6);
  const g = 9.81;
  const f = 0.38;
  const reactionTime = 1.5;
  const vMs = v85Kmh / 3.6;
  const distanceArretFaceNezM = Math.round((vMs * reactionTime) + (Math.pow(vMs, 2) / (2 * g * f)));

  const explanations: string[] = [
    `Recul du conducteur d'observation d fixé à ${reculObservationM.toFixed(2)} m (normalisé SETRA à 4.00 m, exceptionnellement 2.50 m en site contraint).`,
    'Hauteur d\'œil du conducteur d\'observation : 1.00 m au-dessus de la chaussée secondaire.',
    'Hauteur du véhicule adverse observé : 1.00 m (véhicule léger) pour le franchissement, 0.15 m pour la perception du nez d\'îlot.',
    `Temps de franchissement recommandé : ${baseTempsConseille.toFixed(1)} s (comprenant démarrage et dégagement de la voie adverse pour un gabarit de 16.50 m PL).`,
    `Distance de visibilité recommandée calculée : ${distanceVisibiliteConseilleeM} m pour V85 = ${v85Kmh} km/h.`
  ];

  return {
    v85Kmh,
    regimePriorite,
    routePrincipaleType,
    hasRampeSup2Percent,
    tempsConseilleSec: Number(baseTempsConseille.toFixed(1)),
    tempsMinAbsoluSec: Number(baseTempsMin.toFixed(1)),
    distanceVisibiliteConseilleeM,
    distanceVisibiliteMinM,
    distanceArretFaceNezM,
    reculObservationM,
    hauteurObservationM: 1.0,
    hauteurPointObserveM: 1.0,
    explanations
  };
}

export function calculateTourneAGauche(params: {
  largeurChausséeCouranteM?: number;
  traficTournantGaucheVj?: number;
  isPLSignificatif?: boolean;
  vitesseV85Kmh?: number;
}): TourneAGaucheResult {
  const {
    largeurChausséeCouranteM = 7.0,
    traficTournantGaucheVj = 180,
    isPLSignificatif = false,
    vitesseV85Kmh = 80
  } = params;

  const qHointeTag = Math.max(10, Math.round(traficTournantGaucheVj * 0.12));
  const nombreVehiculesStockageNs = Math.max(2, Math.min(8, Math.ceil(qHointeTag / 25)));
  const pPL = isPLSignificatif ? 0.20 : 0.08;
  const longueurStockageM = Math.max(20, Math.round((7 + 10 * pPL) * nombreVehiculesStockageNs));
  const longueurSiffletM = vitesseV85Kmh >= 90 ? 30 : vitesseV85Kmh >= 70 ? 25 : 20;
  const longueurAlignementDroitM = 15;
  const largeurVoieTagM = 3.00;
  const largeurSeparateurAM = 1.00;
  const largeurTotaleIlotBM = Number((largeurVoieTagM + largeurSeparateurAM).toFixed(2));
  const ratioDeport = vitesseV85Kmh >= 80 ? 20 : 15;
  const longueurDeportM = Math.round(largeurTotaleIlotBM * ratioDeport);
  const longueurTotaleIlotM = longueurDeportM + longueurAlignementDroitM + longueurSiffletM + longueurStockageM;
  const longueurPresignalisationLpM = Math.round(longueurTotaleIlotM / 2);

  const steps = [
    {
      label: 'Voie de stockage (Ls)',
      formula: 'Ls = (7 + 10 · p) · Ns',
      result: `${longueurStockageM} m (${nombreVehiculesStockageNs} véhicules)`,
      desc: `Dimensionnée pour absorber la file d'attente à l'heure de pointe (Q_pointe ≈ ${qHointeTag} v/h).`
    },
    {
      label: 'Sifflet de décélération',
      formula: 'Sifflet d\'entrée = 20 à 30 m',
      result: `${longueurSiffletM} m`,
      desc: 'Zone d\'ouverture progressive pour l\'insertion des véhicules tourne-à-gauche.'
    },
    {
      label: 'Biseau de déport latéral (Ld)',
      formula: `Ld = b · ${ratioDeport} (au 1/${ratioDeport} ème)`,
      result: `${longueurDeportM} m`,
      desc: 'Déviation douce de la trajectoire directe de la voie opposée pour contourner l\'îlot central.'
    },
    {
      label: 'Longueur totale de l\'aménagement',
      formula: 'L_totale = L_déport + L_alignement + L_sifflet + L_stockage',
      result: `${longueurTotaleIlotM} m`,
      desc: 'Emprise totale requise sur l\'axe principal (norme SETRA : 90 m à 170 m).'
    }
  ];

  return {
    largeurChausséeCouranteM,
    traficTournantGaucheVj,
    isPLSignificatif,
    longueurPresignalisationLpM,
    longueurDeportM,
    longueurAlignementDroitM,
    longueurSiffletM,
    longueurStockageM,
    nombreVehiculesStockageNs,
    longueurTotaleIlotM,
    largeurSeparateurAM,
    largeurTotaleIlotBM,
    largeurVoieTagM,
    profilTraversVoieFilanteM: 3.50,
    steps
  };
}

export function calculateGiratoireDimensionnement(params: {
  rayonGiratoireRgM?: number;
  nombreVoiesEntree?: 1 | 2;
  hasTraficPLImportant?: boolean;
}): GiratoireDimensionnementResult {
  const {
    rayonGiratoireRgM = 20,
    nombreVoiesEntree = 1,
    hasTraficPLImportant = true
  } = params;

  const rg = Math.max(12, Math.min(35, rayonGiratoireRgM));
  const largeurAnneauEllAM = nombreVoiesEntree === 2 ? 8.5 : 7.0;
  const surlargeurFranchissableSlfM = rg <= 15 ? 2.5 : rg <= 22 ? 2.0 : 1.5;
  const rayonInterieurRiM = Number(Math.max(3, rg - largeurAnneauEllAM - surlargeurFranchissableSlfM).toFixed(2));
  const rayonEntreeReM = Math.min(15, Math.max(10, Math.round(rg * 0.65)));
  const largeurEntreeEllEM = nombreVoiesEntree === 2 ? 7.0 : 4.0;
  const rayonSortieRsM = Math.max(20, Math.min(35, Math.round(rg * 1.2)));
  const largeurSortieEllSM = 4.5;
  const rayonRaccordementRrM = 4 * rg;
  const deflexionEstimeeM = Number((Math.min(95, Math.max(25, 2.8 * rg - rayonEntreeReM))).toFixed(1));
  const isDeflexionConforme = deflexionEstimeeM <= 100;

  const steps = [
    {
      label: 'Rayon extérieur (Rg)',
      formula: `Rg = ${rg} m (Plage SETRA : 15 à 25 m en interurbain)`,
      result: `${rg} m`,
      desc: 'Bon compromis entre emprise au sol, lisibilité et modération de la vitesse.'
    },
    {
      label: 'Largeur de l\'anneau de circulation (la)',
      formula: 'la = 7.00 m (1 voie) ou 8.50 m (2 voies)',
      result: `${largeurAnneauEllAM} m`,
      desc: 'Permet la circulation fluide des véhicules légers avec marge latérale.'
    },
    {
      label: 'Collerette franchissable pour Poids Lourds (Slf)',
      formula: 'Slf = 1.50 à 2.50 m (pavés ou béton désactivé surélevé de 3 à 5 cm)',
      result: `${surlargeurFranchissableSlfM} m`,
      desc: 'Absorbe le balayage géométrique de la semi-remorque sans élargir l\'anneau des VL.'
    },
    {
      label: 'Rayon d\'entrée (Re) et contrainte de vitesse',
      formula: 'Re = 10 à 15 m (Re <= Rg)',
      result: `${rayonEntreeReM} m`,
      desc: 'Force les usagers entrants à ralentir à moins de 35-40 km/h avant d\'aborder le carrefour.'
    },
    {
      label: 'Contrôle de la déflexion géométrique',
      formula: 'R_déflexion <= 100 m (recommandé 30 à 50 m)',
      result: `${deflexionEstimeeM} m (${isDeflexionConforme ? 'CONFORME' : 'NON CONFORME'})`,
      desc: 'Empêche la traversée en ligne droite du carrefour sans ralentissement.'
    }
  ];

  return {
    rayonGiratoireRgM: rg,
    largeurAnneauEllAM,
    surlargeurFranchissableSlfM,
    rayonInterieurRiM,
    rayonEntreeReM,
    largeurEntreeEllEM,
    rayonSortieRsM,
    largeurSortieEllSM,
    rayonRaccordementRrM,
    deversAnneauPercent: 2.0,
    deflexionEstimeeM,
    isDeflexionConforme,
    steps
  };
}

export function calculateCapaciteGiratoire(params: {
  traficEntrantQe?: number;
  traficSortantQs?: number;
  traficTournantQt?: number;
  largeurAnneauEllA?: number;
  largeurEntreeEllE?: number;
}): CapaciteGiratoireSimplifieeResult {
  const {
    traficEntrantQe = 450,
    traficSortantQs = 350,
    traficTournantQt = 300,
    largeurAnneauEllA = 7.0,
    largeurEntreeEllE = 4.0
  } = params;

  const traficSortantEquivalentQsPrime = Math.round(0.2 * traficSortantQs);
  const traficGenantQg = traficTournantQt + traficSortantEquivalentQsPrime;
  const c0 = Math.round(1350 + 120 * (largeurEntreeEllE - 3.5));
  const k = 0.0011;
  const capaciteEntreeC = Math.max(100, Math.round(c0 * Math.exp(-k * traficGenantQg)));
  const reserveCapaciteUvp = capaciteEntreeC - traficEntrantQe;
  const reserveCapacitePercent = Math.round((reserveCapaciteUvp / capaciteEntreeC) * 100);

  let evaluationNiveau: 'CONFORTABLE' | 'SATISFAISANT' | 'RISQUE_CONGESTION' | 'SATURE';
  if (reserveCapacitePercent >= 30) {
    evaluationNiveau = 'CONFORTABLE';
  } else if (reserveCapacitePercent >= 15) {
    evaluationNiveau = 'SATISFAISANT';
  } else if (reserveCapacitePercent >= 0) {
    evaluationNiveau = 'RISQUE_CONGESTION';
  } else {
    evaluationNiveau = 'SATURE';
  }

  const explications = [
    `Trafic circulant sur l'anneau devant l'entrée (trafic gênant) : Qg = ${traficGenantQg} uvp/h.`,
    `Capacité théorique maximale d'insertion : C = ${capaciteEntreeC} uvp/h.`,
    `Débit demandé : Qe = ${traficEntrantQe} uvp/h.`,
    `Réserve de capacité disponible : ${reserveCapaciteUvp} uvp/h (${reserveCapacitePercent}%).`
  ];

  return {
    traficEntrantQe,
    traficSortantQs,
    traficTournantQt,
    largeurIlotSeparateurEllI: 2.5,
    largeurAnneauEllA,
    largeurEntreeEllE,
    traficSortantEquivalentQsPrime,
    traficGenantQg,
    capaciteEntreeC,
    reserveCapaciteUvp,
    reserveCapacitePercent,
    evaluationNiveau,
    explications
  };
}

export function calculateModeleAccidents(params: {
  traficPrincipalTp: number;
  traficSecondaireTs: number;
  nombreBranches?: 3 | 4;
  periodeAnnees?: number;
}): ModeleAccidentsResult {
  const {
    traficPrincipalTp,
    traficSecondaireTs,
    nombreBranches = 4,
    periodeAnnees = 5
  } = params;

  const coeffOrdinaire = nombreBranches === 4 ? 0.00045 : 0.00028;
  const accidentsOrdinaireParAn = coeffOrdinaire * Math.pow(traficPrincipalTp * Math.max(100, traficSecondaireTs), 0.48);
  const accidentsOrdinaireN = Number((accidentsOrdinaireParAn * periodeAnnees).toFixed(1));

  const coeffGiratoire = 0.0035;
  const accidentsGiratoireParAn = coeffGiratoire * Math.pow((traficPrincipalTp + traficSecondaireTs), 0.52);
  const accidentsGiratoireN = Number((accidentsGiratoireParAn * periodeAnnees).toFixed(1));

  const gainSecuriteAccidents = Number(Math.max(0, accidentsOrdinaireN - accidentsGiratoireN).toFixed(1));
  const gainSecuritePercent = accidentsOrdinaireN > 0
    ? Math.round((gainSecuriteAccidents / accidentsOrdinaireN) * 100)
    : 0;

  const tuesOrdinaire = Number((accidentsOrdinaireN * 0.08).toFixed(2));
  const tuesGiratoire = Number((accidentsGiratoireN * 0.015).toFixed(2));
  const blessesGravesOrdinaire = Number((accidentsOrdinaireN * 0.28).toFixed(1));
  const blessesGravesGiratoire = Number((accidentsGiratoireN * 0.09).toFixed(1));

  return {
    periodeAnneesJ: periodeAnnees,
    traficPrincipalTp,
    traficSecondaireTs,
    nombreBranches,
    isRoute2x2: false,
    tauxMoyenAnneeFc: Number((accidentsOrdinaireParAn).toFixed(2)),
    accidentsOrdinaireN,
    accidentsGiratoireN,
    gainSecuriteAccidents,
    gainSecuritePercent,
    tuesOrdinaire,
    tuesGiratoire,
    blessesGravesOrdinaire,
    blessesGravesGiratoire
  };
}

export function orienterChoixCarrefour(params: {
  tmjaPrincipal: number;
  tmjaSecondaire: number;
  v85Kmh: number;
  pourcentageTourneAGauche?: number;
  isPointAccidentogene?: boolean;
}): {
  typeRecommande: CarrefourType;
  nomCarrefour: string;
  justification: string;
  avantages: string[];
  vigilances: string[];
} {
  const {
    tmjaPrincipal,
    tmjaSecondaire,
    v85Kmh,
    pourcentageTourneAGauche = 8,
    isPointAccidentogene = false
  } = params;

  if (isPointAccidentogene || tmjaSecondaire > 1500 || (tmjaPrincipal > 5000 && tmjaSecondaire > 800)) {
    return {
      typeRecommande: 'GIRATOIRE',
      nomCarrefour: 'Carrefour à Sens Giratoire (Recommandé)',
      justification: `Le trafic sur la branche secondaire (${tmjaSecondaire} v/j) ou le niveau d'accidentologie justifie un carrefour giratoire. C'est l'aménagement le plus sécuritaire en milieu interurbain, supprimant les points de cisaillement frontal et réduisant de ~75% les accidents graves.`,
      avantages: [
        'Suppression totale des mouvements de cisaillement à angle droit',
        'Auto-régulation de la vitesse à l\'approche (déflexion)',
        'Excellente lisibilité et insertion aisée de la voie secondaire',
        'Facilité de demi-tour pour les véhicules'
      ],
      vigilances: [
        'Emprise au sol plus importante (diamètre extérieur 30 à 50 m)',
        'Perte de priorité pour l\'axe principal (ralentissement systématique)',
        'Nécessité d\'une collerette franchissable pour convois et semi-remorques'
      ]
    };
  }

  if (pourcentageTourneAGauche >= 5 || (tmjaPrincipal > 3000 && tmjaSecondaire >= 300)) {
    return {
      typeRecommande: 'PLAN_ORDINAIRE_TE',
      nomCarrefour: 'Carrefour Plan en T avec Voie de Tourne-à-Gauche (TAG) et Îlot Séparateur',
      justification: `L'axe principal concentre un flux significatif (${tmjaPrincipal} v/j) avec une proportion notable de tourne-à-gauche. La création d'une voie centrale de décélération et stockage avec îlot séparateur sécurise les manœuvres sans pénaliser la circulation filante de l'axe prioritaire.`,
      avantages: [
        'Maintien de la vitesse et de la fluidité sur l\'axe principal',
        'Protection des véhicules en attente de tourner à gauche dans une poche dédiée',
        'Moindre emprise foncière qu\'un giratoire',
        'Coût d\'investissement modéré'
      ],
      vigilances: [
        'Exige une visibilité parfaite sur les deux branches de l\'axe principal',
        'Risque résiduel de collision par l\'arrière si le sifflet de décélération est trop court',
        'Interdit le dépassement sur l\'axe principal au droit de l\'îlot'
      ]
    };
  }

  return {
    typeRecommande: 'PLAN_ORDINAIRE_TE',
    nomCarrefour: 'Carrefour Plan Ordinaire avec Stop ou Cédez-le-Passage',
    justification: `Le trafic sur la voie secondaire est très modeste (${tmjaSecondaire} v/j). Un aménagement plan sobre avec dégagement du triangle de visibilité et signalisation Stop / Cédez-le-passage est suffisant, sous réserve d'un contrôle rigoureux des masques visuels.`,
    avantages: [
      'Emprise au sol minimale et coût très réduit',
      'Priorité absolue conservée sur l\'axe principal',
      'Travaux rapides'
    ],
    vigilances: [
      'Obligation absolue de dégager le triangle de visibilité d\'observation (d = 4.00 m)',
      'À proscrire si le carrefour se situe en courbe ou en sommet de dos d\'âne',
      'Évolution à surveiller si le trafic secondaire augmente'
    ]
  };
}
