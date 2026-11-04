import {
  RoadCategory,
  CrossSectionType,
  FunctionLevel,
  DeversNormalResult,
  DeversReliefDifficileResult,
  ClothoideNormalResult,
  ClothoideReliefDifficileResult,
  SurlargeurLacetResult,
  LargeurRoulableResult,
  TraceEnPlanElement,
  ProfilEnLongElement,
  GlobalProjectAlert,
  RegulatoryRuleReference
} from '../types/arp';
import { ARP_RULES_REGISTRY } from '../data/arpReferenceData';

function getRule(id: string): RegulatoryRuleReference {
  const r = ARP_RULES_REGISTRY.find(item => item.id === id);
  if (!r) {
    return {
      id,
      title: 'Règle ARP',
      document: 'Guide ARP - Cerema 2022',
      edition: 'Août 2022',
      chapter: 'Chapitres 3, 4 et 6',
      section: 'Général',
      page: 'p. 55-93',
      status: 'A_CONFIRMER_ARP',
      description: 'Référence officielle'
    };
  }
  return r;
}

// -------------------------------------------------------------
// 1. CALCUL DU DÉVERS - CAS NORMAL (Chapitre 4 & Chapitre 3 § 4.2)
// -------------------------------------------------------------
export function calculateDeversNormal(params: {
  category: RoadCategory;
  isInterurbaine110: boolean;
  radiusR: number;
}): DeversNormalResult {
  const { category, isInterurbaine110, radiusR } = params;
  let Rm = 240;
  let Rdn = 400;

  if (category === 'R1') {
    if (isInterurbaine110) {
      Rm = 400;
      Rdn = 650;
    } else {
      Rm = 240;
      Rdn = 400;
    }
  } else if (category === 'R2') {
    Rm = 125;
    Rdn = 400;
  } else {
    Rm = 125;
    Rdn = 400;
  }

  const thresholdClothoide = 1.5 * Rdn;
  const isRadiusValid = radiusR >= Rm;
  const isClothoideRequired = radiusR < thresholdClothoide;

  let calculatedDevers = 0.025; // default 2.5%
  let configuration = '';
  let isIceLimitedPossible = false;
  let deversIfIceLimited: number | undefined;

  const steps = [];

  steps.push({
    label: '1. Identification des rayons limites',
    formula: 'Rm et Rdn (Tableau 10, p.57)',
    substitution: `Catégorie ${category}${isInterurbaine110 ? ' (110 km/h)' : ''} => Rm = ${Rm} m, Rdn = ${Rdn} m`,
    result: `Rm = ${Rm} m, Rdn = ${Rdn} m`,
    explanation: 'Le rayon minimal absolu Rm correspond au dévers maximal (7%). Rdn est le seuil au dévers normal de 2,5%.'
  });

  if (radiusR >= Rdn) {
    calculatedDevers = 0.025;
    configuration = 'Alignement ou courbe non déversée : profil en toit à 2,5% vers l\'extérieur';
    steps.push({
      label: '2. Application du dévers normal',
      formula: 'd = 2,5 % si R >= Rdn',
      substitution: `R = ${radiusR} m >= Rdn = ${Rdn} m`,
      result: 'd = 2,50 %',
      explanation: 'Rayon supérieur ou égal à Rdn : la chaussée conserve son profil normal en toit (2,5% vers l\'extérieur dans chaque sens de circulation).'
    });
  } else if (radiusR < Rm) {
    calculatedDevers = 0.07;
    configuration = `Rayon inférieur au rayon minimal réglementaire (R = ${radiusR} m < Rm = ${Rm} m) ! Dévers plafonné à 7,00%`;
    steps.push({
      label: '2. Dépassement du seuil minimal',
      formula: 'R < Rm => Alerte de non-conformité géométrique',
      substitution: `R = ${radiusR} m < Rm = ${Rm} m`,
      result: 'd = 7,00 % (dévers maximal absolu)',
      explanation: 'ATTENTION : Le rayon en plan est inférieur au rayon minimal absolu fixé par le Tableau 10. Nécessite une dérogation technique formelle ou l\'application des règles de relief difficile (Chapitre 6).'
    });
  } else {
    // 1/R linear variation between Rdn (2.5%) and Rm (7.0%)
    const numerator = 1 / radiusR - 1 / Rdn;
    const denominator = 1 / Rm - 1 / Rdn;
    calculatedDevers = 0.025 + (0.07 - 0.025) * (numerator / denominator);
    configuration = 'Courbe déversée en variation linéaire continue selon 1/R vers l\'intérieur';

    steps.push({
      label: '2. Calcul du dévers selon la loi 1/R',
      formula: 'd = 2,5% + (7% - 2,5%) · [(1/R - 1/Rdn) / (1/Rm - 1/Rdn)]',
      substitution: `d = 0.025 + 0.045 · [(1/${radiusR} - 1/${Rdn}) / (1/${Rm} - 1/${Rdn})]`,
      result: `d = ${(calculatedDevers * 100).toFixed(2)} %`,
      explanation: 'La pente transversale est orientée vers l\'intérieur du virage pour compenser la force centrifuge de manière proportionnelle à la courbure 1/R.'
    });

    if (category === 'R1' && radiusR >= 240 && radiusR <= 295) {
      isIceLimitedPossible = true;
      deversIfIceLimited = 0.05;
    } else if (category === 'R2' && radiusR >= 125 && radiusR <= 180) {
      isIceLimitedPossible = true;
      deversIfIceLimited = 0.05;
    }

    if (isIceLimitedPossible) {
      steps.push({
        label: '3. Option zone de verglas / sujétions techniques',
        formula: 'd_max_verglas = 5,00 % (Chapitre 3 § 4.2, p.45)',
        substitution: `Courbe normalement déversée au-delà de 5% (R = ${radiusR} m)`,
        result: 'Plafond autorisé à 5,00%',
        explanation: 'Dans les zones fréquemment soumises au verglas ou pour raisons techniques, le guide ARP autorise de plafonner le dévers à 5% pour éviter le glissement gravitaire des véhicules lents.'
      });
    }
  }

  steps.push({
    label: '4. Contrôle de l\'obligation de raccordement progressif',
    formula: 'Raccordement obligatoire si R < 1,5 · Rdn',
    substitution: `R = ${radiusR} m ${isClothoideRequired ? '<' : '>='} 1,5 · ${Rdn} = ${thresholdClothoide} m`,
    result: isClothoideRequired ? 'OUI : Clothoïde obligatoire' : 'NON : Raccordement circulaire direct possible',
    explanation: 'Le guide ARP impose une clothoïde pour introduire les courbes de rayon inférieur à 1,5 Rdn afin de basculer le dévers et assurer le confort dynamique.'
  });

  return {
    category,
    isInterurbaine110,
    radiusR,
    Rm,
    Rdn,
    thresholdClothoide,
    calculatedDevers: Number((calculatedDevers * 100).toFixed(3)),
    configuration,
    isRadiusValid,
    isClothoideRequired,
    isIceLimitedPossible,
    deversIfIceLimited: deversIfIceLimited ? deversIfIceLimited * 100 : undefined,
    steps,
    ruleRef: getRule('DEVERS-LOI')
  };
}

