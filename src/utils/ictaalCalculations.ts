import {
  IctaalCategory,
  IctaalCrossSection,
  IctaalDeversResult,
  IctaalClothoideResult,
  IctaalProfilTraversResult,
  IctaalInterchangeResult,
  IctaalProfilLongResult,
  IctaalVsvlResult,
  IctaalAuditAlert,
  IctaalCalculationStep
} from '../types/ictaal';

export function getIctaalPlanLimits(category: IctaalCategory) {
  switch (category) {
    case 'L1':
      return {
        vma: 130,
        Rm: 600,
        Rdn: 1000,
        thresholdClothoide: 1500,
        safetyZone: 10.0,
        insertionLi: 470,
        raccordementLr: 250,
        label: 'Catégorie L1 (Plaine / vallonné - VMA 130 km/h)'
      };
    case 'L2':
      return {
        vma: 110,
        Rm: 400,
        Rdn: 650,
        thresholdClothoide: 975,
        safetyZone: 8.5,
        insertionLi: 310,
        raccordementLr: 200,
        label: 'Catégorie L2 (Relief plus difficile - VMA 110 km/h)'
      };
    case 'RELIEF_DIFFICILE':
      return {
        vma: 90,
        Rm: 240,
        Rdn: 650,
        thresholdClothoide: 975,
        safetyZone: 7.0,
        insertionLi: 310,
        raccordementLr: 200,
        label: 'Section en Relief Difficile (Montagneux - VMA 90 km/h)'
      };
  }
}

export function calculateIctaalDevers(params: {
  category: IctaalCategory;
  radiusR: number;
  isWinterSnowFrostZone?: boolean;
}): IctaalDeversResult {
  const { category, radiusR, isWinterSnowFrostZone = false } = params;
  const limits = getIctaalPlanLimits(category);
  const Rm = limits.Rm;
  const Rdn = limits.Rdn;
  const thresholdClothoide = limits.thresholdClothoide;

  const steps: IctaalCalculationStep[] = [];
  let calculatedDevers = 2.5;
  let isNormalDevers = true;
  const maxDevers = isWinterSnowFrostZone ? 5.0 : 7.0;

  steps.push({
    label: '1. Identification de la catégorie autoroutière',
    formula: 'Catégorie => Limites Rm et Rdn',
    substitution: `${limits.label} => Rm = ${Rm} m, Rdn = ${Rdn} m`,
    result: `Seuil dévers normal Rdn = ${Rdn} m`,
    explanation: 'Défini selon le Tableau 3-1 du Chapitre 3.1.1 de l\'ICTAAL 2015/2021.'
  });

  const isRadiusValid = radiusR >= Rm;
  if (radiusR >= Rdn) {
    calculatedDevers = 2.5;
    isNormalDevers = true;
    steps.push({
      label: '2. Pente transversale en alignement ou grand rayon',
      formula: 'R >= Rdn => d = 2.5%',
      substitution: `R = ${radiusR} m >= ${Rdn} m`,
      result: 'd = 2.50 %',
      explanation: 'En alignement droit et en courbe de rayon supérieur ou égal à Rdn, la pente transversale normale est de 2,5 % vers l\'extérieur (Art. 4.6.1).'
    });
  } else {
    isNormalDevers = false;
    const invR = 1 / radiusR;
    const invRdn = 1 / Rdn;
    const invRm = 1 / Rm;
    const rawDevers = 2.5 + (7.0 - 2.5) * ((invR - invRdn) / (invRm - invRdn));
    calculatedDevers = Math.min(maxDevers, Math.max(2.5, Math.round(rawDevers * 100) / 100));

    steps.push({
      label: '2. Dévers en courbe déversée vers l\'intérieur',
      formula: 'd(R) = 2.5 + 4.5 * [ (1/R - 1/Rdn) / (1/Rm - 1/Rdn) ]',
      substitution: `d(${radiusR}) = 2.5 + 4.5 * [ (1/${radiusR} - 1/${Rdn}) / (1/${Rm} - 1/${Rdn}) ]`,
      result: `d = ${calculatedDevers.toFixed(2)} %`,
      explanation: isWinterSnowFrostZone && rawDevers > 5.0
        ? 'La pente se calcule linéairement selon 1/R (Art. 4.6.2). En zone à verglas fréquent, le dévers est plafonné à 5,0 %.'
        : 'La pente transversale d\'une chaussée se calcule linéairement selon 1/R entre 2,5 % pour Rdn et 7 % pour Rm (Art. 4.6.2).'
    });
  }

  const bauInterieureSlope = calculatedDevers;
  let bauExterieureSlope = 2.5;
  let hasContrePente = false;

  if (calculatedDevers > 4.0) {
    bauExterieureSlope = -1.5;
    hasContrePente = true;
    steps.push({
      label: '3. Bande d\'Arrêt d\'Urgence extérieure (BAU)',
      formula: 'Si d > 4.0% => Pente BAU ext = contre-pente de 1.5% de sens opposé',
      substitution: `d = ${calculatedDevers.toFixed(2)}% > 4.0% => BAU extérieure = -1.50%`,
      result: 'Contre-pente 1.50 % opposée',
      explanation: 'Selon l\'Art. 4.6.2 : au-delà d\'un dévers de 4 %, la BAU extérieure est de sens opposé au dévers et égale à 1,5 % pour éviter l\'accumulation d\'eau et faciliter la récupération.'
    });
  } else {
    bauExterieureSlope = 2.5;
    steps.push({
      label: '3. Bande d\'Arrêt d\'Urgence extérieure (BAU)',
      formula: 'Si d <= 4.0% => Pente BAU ext = pente d\'alignement (2.5%)',
      substitution: `d = ${calculatedDevers.toFixed(2)}% <= 4.0% => BAU extérieure = 2.50%`,
      result: 'Pente normale 2.50 %',
      explanation: 'Selon l\'Art. 4.6.2 : la pente de la BAU extérieure reste identique à l\'alignement droit tant que le dévers ne dépasse pas 4 %.'
    });
  }

  const isClothoideRequired = radiusR < thresholdClothoide;

  return {
    category,
    radiusR,
    Rm,
    Rdn,
    thresholdClothoide,
    calculatedDevers,
    isRadiusValid,
    isClothoideRequired,
    isNormalDevers,
    bauInterieureSlope,
    bauExterieureSlope,
    hasContrePente,
    minDrainageSlope: 0.5,
    steps,
    articleRef: 'ICTAAL 2015/2021 - Chapitre 3.1.1 (p.16) & Chapitre 4.6 (p.23-24)'
  };
}

