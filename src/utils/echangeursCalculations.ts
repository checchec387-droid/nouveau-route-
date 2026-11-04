import {
  EchangeurType,
  BrancheVitesseType,
  DispositifSortieType,
  DispositifEntreeType,
  DecelerationResult,
  AccelerationResult,
  DeversEchangeurResult,
  DivergentConvergentResult,
  EntrecroisementResult,
  EchangeurProjectMetadata
} from '../types/echangeurs';

export function calculateDecelerationSortie(params: {
  vitesseAutorouteKmh: 130 | 110 | 90;
  vitesseCibleVrKmh: number;
  decliviteP: number;
  typeSortie?: DispositifSortieType;
}): DecelerationResult {
  const {
    vitesseAutorouteKmh,
    vitesseCibleVrKmh,
    decliviteP,
    typeSortie = 'Sd1_1'
  } = params;

  const vsKmh = vitesseAutorouteKmh >= 110 ? 70 : 60;
  const vrKmh = Math.min(vitesseCibleVrKmh, vsKmh);
  const dd = 1.5;
  const gEffectif = Math.max(0.5, dd + 9.81 * (decliviteP / 100));
  let rawLd = (Math.pow(vsKmh, 2) - Math.pow(vrKmh, 2)) / (2 * 12.96 * (gEffectif / 9.81));
  if (rawLd < 0) rawLd = 0;

  let minForfaitaire = 0;
  if (typeSortie === 'Sd1_1') {
    minForfaitaire = vitesseAutorouteKmh === 130 ? 120 : 90;
  } else if (typeSortie === 'Sd1_2') {
    minForfaitaire = 80;
  } else if (typeSortie === 'Sa1') {
    minForfaitaire = 100;
  }

  const longueurDecelerationLdM = Math.round(Math.max(rawLd, minForfaitaire));
  const biseauSortieM = vitesseAutorouteKmh === 130 ? 150 : vitesseAutorouteKmh === 110 ? 110 : 80;

  const steps = [
    {
      label: 'Vitesse conventionnelle au divergent Vs',
      value: `${vsKmh} km/h`,
      desc: 'Point conventionnel de divergence à 1,00 m de séparation'
    },
    {
      label: 'Vitesse cible en tête de bretelle Vr',
      value: `${vrKmh} km/h`,
      desc: 'Vitesse admissible sur la première courbe en plan'
    },
    {
      label: 'Déclivité longitudinale p',
      value: `${decliviteP > 0 ? '+' : ''}${decliviteP} %`,
      desc: decliviteP < 0 ? 'Pente descendante (allonge le freinage)' : decliviteP > 0 ? 'Rampe montante (aide au freinage)' : 'Profil en palier'
    },
    {
      label: 'Longueur de décélération calculée Ld',
      value: `${longueurDecelerationLdM} m`,
      desc: `Dont biseau de sortie initial : ${biseauSortieM} m (Total dispositif : ${longueurDecelerationLdM + biseauSortieM} m)`
    }
  ];

  return {
    vitesseConventionnelleVsKmh: vsKmh,
    vitesseCibleVrKmh: vrKmh,
    decliviteP,
    longueurDecelerationLdM,
    formule: 'Ld = (Vs² - Vr²) / (2 · 12.96 · γd) avec γd = 1.5 m/s² ± p/100',
    steps
  };
}

