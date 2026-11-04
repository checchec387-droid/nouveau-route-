/**
 * Types pour le guide technique Cerema :
 * "Les échangeurs sur routes de type Autoroute"
 * Édition 2013 | Version corrigée mai 2015 | Mise à jour 2021
 */

export type EchangeurType = 'DIFFUSEUR' | 'NOEUD_BIFURCATION';
export type BrancheVitesseType = 110 | 90 | 70 | 50;

export type DispositifSortieType =
  | 'Sd1_1' // Sortie par déboîtement à 1 voie (biseau 150m ou 110m)
  | 'Sd1_2' // Sortie en pseudo-affectation à 1 voie
  | 'Sa1'   // Sortie en affectation à 1 voie (perte d'une voie n'=n-1)
  | 'Sd2'   // Sortie en pseudo-affectation à 2 voies (maintien n'=n)
  | 'Sa2';  // Sortie en affectation à 2 voies (n'=n-1 ou n'=n-2)

export type DispositifEntreeType =
  | 'Ei1'   // Entrée en insertion 1 voie (200m insertion + 75m biseau)
  | 'Ea1'   // Entrée en adjonction 1 voie (longueur L)
  | 'Ea2_R' // Entrée 2 voies avec maintien n'=n (adjonction + rabattement voie gauche)
  | 'Ea2'   // Entrée 2 voies avec adjonction d'une voie (2L + 75m)
  | 'D_Ea2';// Entrée 2 voies avec décrochement + adjonction

export interface EchangeurProjectMetadata {
  id: string;
  name: string;
  dossierNumber: string;
  client: string;
  consultingFirm: string;
  leadEngineer: string;
  date: string;
  version: string;
  description: string;
  technicalNotes: string;
  echangeurType: EchangeurType;
  vitesseAutorouteKmh: 130 | 110 | 90;
  vitesseBrancheKmh: BrancheVitesseType;
  nombreVoiesSectionCourante: 2 | 3 | 4;
  traficTransitT: number;
  traficSortantS: number;
  traficEntrantE: number;
  isReliefDifficile: boolean;
  isVerglasZone: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DecelerationResult {
  vitesseConventionnelleVsKmh: number;
  vitesseCibleVrKmh: number;
  decliviteP: number;
  longueurDecelerationLdM: number;
  formule: string;
  steps: { label: string; value: string; desc: string }[];
}

export interface AccelerationResult {
  vitesseConventionnelleVeKmh: number;
  vitesseInitialeVrKmh: number;
  decliviteP: number;
  longueurAccelerationLaM: number;
  formule: string;
  steps: { label: string; value: string; desc: string }[];
}

export interface DeversEchangeurResult {
  vitesseBrancheKmh: BrancheVitesseType;
  nombreVoies: 1 | 2;
  radiusM: number;
  deversNormalRdnM: number;
  rayonMinimalRmM: number;
  calculatedDeversPercent: number;
  isPlafondVerglas: boolean;
  longueurClothoideMinM: number;
  longueurGauchissementM: number;
  surlargeurM: number;
}

export interface DivergentConvergentResult {
  obliquitePercent: number;
  largeurTplM: number;
  longueurLmM: number;
  longueurL1M: number;
  longueurL2M: number;
  longueurMarquageLbM: number;
  distanceNonPerturbationNpM: number;
}

export interface EntrecroisementResult {
  distanceReelleZM: number;
  vitesseAutorouteKmh: number;
  typeAmenagement: 'DIRECT' | 'ENTRECROISEMENT' | 'COLLECTRICE';
  statutConformite: 'CONFORME' | 'ATTENTION' | 'NON_CONFORME';
  explication: string;
  prescriptions: string[];
}