// -------------------------------------------------------------
// 2. DÉVERS EN RELIEF DIFFICILE (Chapitre 6 § 2.4 & § 3.2)
// -------------------------------------------------------------
export function calculateDeversReliefDifficile(params: {
  radiusR: number;
  longitudinalSlopeP: number; // in %
  hasSnowOrFrost: boolean;
  userReducedDevers?: number; // in %
}): DeversReliefDifficileResult {
  const { radiusR, longitudinalSlopeP, hasSnowOrFrost, userReducedDevers } = params;

  let baseDeversPercent = 2.5;
  if (radiusR < 125) {
    baseDeversPercent = 7.0;
  } else if (radiusR <= 400) {
    baseDeversPercent = 2.5 + (7.0 - 2.5) * ((1 / radiusR - 1 / 400) / (1 / 125 - 1 / 400));
  } else {
    baseDeversPercent = 2.5;
  }

  const adoptedDevers =
    userReducedDevers !== undefined && !isNaN(userReducedDevers) && userReducedDevers > 0
      ? userReducedDevers
      : baseDeversPercent;

  const isAdoptedValidFloor = adoptedDevers >= 2.5;
  const resultantSlope = adoptedDevers + Math.abs(longitudinalSlopeP);
  const isResultantSlopeCompliant = resultantSlope <= 10.0;

  const steps = [];

  steps.push({
    label: '1. Calcul du dévers de base (loi continue)',
    formula: 'd_base = 2,5% + (7% - 2,5%) · [(1/R - 1/400) / (1/125 - 1/400)] (p.91)',
    substitution: `R = ${radiusR} m => 1/R = ${(1 / radiusR).toFixed(5)}`,
    result: `d_base = ${baseDeversPercent.toFixed(2)} %`,
    explanation: 'Le dévers de base en relief difficile suit la loi générale entre 7% (à 125 m) et 2,5% (à 400 m).'
  });

  if (userReducedDevers !== undefined && !isNaN(userReducedDevers)) {
    steps.push({
      label: '2. Évaluation de la réduction proposée par l\'ingénieur',
      formula: 'd_retenu >= 2,50 % (plancher réglementaire absolu)',
      substitution: `d_proposé = ${userReducedDevers.toFixed(2)} %`,
      result: isAdoptedValidFloor ? 'CONFORME (>= 2,50%)' : 'NON CONFORME (< 2,50% plancher violé)',
      explanation: 'Le chapitre 6 autorise la réduction pour forte pente, neige/verglas ou brièveté de raccordement, SANS jamais descendre sous 2,5%.'
    });
  }

  steps.push({
    label: '3. Calcul de la pente résultante de la chaussée',
    formula: 'P_résultante = d_retenu + |p_longitudinal|',
    substitution: `${adoptedDevers.toFixed(2)} % + ${Math.abs(longitudinalSlopeP).toFixed(2)} %`,
    result: `P_rés = ${resultantSlope.toFixed(2)} %`,
    explanation: 'Sur un profil en long déclive, la composante transversale et la pente longitudinale se combinent.'
  });

  steps.push({
    label: '4. Contrôle de la limite admissible de pente résultante',
    formula: 'P_résultante <= 10,00 % (Chapitre 6 § 3.2, p.92)',
    substitution: `${resultantSlope.toFixed(2)} % ${isResultantSlopeCompliant ? '<=' : '>'} 10,00 %`,
    result: isResultantSlopeCompliant ? 'CONFORME (<= 10 %)' : 'NON CONFORME (DÉPASSEMENT > 10 %)',
    explanation: 'Le guide ARP stipule expressément que la pente résultante de la chaussée dans un raccordement progressif ne doit JAMAIS excéder 10 %.'
  });

  let justification = 'Dévers de base conservé';
  if (userReducedDevers !== undefined && !isNaN(userReducedDevers)) {
    justification = `Dévers réduit à ${userReducedDevers.toFixed(2)}% pour prise en compte de la pente longitudinale (${longitudinalSlopeP}%) et/ou des conditions climatiques.`;
  }
  if (!isResultantSlopeCompliant) {
    justification += ' ALERTE : La pente résultante excède 10 %, réduction supplémentaire de dévers ou reprise du profil en long requise !';
  }

  return {
    radiusR,
    longitudinalSlopeP,
    hasSnowOrFrost,
    userReducedDevers,
    baseDevers: Number(baseDeversPercent.toFixed(2)),
    adoptedDevers: Number(adoptedDevers.toFixed(2)),
    isAdoptedValidFloor,
    resultantSlope: Number(resultantSlope.toFixed(2)),
    isResultantSlopeCompliant,
    justification,
    steps,
    ruleRef: getRule('DEVERS-RD-PENTE')
  };
}