export function calculateIctaalClothoide(params: {
  category: IctaalCategory;
  radiusR: number;
  deltaDevers: number;
  isRamp?: boolean;
}): IctaalClothoideResult {
  const { category, radiusR, deltaDevers, isRamp = false } = params;
  const absDeltaD = Math.abs(deltaDevers);
  const steps: IctaalCalculationStep[] = [];
  let lclMin = 0;
  let formulaApplied = '';
  let longueurGauchissement = 0;

  if (!isRamp) {
    const term1 = 14 * absDeltaD;
    const term2 = radiusR / 9;
    lclMin = Math.max(term1, term2);
    longueurGauchissement = 14 * absDeltaD;
    formulaApplied = 'Lcl >= max( 14 * |Δd| , R / 9 )';
    steps.push({
      label: '1. Critère de gauchissement dynamique autoroutier',
      formula: 'L_gauchissement = 14 * |Δd|',
      substitution: `14 * ${absDeltaD.toFixed(2)} %`,
      result: `${term1.toFixed(2)} m`,
      explanation: 'Longueur minimale assurant une rotation confortable du dévers sur chaussée autoroutière à 2 voies ou plus (Art. 3.1.3).'
    });
    steps.push({
      label: '2. Critère optique et d\'introduction de la courbure',
      formula: 'L_optique = R / 9',
      substitution: `${radiusR} / 9`,
      result: `${term2.toFixed(2)} m`,
      explanation: 'Condition de courbure garantissant une bonne lisibilité de la trajectoire pour le conducteur à grande vitesse (Art. 3.1.3).'
    });
    if (category === 'RELIEF_DIFFICILE') {
      const reducedL = 8.4 * absDeltaD;
      steps.push({
        label: '3. Adaptation Relief Difficile autoroutier (Art. 8.2.3)',
        formula: 'L_rd_min = 8.4 * |Δd|',
        substitution: `8.4 * ${absDeltaD.toFixed(2)} %`,
        result: `${reducedL.toFixed(2)} m`,
        explanation: 'En relief particulièrement difficile, le raccordement progressif peut être raccourci jusqu\'à 8,4 |Δd| si nécessaire (Chapitre 8.2.3).'
      });
    }
  } else {
    const term1 = 7 * absDeltaD;
    const term2 = 6 * Math.pow(radiusR, 0.4);
    lclMin = Math.max(term1, term2);
    longueurGauchissement = 7 * absDeltaD;
    formulaApplied = 'Lcl >= max( 7 * |Δd| , 6 * R^0.4 )';
    steps.push({
      label: '1. Critère de gauchissement sur bretelle à 1 voie',
      formula: 'L_gauch = 7 * |Δd|',
      substitution: `7 * ${absDeltaD.toFixed(2)} %`,
      result: `${term1.toFixed(2)} m`,
      explanation: 'Pour bretelles ou branches à une voie, la variation de dévers s\'effectue sur 7 |Δd| (Art. 5.2.2c & d).'
    });
    steps.push({
      label: '2. Critère géométrique sur bretelle',
      formula: 'L_geom = 6 * R^0.4',
      substitution: `6 * (${radiusR})^0.4`,
      result: `${term2.toFixed(2)} m`,
      explanation: 'Formule réglementaire pour bretelle d\'échangeur à 1 voie (Art. 5.2.2c).'
    });
  }

  lclMin = Math.round(lclMin * 10) / 10;
  const parameterA = Math.round(Math.sqrt(radiusR * lclMin) * 10) / 10;
  steps.push({
    label: 'Conclusion : Longueur retenue et Paramètre A',
    formula: 'A = √(R * Lcl)',
    substitution: `√(${radiusR} * ${lclMin})`,
    result: `Lcl = ${lclMin} m (A = ${parameterA})`,
    explanation: 'Il s\'agit d\'une longueur minimale. L\'ICTAAL préconise de ne pas recourir à des longueurs excessives afin de ne pas fausser l\'appréciation de la courbure.'
  });

  return {
    radiusR,
    deltaDevers,
    isRamp,
    lclMin,
    parameterA,
    longueurGauchissement,
    formulaApplied,
    steps,
    articleRef: isRamp
      ? 'ICTAAL 2015/2021 - Chapitre 5.2.2.c (p.27)'
      : 'ICTAAL 2015/2021 - Chapitre 3.1.3 (p.16) & Chapitre 8.2.3 (p.37)'
  };
}

