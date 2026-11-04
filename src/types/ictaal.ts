/**
 * Type definitions for ICTAAL
 * Instruction sur les conditions techniques d'aménagement des autoroutes de liaison
 * Édition 2015 - Mise à jour 2021 (Cerema / Ministère des Transports)
 */

export type IctaalCategory = 'L1' | 'L2' | 'RELIEF_DIFFICILE';
export type IctaalCrossSection = '2x2' | '2x3' | '2x4' | 'MODERE_2x2';

export interface IctaalProjectMetadata {
  id: string;
  name: string;
  dossierNumber: string;
  client: string; // Maître d'ouvrage
  consultingFirm: string; // Bureau d'études
  leadEngineer: string; // Ingénieur / Expert responsable
  date: string;
  version: string;
  description: string;
  technicalNotes: string;
  category: IctaalCategory; // L1: 130 km/h, L2: 110 km/h, RELIEF_DIFFICILE: 90 km/h
  crossSection: IctaalCrossSection;
  speedLimitKmh: number; // 130, 110 ou 90
  tmja: number; // Véhicules / jour
  plDaily: number; // Poids lourds / jour
  isWinterSnowFrostZone: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IctaalCalculationStep {
  label: string;
  formula: string;
  substitution: string;
  result: string;
  explanation: string;
}

export interface IctaalDeversResult {
  category: IctaalCategory;
  radiusR: number;
  Rm: number;
  Rdn: number;
  thresholdClothoide: number;
  calculatedDevers: number;
  isRadiusValid: boolean;
  isClothoideRequired: boolean;
  isNormalDevers: boolean;
  bauInterieureSlope: number;
  bauExterieureSlope: number;
  hasContrePente: boolean;
  minDrainageSlope: number;
  steps: IctaalCalculationStep[];
  articleRef: string;
}

export interface IctaalClothoideResult {
  radiusR: number;
  deltaDevers: number;
  isRamp: boolean;
  lclMin: number;
  parameterA: number;
  longueurGauchissement: number;
  formulaApplied: string;
  steps: IctaalCalculationStep[];
  articleRef: string;
}

export interface IctaalProfilTraversResult {
  category: IctaalCategory;
  crossSection: IctaalCrossSection;
  numLanesPerDir: number;
  laneWidthM: number;
  chausseeWidthM: number;
  bdgWidthM: number;
  bauWidthM: number;
  bermeWidthM: number;
  bandeMedianeWidthM: number;
  tpcTotalWidthM: number;
  safetyZoneWidthM: number;
  largeurRoulableSensM: number;
  platformeTotalWidthM: number;
  isModerateTraffic: boolean;
  steps: IctaalCalculationStep[];
  articleRef: string;
}

export interface IctaalInterchangeResult {
  type: 'DECELERATION' | 'ACCELERATION' | 'BRETELLE_COURBE' | 'DEBOITEMENT' | 'INSERTION';
  category: IctaalCategory;
  speedConventionnelleKmh: number;
  speedTargetKmh: number;
  slopeLongitudinalP: number;
  radiusCurveM?: number;
  lengthCalculatedM: number;
  biseauLengthM?: number;
  surlargeurM?: number;
  steps: IctaalCalculationStep[];
  articleRef: string;
}

export interface IctaalProfilLongResult {
  category: IctaalCategory;
  slopeMaxPercent: number;
  radiusSaillantMin: number;
  radiusRentrantMin: number;
  actualSlopePercent: number;
  actualRadiusM: number;
  isSlopeCompliant: boolean;
  isRadiusCompliant: boolean;
  steps: IctaalCalculationStep[];
  articleRef: string;
}

export interface IctaalVsvlResult {
  isRampeRequired: boolean;
  isDescenteRequired: boolean;
  vsvlWidthM: number;
  bddWidthM: number;
  decrochementLengthM: number;
  refugesSpacingKm: number;
  litArretRecommended: boolean;
  steps: IctaalCalculationStep[];
  articleRef: string;
}

export interface IctaalAuditAlert {
  id: string;
  level: 'CRITIQUE' | 'MAJEUR' | 'AVERTISSEMENT' | 'CONFORME';
  code: string;
  title: string;
  module: string;
  message: string;
  actualValue: string | number;
  standardValue: string | number;
  articleRef: string;
}