// -------------------------------------------------------------
// 3. CALCUL DES CLOTHOÏDES - CAS NORMAL (Tableau 11, p.58)
// -------------------------------------------------------------
export function calculateClothoideNormal(params: {
  crossSectionType: CrossSectionType;
  radiusR: number;
  widthL: number;
  deltaDevers: number;
  category: RoadCategory;
  isInterurbaine110: boolean;
}): ClothoideNormalResult {
  const { crossSectionType, radiusR, widthL, deltaDevers, category, isInterurbaine110 } = params;

  const kCoeff = crossSectionType === '2 voies' ? 6 : 12;
  const rExp04 = Math.pow(radiusR, 0.4);
  const geometricTerm = kCoeff * rExp04;
  const warpingTerm = 2 * widthL * Math.abs(deltaDevers);

  const lengthL = Math.max(geometricTerm, warpingTerm);
  const governingTerm = geometricTerm >= warpingTerm ? 'GEOMETRIQUE' : 'GAUCHISSEMENT';

  let Rdn = 400;
  if (category === 'R1' && isInterurbaine110) {
    Rdn = 650;
  }
  const thresholdClothoide = 1.5 * Rdn;
  const isClothoideMandatory = radiusR < thresholdClothoide;

  const steps = [];

  steps.push({
    label: '1. Paramètres de la formule (Tableau 11, p.58)',
    formula: 'L = MAX( 2·l·|Δd| ; k · R^0.4 )',
    substitution: `Profil : ${crossSectionType} => k = ${kCoeff}, l = ${widthL} m, |Δd| = ${Math.abs(deltaDevers)} %`,
    result: `k = ${kCoeff}`,
    explanation: 'Le coefficient k vaut 6 pour une chaussée à 2 voies, et 12 pour les routes à 3 voies ou 2x2 voies.'
  });

  steps.push({
    label: '2. Terme géométrique (confort dynamique de virage)',
    formula: 'L_geo = k · R^0.4',
    substitution: `${kCoeff} · ${radiusR}^0.4 = ${kCoeff} · ${rExp04.toFixed(3)}`,
    result: `${geometricTerm.toFixed(2)} m`,
    explanation: 'Garantit une progressivité de l\'accélération transversale centrifuge.'
  });

  steps.push({
    label: '3. Terme de gauchissement (basculement du dévers)',
    formula: 'L_gauch = 2·l·|Δd|',
    substitution: `2 · ${widthL} · ${Math.abs(deltaDevers)}`,
    result: `${warpingTerm.toFixed(2)} m`,
    explanation: 'Assure que le basculement de dévers ne crée pas de gauchissement excessif des châssis.'
  });

  steps.push({
    label: '4. Longueur de clothoïde retenue L',
    formula: 'L = MAX(L_geo ; L_gauch)',
    substitution: `MAX( ${geometricTerm.toFixed(2)} m ; ${warpingTerm.toFixed(2)} m )`,
    result: `L = ${lengthL.toFixed(2)} m (${governingTerm === 'GEOMETRIQUE' ? 'Terme géométrique gouvernant' : 'Terme de gauchissement gouvernant'})`,
    explanation: `La longueur dimensionnante retenue pour le projet est ${lengthL.toFixed(2)} m.`
  });

  steps.push({
    label: '5. Contrôle du seuil d\'obligation (chap. 4 § 1.3, p.58)',
    formula: 'R < 1,5 · Rdn',
    substitution: `R = ${radiusR} m ${isClothoideMandatory ? '<' : '>='} 1,5 · ${Rdn} = ${thresholdClothoide} m`,
    result: isClothoideMandatory ? 'OBLIGATOIRE' : 'FACULTATIF',
    explanation: isClothoideMandatory
      ? `Le rayon étant inférieur à 1,5 Rdn (${thresholdClothoide} m), l'introduction par clothoïde est impérative.`
      : `Le rayon est suffisant (>= ${thresholdClothoide} m), le raccordement progressif n'est pas obligatoire selon le guide.`
  });

  return {
    crossSectionType,
    radiusR,
    widthL,
    deltaDevers,
    category,
    isInterurbaine110,
    kCoeff,
    rExp04: Number(rExp04.toFixed(4)),
    geometricTerm: Number(geometricTerm.toFixed(2)),
    warpingTerm: Number(warpingTerm.toFixed(2)),
    lengthL: Number(lengthL.toFixed(2)),
    Rdn,
    thresholdClothoide,
    isClothoideMandatory,
    governingTerm,
    steps,
    ruleRef: getRule('TAB-11')
  };
}