export function calculateAccelerationEntree(params: {
  vitesseAutorouteKmh: 130 | 110 | 90;
  vitesseInitialeVrKmh: number;
  decliviteP: number;
  typeEntree?: DispositifEntreeType;
}): AccelerationResult {
  const {
    vitesseAutorouteKmh,
    vitesseInitialeVrKmh,
    decliviteP,
    typeEntree = 'Ei1'
  } = params;

  const veKmh = vitesseAutorouteKmh === 130 ? 90 : vitesseAutorouteKmh === 110 ? 80 : 70;
  const vrKmh = Math.min(vitesseInitialeVrKmh, veKmh - 5);
  const da = 0.8;
  const accelerationNette = Math.max(0.3, da - 9.81 * (decliviteP / 100));
  let rawLa = (Math.pow(veKmh, 2) - Math.pow(vrKmh, 2)) / (2 * 12.96 * (accelerationNette / 9.81));
  if (rawLa < 0) rawLa = 0;

  let minVoieParallele = 200;
  if (vitesseAutorouteKmh === 90) minVoieParallele = 150;
  if (typeEntree === 'Ea1') minVoieParallele = 180;

  const longueurAccelerationLaM = Math.round(Math.max(rawLa, minVoieParallele));
  const biseauInsertionM = 75;

  const steps = [
    {
      label: 'Vitesse de départ Vr (sortie bretelle)',
      value: `${vrKmh} km/h`,
      desc: 'Vitesse géométrique issue de la dernière courbe de raccordement'
    },
    {
      label: 'Vitesse conventionnelle d\'insertion Ve',
      value: `${veKmh} km/h`,
      desc: 'Vitesse requise au point E (1,00 m du bord de voie courante)'
    },
    {
      label: 'Déclivité longitudinale p',
      value: `${decliviteP > 0 ? '+' : ''}${decliviteP} %`,
      desc: decliviteP > 0 ? 'Rampe montante (accélération plus lente, voie allongée)' : decliviteP < 0 ? 'Pente descendante (aide à la prise d\'élan)' : 'Profil en palier'
    },
    {
      label: 'Longueur de voie parallèle calculée La',
      value: `${longueurAccelerationLaM} m`,
      desc: `Hors biseau terminal : ${biseauInsertionM} m (Longueur totale dispositif : ${longueurAccelerationLaM + biseauInsertionM} m)`
    }
  ];

  return {
    vitesseConventionnelleVeKmh: veKmh,
    vitesseInitialeVrKmh: vrKmh,
    decliviteP,
    longueurAccelerationLaM,
    formule: 'La = (Ve² - Vr²) / (2 · 12.96 · γa) avec γa = 0.8 m/s² ± p/100 (min 200m selon Cerema)',
    steps
  };
}

export function calculateGeometrieBretelle(params: {
  vitesseBrancheKmh: BrancheVitesseType;
  radiusM: number;
  nombreVoies?: 1 | 2;
  isVerglasZone?: boolean;
  isReliefDifficile?: boolean;
}): DeversEchangeurResult {
  const {
    vitesseBrancheKmh,
    radiusM,
    nombreVoies = 1,
    isVerglasZone = false,
    isReliefDifficile = false
  } = params;

  let rayonMinimalRmM = 65;
  let deversNormalRdnM = 250;

  switch (vitesseBrancheKmh) {
    case 110:
      rayonMinimalRmM = isReliefDifficile ? 400 : 500;
      deversNormalRdnM = 1000;
      break;
    case 90:
      rayonMinimalRmM = isReliefDifficile ? 240 : 300;
      deversNormalRdnM = 650;
      break;
    case 70:
      rayonMinimalRmM = isReliefDifficile ? 120 : 150;
      deversNormalRdnM = 400;
      break;
    case 50:
    default:
      rayonMinimalRmM = isReliefDifficile ? 50 : 65;
      deversNormalRdnM = 250;
      break;
  }

  const maxDevers = isVerglasZone ? 6.0 : 7.0;
  let calculatedDeversPercent = 2.5;

  if (radiusM <= rayonMinimalRmM) {
    calculatedDeversPercent = maxDevers;
  } else if (radiusM >= deversNormalRdnM) {
    calculatedDeversPercent = 2.5;
  } else {
    const invR = 1 / radiusM;
    const invRm = 1 / rayonMinimalRmM;
    const invRdn = 1 / deversNormalRdnM;
    const ratio = (invR - invRdn) / (invRm - invRdn);
    calculatedDeversPercent = Math.min(maxDevers, Math.max(2.5, 2.5 + (maxDevers - 2.5) * ratio));
  }

  let surlargeurM = 0;
  if (radiusM < 100) {
    surlargeurM = Math.min(2.0, Math.round((50 / radiusM) * 100) / 100);
  }

  const clothoideAMin = Math.round(Math.max(radiusM * 0.35, 30));
  const longueurClothoideMinM = Math.round(Math.max(20, Math.pow(clothoideAMin, 2) / radiusM));
  const largeurChaussée = nombreVoies === 1 ? 5.5 : 7.0;
  const deltaDevers = Math.abs(calculatedDeversPercent - 2.5) / 100;
  const longueurGauchissementM = Math.round(Math.max(25, (largeurChaussée * deltaDevers) / 0.005));

  return {
    vitesseBrancheKmh,
    nombreVoies,
    radiusM,
    deversNormalRdnM,
    rayonMinimalRmM,
    calculatedDeversPercent: Math.round(calculatedDeversPercent * 10) / 10,
    isPlafondVerglas: isVerglasZone,
    longueurClothoideMinM,
    longueurGauchissementM,
    surlargeurM
  };
}