export function calculateIctaalProfilTravers(params: {
  category: IctaalCategory;
  crossSection: IctaalCrossSection;
  heavyVehiclesDailyPL?: number;
  bandeMedianeWidthM?: number;
  bermeWidthM?: number;
}): IctaalProfilTraversResult {
  const {
    category,
    crossSection,
    heavyVehiclesDailyPL = 1500,
    bandeMedianeWidthM = 3.0,
    bermeWidthM = 1.0
  } = params;

  const limits = getIctaalPlanLimits(category);
  const steps: IctaalCalculationStep[] = [];
  let numLanesPerDir = 2;
  let isModerateTraffic = false;

  if (crossSection === '2x3') numLanesPerDir = 3;
  else if (crossSection === '2x4') numLanesPerDir = 4;
  else if (crossSection === 'MODERE_2x2') {
    numLanesPerDir = 2;
    isModerateTraffic = true;
  }

  const laneWidthM = 3.50;
  const chausseeWidthM = numLanesPerDir * laneWidthM;
  const bdgWidthM = isModerateTraffic ? 0.75 : 1.00;
  let bauWidthM = 2.50;
  if (!isModerateTraffic) {
    if (heavyVehiclesDailyPL > 2000) {
      bauWidthM = 3.00;
    }
  } else {
    bauWidthM = 2.00;
  }

  const tpcTotalWidthM = bdgWidthM * 2 + bandeMedianeWidthM;
  const largeurRoulableSensM = bdgWidthM + chausseeWidthM + bauWidthM;
  const platformeTotalWidthM = 2 * (bermeWidthM + largeurRoulableSensM) + bandeMedianeWidthM;
  const safetyZoneWidthM = limits.safetyZone;

  steps.push({
    label: '1. Voies de circulation (Art. 4.1.1)',
    formula: 'Largeur = N_voies * 3.50 m',
    substitution: `${numLanesPerDir} voies * 3.50 m`,
    result: `${chausseeWidthM.toFixed(2)} m par sens`,
    explanation: 'Chaque chaussée comporte de 2 à 4 voies larges de 3,50 m en section courante.'
  });

  steps.push({
    label: '2. Bande d\'Arrêt d\'Urgence BAU (Art. 4.1.3b)',
    formula: 'PL > 2000 v/j => BAU = 3.00 m, sinon BAU = 2.50 m',
    substitution: `Trafic PL = ${heavyVehiclesDailyPL} PL/j ${heavyVehiclesDailyPL > 2000 ? '> 2000' : '<= 2000'}`,
    result: `BAU = ${bauWidthM.toFixed(2)} m`,
    explanation: isModerateTraffic
      ? 'Pour une autoroute à trafic modéré (< 10 000 v/j), la BAU est remplacée par une BDD de 2,00 m (revêtue sur 1 m) (Art. 4.2).'
      : heavyVehiclesDailyPL > 2000
        ? 'Trafic PL lourd excédant 2 000 v/j : largeur de BAU portée à 3,00 m.'
        : 'Trafic PL usuel : largeur standard de BAU de 2,50 m.'
  });

  steps.push({
    label: '3. Bande Dérasée de Gauche BDG & TPC (Art. 4.1.2)',
    formula: 'BDG = 1.00 m | TPC = 2 * BDG + Bande médiane',
    substitution: `2 * ${bdgWidthM.toFixed(2)} m + ${bandeMedianeWidthM.toFixed(2)} m`,
    result: `TPC total = ${tpcTotalWidthM.toFixed(2)} m`,
    explanation: 'La BDG assure le dégagement visuel et le respect des règles de visibilité en courbe à gauche.'
  });

  steps.push({
    label: '4. Zone de sécurité latérale (Art. 4.1.3a)',
    formula: 'Catégorie L1 => 10.0 m | L2 => 8.5 m | RD => 7.0 m',
    substitution: `${limits.label}`,
    result: `${safetyZoneWidthM.toFixed(2)} m`,
    explanation: 'Zone latérale devant être exempte de tout dispositif agressif non isolé (arbre, poteau, merlon raide).'
  });

  return {
    category,
    crossSection,
    numLanesPerDir,
    laneWidthM,
    chausseeWidthM,
    bdgWidthM,
    bauWidthM,
    bermeWidthM,
    bandeMedianeWidthM,
    tpcTotalWidthM,
    safetyZoneWidthM,
    largeurRoulableSensM,
    platformeTotalWidthM,
    isModerateTraffic,
    steps,
    articleRef: 'ICTAAL 2015/2021 - Chapitre 4.1 & 4.2 (p.19-21)'
  };
}