// -------------------------------------------------------------
// 4. CLOTHOÏDES EN RELIEF DIFFICILE (Chapitre 6 § 3.2, p.92)
// -------------------------------------------------------------
export function calculateClothoideReliefDifficile(params: {
  crossSectionType: CrossSectionType;
  radiusR: number;
  widthL: number;
  deltaDevers: number;
  proposedReducedLength?: number;
  exactLg?: number;
  deversAtPoint: number;
  longitudinalSlope: number;
}): ClothoideReliefDifficileResult {
  const {
    crossSectionType,
    radiusR,
    widthL,
    deltaDevers,
    proposedReducedLength,
    exactLg,
    deversAtPoint,
    longitudinalSlope
  } = params;

  const kCoeff = crossSectionType === '2 voies' ? 6 : 12;
  const normalLength = Math.max(kCoeff * Math.pow(radiusR, 0.4), 2 * widthL * Math.abs(deltaDevers));
  const estimatedLg = 2 * widthL * Math.abs(deltaDevers);
  const adoptedLg = exactLg !== undefined && !isNaN(exactLg) && exactLg > 0 ? exactLg : estimatedLg;

  const minShiftLength = adoptedLg / 2;
  const allowsMinShift = proposedReducedLength !== undefined
    ? proposedReducedLength >= minShiftLength
    : true;

  const reductionRate = proposedReducedLength !== undefined
    ? ((normalLength - proposedReducedLength) / normalLength) * 100
    : undefined;

  const resultantSlope = Math.abs(deversAtPoint) + Math.abs(longitudinalSlope);
  const isResultantSlopeCompliant = resultantSlope <= 10.0;

  let governingConstraint = 'Longueur normale du Tableau 11';
  if (proposedReducedLength !== undefined) {
    if (proposedReducedLength === 0) {
      governingConstraint = 'Suppression complète de la clothoïde (basculement en alignement droit)';
    } else if (proposedReducedLength < minShiftLength) {
      governingConstraint = 'Clothoïde trop courte : inférieure à Lg/2 !';
    } else {
      governingConstraint = 'Clothoïde réduite encadrée par la limite Lg/2';
    }
  }

  const steps = [];

  steps.push({
    label: '1. Calcul de la longueur normale de référence',
    formula: 'L_norm = MAX( 2·l·|Δd| ; k R^0.4 ) (Tableau 11)',
    substitution: `MAX( 2 · ${widthL} · ${Math.abs(deltaDevers)} ; ${kCoeff} · ${radiusR}^0.4 )`,
    result: `${normalLength.toFixed(2)} m`,
    explanation: 'Valeur de référence théorique avant toute réduction autorisée par le chapitre 6.'
  });

  steps.push({
    label: '2. Longueur de gauchissement Lg et seuil minimal Lg/2',
    formula: 'L_min_basculement = Lg / 2 = l · |Δd| (p.92)',
    substitution: `${adoptedLg.toFixed(2)} m / 2 = ${widthL} · ${Math.abs(deltaDevers)}`,
    result: `${minShiftLength.toFixed(2)} m`,
    explanation: 'Le basculement de dévers doit s\'effectuer sur au moins la moitié de la longueur de gauchissement.'
  });

  if (proposedReducedLength !== undefined) {
    steps.push({
      label: '3. Contrôle de la réduction proposée',
      formula: 'L_réduite >= Lg / 2 (ou suppression avec basculement en alignement)',
      substitution: `L_prop = ${proposedReducedLength.toFixed(2)} m vs L_min = ${minShiftLength.toFixed(2)} m`,
      result: allowsMinShift ? 'CONFORME (>= Lg/2)' : 'NON CONFORME (< Lg/2)',
      explanation: allowsMinShift
        ? 'La longueur réduite est suffisante pour absorber le basculement de dévers requis.'
        : 'ATTENTION : La clothoïde est trop courte.'
    });
  }

  steps.push({
    label: '4. Contrôle de la pente résultante de la chaussée',
    formula: 'P_rés = Dévers + Pente longitudinale <= 10,00 %',
    substitution: `${Math.abs(deversAtPoint).toFixed(2)} % + ${Math.abs(longitudinalSlope).toFixed(2)} % = ${resultantSlope.toFixed(2)} %`,
    result: isResultantSlopeCompliant ? 'CONFORME (<= 10 %)' : 'NON CONFORME (> 10 %)',
    explanation: 'La pente résultante ne doit jamais excéder 10 % dans le raccordement progressif.'
  });

  return {
    crossSectionType,
    radiusR,
    widthL,
    deltaDevers,
    proposedReducedLength,
    exactLg,
    deversAtPoint,
    longitudinalSlope,
    normalLength: Number(normalLength.toFixed(2)),
    reductionRate: reductionRate !== undefined ? Number(reductionRate.toFixed(1)) : undefined,
    estimatedLg: Number(estimatedLg.toFixed(2)),
    adoptedLg: Number(adoptedLg.toFixed(2)),
    minShiftLength: Number(minShiftLength.toFixed(2)),
    allowsMinShift,
    resultantSlope: Number(resultantSlope.toFixed(2)),
    isResultantSlopeCompliant,
    governingConstraint,
    steps,
    ruleRef: getRule('CLOTH-RD-REDUC')
  };
}

