/**
 * Type definitions for ARP (Aménagement des Routes Principales - Cerema 2022)
 * Bureau d'études routières - Outil de calcul géométrique et réglementaire
 */

export type RoadCategory = 'R1' | 'R2' | 'RD'; // R1: VMA autorisée, R2: usager adapte sa vitesse, RD: Relief difficile / site contraint
export type RoadType = '4.1' | '4.2' | '3.1' | '3.2'; // 4.1: Ordinaire 2 voies, 4.2: 3 voies affectées, 3.1: Artère interurbaine 2x2, 3.2: 2x1 voie avec TPC
export type FunctionLevel = 'eleve' | 'intermediaire' | 'modere';
export type CrossSectionType = '2 voies' | '3 voies' | '2x2 voies';

export interface ProjectMetadata {
  id: string;
  name: string;
  dossierNumber: string;
  client: string; // Maître d'ouvrage
  consultingFirm: string; // Bureau d'études
  leadEngineer: string; // Ingénieur responsable
  date: string;
  version: string;
  description: string;
  technicalNotes: string;
  category: RoadCategory;
  roadType: RoadType;
  functionLevel: FunctionLevel;
  speedLimitKmh: number;
  tmja: number; // Véhicules / jour
  plDaily: number; // Poids lourds / jour
  isWinterSnowFrostZone: boolean;
  isDifficultReliefSite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalculationStep {
  label: string;
  formula: string;
  substitution: string;
  result: string;
  explanation: string;
}

export type ComplianceStatus = 'CONFORME' | 'NON_CONFORME' | 'ATTENTION' | 'A_CONFIRMER' | 'INCOMPLET';

export interface RegulatoryRuleReference {
  id: string;
  title: string;
  document: string; // ex: Guide ARP - Cerema 2022
  edition: string; // Août 2022
  chapter: string; // ex: Chapitre 4
  section: string; // ex: § 1.1
  table?: string; // ex: Tableau 10
  page: string; // ex: p. 57
  formula?: string;
  status: 'CONFIRME_OFFICIEL' | 'DONNEE_CLASSEUR' | 'A_CONFIRMER_ARP';
  description: string;
}

export interface DeversNormalResult {
  category: RoadCategory;
  isInterurbaine110: boolean;
  radiusR: number;
  Rm: number;
  Rdn: number;
  thresholdClothoide: number;
  calculatedDevers: number; // in %
  configuration: string;
  isRadiusValid: boolean;
  isClothoideRequired: boolean;
  isIceLimitedPossible: boolean;
  deversIfIceLimited?: number;
  steps: CalculationStep[];
  ruleRef: RegulatoryRuleReference;
}

export interface DeversReliefDifficileResult {
  radiusR: number;
  longitudinalSlopeP: number; // in %
  hasSnowOrFrost: boolean;
  userReducedDevers?: number; // in %
  baseDevers: number; // in %
  adoptedDevers: number; // in %
  isAdoptedValidFloor: boolean; // >= 2.5%
  resultantSlope: number; // in % (hypotenuse vector or algebraic sum)
  isResultantSlopeCompliant: boolean; // <= 10%
  justification: string;
  steps: CalculationStep[];
  ruleRef: RegulatoryRuleReference;
}

export interface ClothoideNormalResult {
  crossSectionType: CrossSectionType;
  radiusR: number;
  widthL: number;
  deltaDevers: number;
  category: RoadCategory;
  isInterurbaine110: boolean;
  kCoeff: number;
  rExp04: number;
  geometricTerm: number;
  warpingTerm: number;
  lengthL: number;
  Rdn: number;
  thresholdClothoide: number;
  isClothoideMandatory: boolean;
  governingTerm: 'GEOMETRIQUE' | 'GAUCHISSEMENT';
  steps: CalculationStep[];
  ruleRef: RegulatoryRuleReference;
}

export interface ClothoideReliefDifficileResult {
  crossSectionType: CrossSectionType;
  radiusR: number;
  widthL: number;
  deltaDevers: number;
  proposedReducedLength?: number;
  exactLg?: number;
  deversAtPoint: number;
  longitudinalSlope: number;
  normalLength: number;
  reductionRate?: number;
  estimatedLg: number;
  adoptedLg: number;
  minShiftLength: number;
  allowsMinShift: boolean;
  resultantSlope: number;
  isResultantSlopeCompliant: boolean;
  governingConstraint: string;
  steps: CalculationStep[];
  ruleRef: RegulatoryRuleReference;
}

export interface SurlargeurLacetResult {
  innerRadiusR: number;
  normalLaneWidth: number;
  isDifficultRelief: boolean;
  calculatedLaneWidth: number;
  wideningPerLane: number;
  totalRoadwayWidening: number;
  requiresSweptPathCheck: boolean; // R < 125m
  minIntroductionLength: number; // >= 20m
  hairpinMatch?: {
    configName: string;
    vehicleType: string;
    minInnerRadius: number;
    isCompliant: boolean;
    note: string;
  };
  steps: CalculationStep[];
  ruleRef: RegulatoryRuleReference;
}

export interface LargeurRoulableResult {
  functionLevel: FunctionLevel;
  tmja: number;
  heavyVehiclesPL: number;
  isReducedTrafficCondition: boolean;
  recommendedRoadwayWidth: number;
  recommendedBDDWidth: number;
  totalRoulableWidth: number;
  isSpecialReducedPossible: boolean;
  specialBDDAlternative?: number;
  steps: CalculationStep[];
  ruleRef: RegulatoryRuleReference;
}

export interface TraceEnPlanElement {
  id: string;
  type: 'ALIGNEMENT' | 'COURBE' | 'CLOTHOIDE';
  lengthM: number;
  radiusM?: number; // pour courbe
  parameterA?: number; // paramètre clothoïde A = sqrt(R*L)
  direction?: 'DROITE' | 'GAUCHE';
  cumulPkStart: number;
  cumulPkEnd: number;
}

export interface ProfilEnLongElement {
  id: string;
  type: 'DECLIVITE' | 'RACCORDEMENT_SAILLANT' | 'RACCORDEMENT_RENTRANT';
  slopePercent?: number; // pour déclivité
  verticalRadiusM?: number; // pour parabole
  lengthM: number;
  startZ: number;
  endZ: number;
  cumulPkStart: number;
  cumulPkEnd: number;
}

export interface GlobalProjectAlert {
  id: string;
  level: 'CRITIQUE' | 'MAJEUR' | 'AVERTISSEMENT' | 'INFO';
  module: string;
  title: string;
  message: string;
  remedy: string;
  ruleCitation: string;
}

export interface CalculationHistoryEntry {
  id: string;
  timestamp: string;
  moduleName: string;
  summary: string;
  paramsSnapshot: Record<string, any>;
  resultsSnapshot: Record<string, any>;
}