export function calculateIctaalInterchange(params: {
  type: 'DECELERATION' | 'ACCELERATION' | 'BRETELLE_COURBE';
  category: IctaalCategory;
  slopePercent: number;
  targetSpeedKmh: number;
  radiusCurveM?: number;
}): IctaalInterchangeResult {
  const { type, category, slopePercent, targetSpeedKmh, radiusCurveM } = params;
  const p = slopePercent / 100;
  const steps: IctaalCalculationStep[] = [];
  let lengthCalculatedM = 0;
  let surlargeurM: number | undefined = undefined;

  if (type === 'DECELERATION') {
    const Vs_ms = 70 / 3.6;
    const Vr_ms = targetSpeedKmh / 3.6;
    const denom = 2 * (1.5 + 10 * p);
    const safeDenom = denom <= 0.2 ? 0.2 : denom;
    const num = Math.pow(Vs_ms, 2) - Math.pow(Vr_ms, 2);
    lengthCalculatedM = Math.max(0, Math.round((num / safeDenom) * 10) / 10);

    steps.push({
      label: 'Zone de décélération de sortie autoroutière (Ld)',
      formula: 'Ld = (Vs² - Vr²) / [ 2 * (1.5 + 10 * p) ]',
      substitution: `( (${(70/3.6).toFixed(2)})² - (${Vr_ms.toFixed(2)})² ) / [ 2 * (1.5 + 10 * (${p})) ]`,
      result: `Ld = ${lengthCalculatedM} m`,
      explanation: 'Permet de passer de la vitesse conventionnelle de 70 km/h au point S.1,00 m à la vitesse de sécurité Vr de la première courbe, avec décélération de 1,5 m/s² (Art. 5.2.2e).'
    });

    steps.push({
      label: 'Biseau de déboîtement contigu (Sd 1)',
      formula: 'Longueur biseau = 150 m (ou 90 m si 1 seule voie)',
      substitution: 'Sortie standard autoroutière',
      result: '150 m',
      explanation: 'Longueur du biseau de sortie contigu jusqu\'au point S.1,00 m (Art. 5.3.1 p.30).'
    });
  } else if (type === 'ACCELERATION') {
    const Ve_ms = 55 / 3.6;
    const Vr_ms = targetSpeedKmh / 3.6;
    const denom = 2 * (1 - 10 * p);
    const safeDenom = denom <= 0.2 ? 0.2 : denom;
    const num = Math.pow(Ve_ms, 2) - Math.pow(Vr_ms, 2);
    lengthCalculatedM = Math.max(0, Math.round((num / safeDenom) * 10) / 10);

    steps.push({
      label: 'Zone d\'accélération d\'entrée autoroutière (La)',
      formula: 'La = (Ve² - Vr²) / [ 2 * (1 - 10 * p) ]',
      substitution: `( (${Ve_ms.toFixed(2)})² - (${Vr_ms.toFixed(2)})² ) / [ 2 * (1 - 10 * (${p})) ]`,
      result: `La = ${lengthCalculatedM} m`,
      explanation: 'Permet d\'atteindre la vitesse conventionnelle de 55 km/h au point E.1,00 m depuis la fin de la courbe d\'entrée avec accélération de 1 m/s² (Art. 5.2.2e).'
    });

    steps.push({
      label: 'Dispositif d\'entrée en insertion (Ei 1)',
      formula: 'Section de manœuvre 200 m + Biseau de rabattement 75 m',
      substitution: 'Section contiguë à 3.50 m',
      result: 'Total = 275 m',
      explanation: 'Constitué d\'une section de manœuvre de 200 m à partir du point E.1,00 m et d\'un biseau de 75 m (Art. 5.3.2 p.30).'
    });
  } else if (type === 'BRETELLE_COURBE' && radiusCurveM) {
    if (radiusCurveM < 100) {
      surlargeurM = Math.round((50 / radiusCurveM) * 100) / 100;
      steps.push({
        label: 'Surlargeur en courbe de bretelle d\'échangeur',
        formula: 'S = 50 / R par voie (pour R < 100 m)',
        substitution: `50 / ${radiusCurveM}`,
        result: `+${surlargeurM.toFixed(2)} m par voie`,
        explanation: 'Dans une courbe de rayon inférieur à 100 m, une surlargeur de 50/R est introduite à l\'intérieur de la courbe linéairement le long de la clothoïde (Art. 5.2.4b).'
      });
    } else {
      surlargeurM = 0;
      steps.push({
        label: 'Surlargeur en courbe de bretelle',
        formula: 'R >= 100 m => Pas de surlargeur nécessaire',
        substitution: `R = ${radiusCurveM} m >= 100 m`,
        result: '0.00 m',
        explanation: 'Le gabarit de 3,50 m par voie est suffisant pour les rayons supérieurs ou égaux à 100 m.'
      });
    }
    lengthCalculatedM = radiusCurveM;
  }

  return {
    type,
    category,
    speedConventionnelleKmh: type === 'DECELERATION' ? 70 : 55,
    speedTargetKmh: targetSpeedKmh,
    slopeLongitudinalP: slopePercent,
    radiusCurveM,
    lengthCalculatedM,
    biseauLengthM: type === 'DECELERATION' ? 150 : 275,
    surlargeurM,
    steps,
    articleRef: 'ICTAAL 2015/2021 - Chapitre 5.2 & 5.3 (p.27-31)'
  };
}