// -------------------------------------------------------------
// 5. SURLARGEURS EN COURBE ET LACETS (Chapitre 3 § 2.3 & Chapitre 6 § 2.2-2.3)
// -------------------------------------------------------------
export function calculateSurlargeurLacet(params: {
  innerRadiusR: number;
  normalLaneWidth: number;
  isDifficultRelief: boolean;
}): SurlargeurLacetResult {
  const { innerRadiusR, normalLaneWidth, isDifficultRelief } = params;

  let calculatedLaneWidth = normalLaneWidth;

  if (isDifficultRelief) {
    if (innerRadiusR < 50) {
      calculatedLaneWidth = 3.50 + 30 / innerRadiusR;
    } else if (innerRadiusR <= 200) {
      calculatedLaneWidth = 3.50 + 25 / innerRadiusR;
    } else if (innerRadiusR < 350) {
      calculatedLaneWidth = Math.max(normalLaneWidth, 3.50);
    } else {
      calculatedLaneWidth = normalLaneWidth;
    }
  } else {
    if (innerRadiusR < 200) {
      calculatedLaneWidth = 3.50 + 50 / innerRadiusR;
    } else if (innerRadiusR < 300) {
      calculatedLaneWidth = Math.max(normalLaneWidth, 3.50);
    } else if (innerRadiusR < 350) {
      calculatedLaneWidth = Math.max(normalLaneWidth, normalLaneWidth === 3.00 ? 3.25 : normalLaneWidth);
    } else {
      calculatedLaneWidth = normalLaneWidth;
    }
  }

  const wideningPerLane = Math.max(0, calculatedLaneWidth - normalLaneWidth);
  const totalRoadwayWidening = wideningPerLane * 2;
  const requiresSweptPathCheck = innerRadiusR < 125;
  const minIntroductionLength = 20;

  let hairpinMatch;
  if (innerRadiusR <= 25) {
    if (innerRadiusR >= 6.5) {
      hairpinMatch = {
        configName: 'Lacet sur chaussée 8 m',
        vehicleType: 'Poids lourd (utilise toute la chaussée)',
        minInnerRadius: 6.5,
        isCompliant: innerRadiusR >= 6.5,
        note: 'Chaussée 8 m : le poids lourd sort de sa voie. À éviter si trafic lourd non négligeable.'
      };
    } else {
      hairpinMatch = {
        configName: 'Lacet extrême',
        vehicleType: 'Poids lourd',
        minInnerRadius: 6.5,
        isCompliant: false,
        note: 'Rayon intérieur < 6,50 m : non girable pour un poids lourd standard !'
      };
    }
  }

  const steps = [];

  steps.push({
    label: '1. Règle applicable',
    formula: isDifficultRelief
      ? 'Relief difficile : 3,50 + 25/R (50<=R<=200 m) ou 3,50 + 30/R (R<50 m)'
      : 'Cas normal (Tableau 6) : 3,50 + 50/R (R<200 m)',
    substitution: `R = ${innerRadiusR} m, Largeur initiale = ${normalLaneWidth} m`,
    result: `Contexte : ${isDifficultRelief ? 'Relief difficile (§ 2.2)' : 'Cas normal (Tableau 6)'}`,
    explanation: 'La surlargeur compense la trajectoire de l\'essieu arrière du poids lourd.'
  });

  steps.push({
    label: '2. Calcul de la largeur de voie requise',
    formula: 'Largeur calculée (m)',
    substitution: `Formule appliquée à R = ${innerRadiusR} m`,
    result: `${calculatedLaneWidth.toFixed(2)} m (Surlargeur : +${wideningPerLane.toFixed(2)} m par voie)`,
    explanation: `Surlargeur totale de chaussée (2 voies) = +${totalRoadwayWidening.toFixed(2)} m.`
  });

  steps.push({
    label: '3. Conditions de mise en œuvre et d\'introduction',
    formula: 'Longueur intro >= 20 m (hors arc circulaire)',
    substitution: `Introduction linéaire le long de la clothoïde`,
    result: `L_intro >= 20,00 m`,
    explanation: 'La surlargeur règne sur la partie circulaire et s\'introduit progressivement hors de celle-ci.'
  });

  if (requiresSweptPathCheck) {
    steps.push({
      label: '4. Contrôle de giration (épures)',
      formula: 'R < 125 m => Épures de giration obligatoires',
      substitution: `R = ${innerRadiusR} m < 125 m`,
      result: 'VÉRIFICATION PAR ÉPURES REQUISE',
      explanation: 'Pour tout rayon inférieur à 125 m, le guide ARP impose de vérifier le balayage des poids lourds par épures.'
    });
  }

  return {
    innerRadiusR,
    normalLaneWidth,
    isDifficultRelief,
    calculatedLaneWidth: Number(calculatedLaneWidth.toFixed(2)),
    wideningPerLane: Number(wideningPerLane.toFixed(2)),
    totalRoadwayWidening: Number(totalRoadwayWidening.toFixed(2)),
    requiresSweptPathCheck,
    minIntroductionLength,
    hairpinMatch,
    steps,
    ruleRef: getRule('TAB-06')
  };
}