export function calculateDivergentConvergent(params: {
  obliquitePercent: 3 | 4 | 5;
  largeurTplM?: number;
  vitesseAutorouteKmh: 130 | 110 | 90;
}): DivergentConvergentResult {
  const {
    obliquitePercent,
    largeurTplM = 0.375,
    vitesseAutorouteKmh
  } = params;

  const p = obliquitePercent / 100;
  const longueurL1M = Math.round((0.75 - largeurTplM) / p);
  const longueurL2M = Math.round((1.00 - 0.75) / p);
  const longueurLmM = Math.round((1.00 - largeurTplM) / p);
  const longueurMarquageLbM = Math.round(1.5 / p);
  const distanceNonPerturbationNpM = vitesseAutorouteKmh === 130 ? 220 : vitesseAutorouteKmh === 110 ? 170 : 130;

  return {
    obliquitePercent,
    largeurTplM,
    longueurLmM,
    longueurL1M,
    longueurL2M,
    longueurMarquageLbM,
    distanceNonPerturbationNpM
  };
}

export function calculateEntrecroisement(params: {
  distanceReelleZM: number;
  vitesseAutorouteKmh: number;
  traficTransitT?: number;
  traficEntrecroise1?: number;
  traficEntrecroise2?: number;
}): EntrecroisementResult {
  const {
    distanceReelleZM,
    vitesseAutorouteKmh,
    traficTransitT = 3000,
    traficEntrecroise1 = 450,
    traficEntrecroise2 = 350
  } = params;

  const np = vitesseAutorouteKmh >= 120 ? 220 : vitesseAutorouteKmh >= 100 ? 170 : 130;
  let typeAmenagement: 'DIRECT' | 'ENTRECROISEMENT' | 'COLLECTRICE' = 'DIRECT';
  let statutConformite: 'CONFORME' | 'ATTENTION' | 'NON_CONFORME' = 'CONFORME';
  let explication = '';
  const prescriptions: string[] = [];

  const traficTotalEntrecroise = traficEntrecroise1 + traficEntrecroise2;

  if (distanceReelleZM < np) {
    typeAmenagement = 'ENTRECROISEMENT';
    statutConformite = 'NON_CONFORME';
    explication = `La distance Z (${distanceReelleZM} m) est inférieure à la distance minimale de non-perturbation Np (${np} m). Chevauchement critique interdit par le guide Cerema.`;
    prescriptions.push(`Augmenter la distance Z à au moins ${np} m immédiatement.`);
    prescriptions.push('À défaut, créer une voie collectrice séparée physiquement de l\'autoroute.');
  } else if (distanceReelleZM < 500) {
    typeAmenagement = 'ENTRECROISEMENT';
    statutConformite = 'ATTENTION';
    explication = `Distance très courte (${distanceReelleZM} m). Voie Auxiliaire d'Entrecroisement (VAE) obligatoire et continue entre l'entrée et la sortie.`;
    prescriptions.push('Création impérative d\'une Voie Auxiliaire d\'Entrecroisement continue.');
    prescriptions.push('Vérifier que le débit total d\'entrecroisement reste sous le seuil critique (max 1800 uvp/h).');
  } else if (distanceReelleZM < 1000) {
    typeAmenagement = 'ENTRECROISEMENT';
    statutConformite = traficTotalEntrecroise > 1200 ? 'ATTENTION' : 'CONFORME';
    explication = `Section d'entrecroisement standard (${distanceReelleZM} m). Voie d'entrecroisement recommandée pour garantir la fluidité.`;
    if (traficTotalEntrecroise > 1200) {
      prescriptions.push('Fort débit d\'entrecroisement (> 1200 uvp/h) : voie collectrice latérale fortement recommandée.');
    } else {
      prescriptions.push('Voie auxiliaire d\'entrecroisement d\'un seul tenant suffisante.');
    }
  } else {
    typeAmenagement = 'DIRECT';
    statutConformite = 'CONFORME';
    explication = `Distance Z suffisante (${distanceReelleZM} m >= 1000 m). Les manœuvres d'insertion et de sortie sont considérées comme indépendantes.`;
    prescriptions.push('Conception des voies d\'insertion et de décélération de manière autonome.');
    prescriptions.push('Maintenir la signalisation d\'anticipation à 1000 m et 500 m.');
  }

  return {
    distanceReelleZM,
    vitesseAutorouteKmh,
    typeAmenagement,
    statutConformite,
    explication,
    prescriptions
  };
}