export function calculateIctaalProfilLong(params: {
  category: IctaalCategory;
  slopePercent: number;
  verticalRadiusM: number;
  isSaillant: boolean;
}): IctaalProfilLongResult {
  const { category, slopePercent, verticalRadiusM, isSaillant } = params;
  const absSlope = Math.abs(slopePercent);
  let slopeMaxPercent = 5.0;
  let radiusSaillantMin = 9200;
  let radiusRentrantMin = 4200;

  if (category === 'L2') {
    slopeMaxPercent = 6.0;
    radiusSaillantMin = 5200;
    radiusRentrantMin = 3000;
  } else if (category === 'RELIEF_DIFFICILE') {
    slopeMaxPercent = 6.0;
    radiusSaillantMin = 2700;
    radiusRentrantMin = 1900;
  }

  const isSlopeCompliant = absSlope <= slopeMaxPercent;
  const targetMinRadius = isSaillant ? radiusSaillantMin : radiusRentrantMin;
  const isRadiusCompliant = verticalRadiusM >= targetMinRadius;

  const steps: IctaalCalculationStep[] = [
    {
      label: '1. Vérification de la déclivité maximale (Tableau 3-2)',
      formula: `Pente max = ${slopeMaxPercent} %`,
      substitution: `Déclivité du projet = ${absSlope.toFixed(2)} %`,
      result: isSlopeCompliant ? 'CONFORME' : 'NON CONFORME (DÉCLIVITÉ EXCESSIVE)',
      explanation: `Pour la ${category}, la déclivité maximale admissible est de ${slopeMaxPercent} % (Art. 3.2.1).`
    },
    {
      label: '2. Vérification du rayon vertical de raccordement',
      formula: `R_min (${isSaillant ? 'Angle saillant' : 'Angle rentrant'}) = ${targetMinRadius} m`,
      substitution: `Rayon du projet = ${verticalRadiusM} m`,
      result: isRadiusCompliant ? 'CONFORME' : 'NON CONFORME (RAYON TROP FAIBLE)',
      explanation: isSaillant
        ? 'Condition essentielle pour garantir la distance de visibilité d\'arrêt à la vitesse maximale autorisée (Art. 3.2.1).'
        : 'Condition assurant le confort dynamique et la visibilité nocturne sous éclairage des phares.'
    }
  ];

  return {
    category,
    slopeMaxPercent,
    radiusSaillantMin,
    radiusRentrantMin,
    actualSlopePercent: slopePercent,
    actualRadiusM: verticalRadiusM,
    isSlopeCompliant,
    isRadiusCompliant,
    steps,
    articleRef: 'ICTAAL 2015/2021 - Chapitre 3.2.1 (p.17) & Chapitre 8.2.4 (p.38)'
  };
}