// -------------------------------------------------------------
// 6. LARGEUR ROULABLE EN RELIEF DIFFICILE (Tableau 14, p.90)
// -------------------------------------------------------------
export function calculateLargeurRoulable(params: {
  functionLevel: FunctionLevel;
  tmja: number;
  heavyVehiclesPL: number;
}): LargeurRoulableResult {
  const { functionLevel, tmja, heavyVehiclesPL } = params;

  let recommendedRoadwayWidth = 6.00;
  let recommendedBDDWidth = 1.50;
  const isReducedTrafficCondition = tmja < 2000 && heavyVehiclesPL < 100;
  let isSpecialReducedPossible = false;
  let specialBDDAlternative: number | undefined;

  if (functionLevel === 'eleve') {
    recommendedRoadwayWidth = 6.50;
    recommendedBDDWidth = 1.75;
  } else if (functionLevel === 'intermediaire') {
    recommendedRoadwayWidth = 6.00;
    recommendedBDDWidth = 1.50;
  } else {
    recommendedRoadwayWidth = 5.50;
    if (isReducedTrafficCondition) {
      recommendedBDDWidth = 1.25;
      isSpecialReducedPossible = true;
      specialBDDAlternative = 1.00;
    } else {
      recommendedBDDWidth = 1.50;
    }
  }

  const totalRoulableWidth = recommendedRoadwayWidth + 2 * recommendedBDDWidth;

  const steps = [];

  steps.push({
    label: '1. Identification du niveau de fonctions',
    formula: 'Niveau sélectionné : ' + functionLevel.toUpperCase(),
    substitution: `TMJA = ${tmja} véh./j, PL = ${heavyVehiclesPL} PL/j`,
    result: `Niveau ${functionLevel.toUpperCase()}`,
    explanation: 'Le Tableau 14 fixe les dimensions minimales admissibles pour concilier contraintes de relief et sécurité.'
  });

  steps.push({
    label: '2. Chaussée et BDD réglementaires',
    formula: 'Valeurs issues du Tableau 14 (p.90)',
    substitution: `Chaussée = ${recommendedRoadwayWidth.toFixed(2)} m, BDD = ${recommendedBDDWidth.toFixed(2)} m`,
    result: `Largeur roulable = ${totalRoulableWidth.toFixed(2)} m`,
    explanation: 'La largeur roulable totale comprend la chaussée et deux bandes dérasées de droite.'
  });

  if (isReducedTrafficCondition && functionLevel === 'modere') {
    steps.push({
      label: '3. Dérogation trafic très réduit',
      formula: 'TMJA < 2000 et PL < 100 => BDD 1,25 m ou 1,00 m possible',
      substitution: `${tmja} < 2000 et ${heavyVehiclesPL} < 100`,
      result: 'BDD réduite à 1,25 m (voire 1,00 m)',
      explanation: 'Le guide admet une réduction complémentaire exceptionnelle de la BDD jusqu\'à 1 m pour les très faibles trafics.'
    });
  }

  return {
    functionLevel,
    tmja,
    heavyVehiclesPL,
    isReducedTrafficCondition,
    recommendedRoadwayWidth,
    recommendedBDDWidth,
    totalRoulableWidth: Number(totalRoulableWidth.toFixed(2)),
    isSpecialReducedPossible,
    specialBDDAlternative,
    steps,
    ruleRef: getRule('TAB-14')
  };
}