export interface EchangeurChoixConseil {
  typeRecommande: 'TROMPETTE' | 'DEMI_TREFLE' | 'LOSANGE_DIAMANT' | 'LUNETTES' | 'BIFURCATION_Y' | 'TREFLE_COMPLET';
  nom: string;
  avantages: string[];
  inconvenients: string[];
  justification: string;
  empriseFonciere: 'Faible' | 'Moyenne' | 'Forte';
  coutOuvrages: 'Faible (1 ouvrage simple)' | 'Moyen (1 ou 2 ouvrages)' | 'Élevé (plusieurs franchissements)';
}

export function orienterChoixEchangeur(params: {
  natureIntersection: 'AUTOROUTE_ROUTE_SECONDAIRE' | 'AUTOROUTE_AUTOROUTE';
  traficTransitAutoroute: number;
  traficEchangeTotal: number;
  contrainteEmprise: 'FAIBLE' | 'MOYENNE' | 'FORTE';
  presencePeage?: boolean;
}): EchangeurChoixConseil {
  const {
    natureIntersection,
    traficEchangeTotal,
    contrainteEmprise,
    presencePeage = false
  } = params;

  if (natureIntersection === 'AUTOROUTE_AUTOROUTE') {
    if (traficEchangeTotal > 3000) {
      return {
        typeRecommande: 'TREFLE_COMPLET',
        nom: 'Nœud Autoroutier avec Voies Collectrices (Trèfle directionnel)',
        avantages: [
          'Séparation totale des flux sans aucun cisaillement ni arrêt',
          'Capacité d\'écoulement maximale à vitesse soutenue (70 à 90 km/h)',
          'Pas de croisement à niveau'
        ],
        inconvenients: [
          'Emprise foncière considérable (boucles de rayon 60 à 100 m)',
          'Nombreux ouvrages d\'art ou viaducs de franchissement'
        ],
        justification: 'Croisement de deux axes majeurs à très fort trafic de transit et d\'échange.',
        empriseFonciere: 'Forte',
        coutOuvrages: 'Élevé (plusieurs franchissements)'
      };
    } else {
      return {
        typeRecommande: 'BIFURCATION_Y',
        nom: 'Bifurcation Autoroutière en Y ou T',
        avantages: [
          'Branches directes à grand rayon (V = 90 ou 110 km/h)',
          'Excellente lisibilité cinématique pour les usagers',
          'Fluidité totale du courant de bifurcation'
        ],
        inconvenients: [
          'Ne permet pas les demi-tours ni les échanges dans tous les quadrants'
        ],
        justification: 'Jonction entre deux autoroutes dont l\'une prend son origine sur l\'autre.',
        empriseFonciere: 'Moyenne',
        coutOuvrages: 'Moyen (1 ou 2 ouvrages)'
      };
    }
  }

  if (presencePeage) {
    return {
      typeRecommande: 'TROMPETTE',
      nom: 'Diffuseur en Trompette',
      avantages: [
        'Point de péage unique regroupant toutes les entrées et sorties',
        'Un seul ouvrage de franchissement supérieur ou inférieur',
        'Aucun cisaillement sur les bretelles à grande vitesse'
      ],
      inconvenients: [
        'Une boucle à rayon réduit (R = 50 à 65 m, V = 50 km/h)',
        'Asymétrie de l\'aménagement'
      ],
      justification: 'Modèle de référence pour autoroute concédée à péage raccordée à une route secondaire.',
      empriseFonciere: 'Moyenne',
      coutOuvrages: 'Faible (1 ouvrage simple)'
    };
  }

  if (contrainteEmprise === 'FORTE') {
    return {
      typeRecommande: 'LOSANGE_DIAMANT',
      nom: 'Diffuseur en Losange (Diamant / DDI)',
      avantages: [
        'Emprise foncière minimale le long du tracé autoroutier',
        'Bretelles droites ou à très grand rayon',
        'Coût de terrassement et d\'ouvrages réduit'
      ],
      inconvenients: [
        'Deux carrefours à feux ou giratoires sur la voie secondaire franchie',
        'Risque de remontée de file sur l\'autoroute si le carrefour secondaire sature'
      ],
      justification: 'Milieu périurbain ou emprise foncière sévèrement restreinte.',
      empriseFonciere: 'Faible',
      coutOuvrages: 'Faible (1 ouvrage simple)'
    };
  }

  if (traficEchangeTotal > 1500) {
    return {
      typeRecommande: 'DEMI_TREFLE',
      nom: 'Diffuseur en Demi-Trèfle (2 ou 4 quadrants)',
      avantages: [
        'Évite les tournes-à-gauche difficiles sur la voie secondaire',
        'Capacité d\'accueil de forts trafics d\'échange',
        'Grande flexibilité d\'implantation topographique'
      ],
      inconvenients: [
        'Présence de boucles à vitesse modérée (50 km/h)',
        'Emprise moyenne à forte dans les quadrants choisis'
      ],
      justification: 'Trafic d\'échange soutenu avec la route secondaire.',
      empriseFonciere: 'Moyenne',
      coutOuvrages: 'Moyen (1 ou 2 ouvrages)'
    };
  }

  return {
    typeRecommande: 'LUNETTES',
    nom: 'Diffuseur en Lunettes (2 Giratoires d\'extrémités)',
    avantages: [
      'Excellente sécurité routière sur les carrefours de raccordement secondaire',
      'Permet tous les mouvements y compris les demi-tours sans feux tricolores',
      'Autorégulation efficace du trafic'
    ],
    inconvenients: [
      'Nécessite deux îlots giratoires de part et d\'autre du pont autoroutier',
      'Ralentissement systématique sur la route secondaire'
    ],
    justification: 'Solution moderne très répandue en milieu interurbain libre de péage.',
    empriseFonciere: 'Moyenne',
    coutOuvrages: 'Faible (1 ouvrage simple)'
  };
}