export function calculateIctaalVsvl(params: {
  slopePercent: number;
  slopeLengthM: number;
  isRampe: boolean;
  speedPlEstimatedKmh?: number;
  deniveleeDeltaM?: number;
}): IctaalVsvlResult {
  const {
    slopePercent,
    slopeLengthM,
    isRampe,
    speedPlEstimatedKmh = 45,
    deniveleeDeltaM = (Math.abs(slopePercent) / 100) * slopeLengthM
  } = params;

  const absSlope = Math.abs(slopePercent);
  const steps: IctaalCalculationStep[] = [];
  let isRampeRequired = false;
  let isDescenteRequired = false;
  let litArretRecommended = false;

  if (isRampe) {
    if (absSlope > 3.0 && speedPlEstimatedKmh < 50 && slopeLengthM >= 500) {
      isRampeRequired = true;
    }
    steps.push({
      label: 'Vérification VSVL en rampe (montée)',
      formula: 'Rampe > 3% ET V_PL < 50 km/h sur longueur >= 500 m',
      substitution: `Pente = ${absSlope}% | V_PL = ${speedPlEstimatedKmh} km/h | Longueur = ${slopeLengthM} m`,
      result: isRampeRequired ? 'VSVL REQUISE' : 'Non requise',
      explanation: 'Selon l\'Art. 3.2.2b : la VSVL règne sur l\'ensemble de la section où la vitesse des poids lourds reste inférieure à 50 km/h.'
    });
  } else {
    if (absSlope > 3.0 && deniveleeDeltaM > 130) {
      isDescenteRequired = true;
      litArretRecommended = true;
    }
    steps.push({
      label: 'Vérification VSVL en descente (pente)',
      formula: 'Pente > 3% ET Dénivelée cumulée > 130 m',
      substitution: `Pente = ${absSlope}% | Dénivelée calculée = ${deniveleeDeltaM.toFixed(1)} m`,
      result: isDescenteRequired ? 'VSVL & LIT D\'ARRÊT RECOMMANDÉS' : 'Non requis',
      explanation: 'Selon l\'Art. 3.2.2b et 7.1.5 : au-delà de 130 m de dénivelée en forte pente, risque d\'échauffement des freins nécessitant une voie dédiée et un lit d\'arrêt amont points singuliers.'
    });
  }

  return {
    isRampeRequired,
    isDescenteRequired,
    vsvlWidthM: 3.50,
    bddWidthM: 1.00,
    decrochementLengthM: 130,
    refugesSpacingKm: 1.0,
    litArretRecommended,
    steps,
    articleRef: 'ICTAAL 2015/2021 - Chapitre 3.2.2.b (p.18) & Chapitre 4.4.5 (p.22)'
  };
}