// -------------------------------------------------------------
// 7. CONTRÔLE GLOBAL DE CONFORMITÉ DU PROJET
// -------------------------------------------------------------
export function runGlobalProjectAudit(params: {
  category: RoadCategory;
  isInterurbaine110: boolean;
  radiusNormal: number;
  radiusRD: number;
  deversNormal: number;
  deversRD: number;
  longitudinalSlopeRD: number;
  clothoideNormalLength: number;
  clothoideRDLength?: number;
  minShiftRDLength: number;
  tmja: number;
  plDaily: number;
  traceElements?: TraceEnPlanElement[];
  profilElements?: ProfilEnLongElement[];
}): GlobalProjectAlert[] {
  const alerts: GlobalProjectAlert[] = [];

  const RmNormal = params.category === 'R1' ? (params.isInterurbaine110 ? 400 : 240) : 125;
  const RdnNormal = params.category === 'R1' ? (params.isInterurbaine110 ? 650 : 400) : 400;

  // 1. Rayon normal < Rm
  if (params.radiusNormal < RmNormal) {
    alerts.push({
      id: 'ALT-R-MIN',
      level: 'CRITIQUE',
      module: 'Dévers cas normal',
      title: 'Rayon inférieur au rayon minimal absolu (Rm)',
      message: `Le rayon saisi R = ${params.radiusNormal} m est strictement inférieur au rayon minimal Rm = ${RmNormal} m de la catégorie ${params.category}.`,
      remedy: `Augmenter le rayon au moins à ${RmNormal} m ou reclasser la section en relief difficile / justifier un écart exceptionnel.`,
      ruleCitation: 'Guide ARP 2022 - Tableau 10, p. 57'
    });
  }

  // 2. Dévers < 2.5% en courbe
  if (params.radiusNormal < RdnNormal && params.deversNormal < 2.5) {
    alerts.push({
      id: 'ALT-DEV-MIN',
      level: 'CRITIQUE',
      module: 'Dévers cas normal',
      title: 'Dévers inférieur au plancher réglementaire',
      message: 'En courbe déversée (R < Rdn), le dévers ne peut être inférieur à 2,50% vers l\'intérieur du virage.',
      remedy: 'Appliquer au minimum 2,50% ou respecter la formule continue selon 1/R.',
      ruleCitation: 'Guide ARP 2022 - Chapitre 3 § 4.2, p. 45'
    });
  }

  // 3. Pente résultante en relief difficile > 10%
  const penteResRD = params.deversRD + Math.abs(params.longitudinalSlopeRD);
  if (penteResRD > 10.0) {
    alerts.push({
      id: 'ALT-PRES-MAX',
      level: 'CRITIQUE',
      module: 'Clothoïde relief difficile',
      title: 'Pente résultante de la chaussée supérieure à 10 %',
      message: `La pente combinée (dévers ${params.deversRD.toFixed(1)}% + rampe/pente ${params.longitudinalSlopeRD}%) atteint ${penteResRD.toFixed(2)}%, ce qui excède la limite absolue de 10%.`,
      remedy: 'Réduire le dévers jusqu\'au plancher de 2,5% ou adoucir la déclivité longitudinale du profil en long.',
      ruleCitation: 'Guide ARP 2022 - Chapitre 6 § 3.2, p. 92'
    });
  }

  // 4. Clothoïde réduite en relief difficile < Lg/2
  if (params.clothoideRDLength !== undefined && params.clothoideRDLength > 0 && params.clothoideRDLength < params.minShiftRDLength) {
    alerts.push({
      id: 'ALT-CLOTH-MIN',
      level: 'MAJEUR',
      module: 'Clothoïde relief difficile',
      title: 'Clothoïde réduite insuffisante pour le basculement',
      message: `La longueur de clothoïde réduite (${params.clothoideRDLength} m) est inférieure à la moitié de la longueur de gauchissement (${params.minShiftRDLength.toFixed(1)} m).`,
      remedy: `Porter la longueur au minimum à ${params.minShiftRDLength.toFixed(1)} m, ou supprimer totalement la clothoïde et basculer dans l'alignement droit amont.`,
      ruleCitation: 'Guide ARP 2022 - Chapitre 6 § 3.2, p. 92'
    });
  }

  // 5. Trafic et adéquation du type de route
  if (params.category === 'R1' && params.tmja > 15000) {
    alerts.push({
      id: 'ALT-TRAFIC-HIGH',
      level: 'AVERTISSEMENT',
      module: 'Paramètres du projet',
      title: 'Trafic élevé sur route ordinaire',
      message: `Le trafic journalier moyen (${params.tmja} véh./j) dépasse la plage optimale d'une route bidirectionnelle ordinaire (~10 000 véh./j).`,
      remedy: 'Envisager un profil à 3 voies affectées (type 4.2) ou artère interurbaine (type 3.1) avec créneaux de dépassement.',
      ruleCitation: 'Guide ARP 2022 - Tableau 1 & Tableau 2, p. 19-20'
    });
  }

  // 6. Trace en plan enchaînement
  if (params.traceElements && params.traceElements.length > 1) {
    for (let i = 0; i < params.traceElements.length - 1; i++) {
      const el1 = params.traceElements[i];
      const el2 = params.traceElements[i + 1];
      if (el1.type === 'COURBE' && el2.type === 'COURBE' && el1.radiusM && el2.radiusM) {
        const ratio = el1.radiusM / el2.radiusM;
        if ((el1.radiusM < 1.5 * RdnNormal || el2.radiusM < 1.5 * RdnNormal) && (ratio <= 0.67 || ratio >= 1.5)) {
          alerts.push({
            id: `ALT-TRACE-PROG-${i}`,
            level: 'MAJEUR',
            module: 'Tracé en plan',
            title: `Rupture de progressivité des rayons (Éléments ${i + 1} & ${i + 2})`,
            message: `Le rapport de rayons R1/R2 = ${(ratio).toFixed(2)} est hors de la plage réglementaire 0,67 < R/R' < 1,50 (R1=${el1.radiusM} m, R2=${el2.radiusM} m).`,
            remedy: 'Intercaler un alignement droit suffisant (>= 3s de parcours à V85) ou harmoniser les rayons successifs.',
            ruleCitation: 'Guide ARP 2022 - Chapitre 4 § 1.2, p. 57-58'
          });
        }
      }
    }
  }

  // 7. Profil en long déclivité
  if (params.profilElements) {
    const maxDeclivite = params.category === 'R1' ? 6.0 : 7.0;
    for (let i = 0; i < params.profilElements.length; i++) {
      const pel = params.profilElements[i];
      if (pel.type === 'DECLIVITE' && pel.slopePercent && Math.abs(pel.slopePercent) > maxDeclivite) {
        alerts.push({
          id: `ALT-PROFIL-DECL-${i}`,
          level: 'MAJEUR',
          module: 'Profil en long',
          title: `Déclivité excessive (${pel.slopePercent}%)`,
          message: `La déclivité de l'élément ${i + 1} (${Math.abs(pel.slopePercent)}%) dépasse la valeur limite admissible de ${maxDeclivite}% pour la catégorie ${params.category}.`,
          remedy: 'Adoucir la pente longitudinale ou justifier la nécessité absolue (contraintes topographiques majeures).',
          ruleCitation: 'Guide ARP 2022 - Tableau 12, p. 60'
        });
      }
    }
  }

  return alerts;
}