export function runIctaalGlobalAudit(params: {
  category: IctaalCategory;
  radiusPlanM: number;
  deversPercent: number;
  clothoideLengthM?: number;
  deltaDeversPercent: number;
  longitudinalSlopePercent: number;
  verticalRadiusM: number;
  isSaillant: boolean;
  heavyVehiclesPLDaily: number;
  bauWidthM: number;
}): IctaalAuditAlert[] {
  const alerts: IctaalAuditAlert[] = [];
  const limits = getIctaalPlanLimits(params.category);

  if (params.radiusPlanM < limits.Rm) {
    alerts.push({
      id: 'ictaal-r-min',
      level: 'CRITIQUE',
      code: 'R_INF_RM',
      title: 'Rayon en plan inférieur au rayon minimal Rm',
      module: 'Tracé en plan',
      message: `Le rayon ${params.radiusPlanM} m est inférieur au minimum absolu ${limits.Rm} m exigé pour la ${params.category}.`,
      actualValue: `${params.radiusPlanM} m`,
      standardValue: `>= ${limits.Rm} m`,
      articleRef: 'ICTAAL Tableau 3-1 (p.16)'
    });
  } else if (params.radiusPlanM < limits.Rdn) {
    alerts.push({
      id: 'ictaal-r-rdn',
      level: 'AVERTISSEMENT',
      code: 'R_INF_RDN',
      title: 'Rayon nécessitant un déversement en courbe',
      module: 'Tracé en plan',
      message: `Le rayon ${params.radiusPlanM} m est inférieur à Rdn (${limits.Rdn} m). Un dévers intérieur calculé selon 1/R et des clothoïdes sont obligatoires.`,
      actualValue: `${params.radiusPlanM} m`,
      standardValue: `Rdn = ${limits.Rdn} m`,
      articleRef: 'ICTAAL Art. 3.1.1'
    });
  } else {
    alerts.push({
      id: 'ictaal-r-ok',
      level: 'CONFORME',
      code: 'R_CONFORME',
      title: 'Rayon en plan réglementaire',
      module: 'Tracé en plan',
      message: `Le rayon ${params.radiusPlanM} m respecte parfaitement les exigences de la ${params.category}.`,
      actualValue: `${params.radiusPlanM} m`,
      standardValue: `>= ${limits.Rm} m`,
      articleRef: 'ICTAAL Tableau 3-1'
    });
  }

  const deversRes = calculateIctaalDevers({ category: params.category, radiusR: params.radiusPlanM });
  if (deversRes.isClothoideRequired && params.clothoideLengthM) {
    const clothRes = calculateIctaalClothoide({
      category: params.category,
      radiusR: params.radiusPlanM,
      deltaDevers: params.deltaDeversPercent
    });
    if (params.clothoideLengthM < clothRes.lclMin) {
      alerts.push({
        id: 'ictaal-cloth-short',
        level: 'MAJEUR',
        code: 'LCL_TROP_COURTE',
        title: 'Longueur de clothoïde insuffisante',
        module: 'Raccordements progressifs',
        message: `La longueur de clothoïde ${params.clothoideLengthM} m est inférieure au minimum réglementaire ${clothRes.lclMin} m (max(14|Δd|, R/9)).`,
        actualValue: `${params.clothoideLengthM} m`,
        standardValue: `>= ${clothRes.lclMin} m`,
        articleRef: 'ICTAAL Art. 3.1.3 (p.16)'
      });
    } else {
      alerts.push({
        id: 'ictaal-cloth-ok',
        level: 'CONFORME',
        code: 'LCL_CONFORME',
        title: 'Clothoïde conforme',
        module: 'Raccordements progressifs',
        message: `La clothoïde de ${params.clothoideLengthM} m satisfait les critères optique et dynamique.`,
        actualValue: `${params.clothoideLengthM} m`,
        standardValue: `>= ${clothRes.lclMin} m`,
        articleRef: 'ICTAAL Art. 3.1.3'
      });
    }
  }

  const profRes = calculateIctaalProfilLong({
    category: params.category,
    slopePercent: params.longitudinalSlopePercent,
    verticalRadiusM: params.verticalRadiusM,
    isSaillant: params.isSaillant
  });

  if (!profRes.isSlopeCompliant) {
    alerts.push({
      id: 'ictaal-slope-excess',
      level: 'CRITIQUE',
      code: 'DECLIVITE_MAX',
      title: 'Pente longitudinale excessive',
      module: 'Profil en long',
      message: `La déclivité ${Math.abs(params.longitudinalSlopePercent)} % dépasse la limite autorisée de ${profRes.slopeMaxPercent} % pour la ${params.category}.`,
      actualValue: `${Math.abs(params.longitudinalSlopePercent)} %`,
      standardValue: `<= ${profRes.slopeMaxPercent} %`,
      articleRef: 'ICTAAL Tableau 3-2 (p.17)'
    });
  }

  if (!profRes.isRadiusCompliant) {
    alerts.push({
      id: 'ictaal-vrad-short',
      level: 'MAJEUR',
      code: 'RAYON_VERTICAL_MIN',
      title: 'Rayon de raccordement vertical insuffisant',
      module: 'Profil en long',
      message: `Le rayon vertical ${params.verticalRadiusM} m est inférieur au minimum réglementaire de ${params.isSaillant ? profRes.radiusSaillantMin : profRes.radiusRentrantMin} m.`,
      actualValue: `${params.verticalRadiusM} m`,
      standardValue: `>= ${params.isSaillant ? profRes.radiusSaillantMin : profRes.radiusRentrantMin} m`,
      articleRef: 'ICTAAL Tableau 3-2 (p.17)'
    });
  }

  if (params.heavyVehiclesPLDaily > 2000 && params.bauWidthM < 3.0) {
    alerts.push({
      id: 'ictaal-bau-pl',
      level: 'MAJEUR',
      code: 'BAU_PL_INSUFFISANTE',
      title: 'Largeur de BAU inférieure aux exigences fort trafic PL',
      module: 'Profil en travers',
      message: `Le trafic lourd (${params.heavyVehiclesPLDaily} PL/j) excède 2 000 v/j. La BAU doit obligatoirement mesurer 3,00 m au lieu de ${params.bauWidthM} m.`,
      actualValue: `${params.bauWidthM} m`,
      standardValue: '3.00 m',
      articleRef: 'ICTAAL Art. 4.1.3b (p.20)'
    });
  }

  return alerts;
}
