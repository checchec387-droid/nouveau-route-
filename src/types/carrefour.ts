/**
 * Type definitions for Aménagement des Carrefours Interurbains sur les Routes Principales
 * Guide Technique SETRA - Décembre 1998 (Référence B 9836)
 */

export type CarrefourType = 'PLAN_ORDINAIRE_TE' | 'PLAN_ORDINAIRE_CROIX' | 'BAIONNETTE' | 'DEMI_CARREFOUR' | 'GIRATOIRE';
export type RegimePriorite = 'STOP' | 'CEDEZ_LE_PASSAGE';
export type RoutePrincipaleType = '2_VOIES' | '3_VOIES' | '2x2_VOIES';

export interface CarrefourProjectMetadata {
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
  carrefourType: CarrefourType;
  routePrincipaleType: RoutePrincipaleType;
  v85Kmh: number;
  regimePriorite: RegimePriorite;
  tmjaPrincipal: number;
  tmjaSecondaire: number;
  proportionPL: number;
  createdAt: string;
  updatedAt: string;
}

export interface VisibiliteFranchissementResult {
  v85Kmh: number;
  regimePriorite: RegimePriorite;
  routePrincipaleType: RoutePrincipaleType;
  hasRampeSup2Percent: boolean;
  tempsConseilleSec: number;
  tempsMinAbsoluSec: number;
  distanceVisibiliteConseilleeM: number;
  distanceVisibiliteMinM: number;
  distanceArretFaceNezM: number;
  reculObservationM: number;
  hauteurObservationM: number;
  hauteurPointObserveM: number;
  explanations: string[];
}

export interface TourneAGaucheResult {
  largeurChausséeCouranteM: number;
  traficTournantGaucheVj: number;
  isPLSignificatif: boolean;
  longueurPresignalisationLpM: number;
  longueurDeportM: number;
  longueurAlignementDroitM: number;
  longueurSiffletM: number;
  longueurStockageM: number;
  nombreVehiculesStockageNs: number;
  longueurTotaleIlotM: number;
  largeurSeparateurAM: number;
  largeurTotaleIlotBM: number;
  largeurVoieTagM: number;
  profilTraversVoieFilanteM: number;
  steps: { label: string; formula: string; result: string; desc: string }[];
}

export interface IlotSecondaireResult {
  largeurVoieSecondaireEllM: number;
  hauteurTriangleHM: number;
  baseTriangleBM: number;
  demiBaseSortieB1M: number;
  demiBaseEntreeB2M: number;
  rayonIlotSortieRisM: number;
  rayonIlotEntreeRieM: number;
  rayonNezIlotRnM: number;
  rayonRaccordementEntreeRreM: number;
  rayonRaccordementSortieRrsM: number;
  rayonSortieRsM: number;
  rayonEntreeReM: number;
  largeurVoieSortieEllSM: number;
  largeurVoieEntreeEllEM: number;
  longueurPresignalisationLpM: number;
}

export interface GiratoireDimensionnementResult {
  rayonGiratoireRgM: number;
  largeurAnneauEllAM: number;
  surlargeurFranchissableSlfM: number;
  rayonInterieurRiM: number;
  rayonEntreeReM: number;
  largeurEntreeEllEM: number;
  rayonSortieRsM: number;
  largeurSortieEllSM: number;
  rayonRaccordementRrM: number;
  deversAnneauPercent: number;
  deflexionEstimeeM: number;
  isDeflexionConforme: boolean;
  steps: { label: string; formula: string; result: string; desc: string }[];
}

export interface CapaciteGiratoireSimplifieeResult {
  traficEntrantQe: number;
  traficSortantQs: number;
  traficTournantQt: number;
  largeurIlotSeparateurEllI: number;
  largeurAnneauEllA: number;
  largeurEntreeEllE: number;
  traficSortantEquivalentQsPrime: number;
  traficGenantQg: number;
  capaciteEntreeC: number;
  reserveCapaciteUvp: number;
  reserveCapacitePercent: number;
  evaluationNiveau: 'CONFORTABLE' | 'SATISFAISANT' | 'RISQUE_CONGESTION' | 'SATURE';
  explications: string[];
}

export interface ModeleAccidentsResult {
  periodeAnneesJ: number;
  traficPrincipalTp: number;
  traficSecondaireTs: number;
  nombreBranches: 3 | 4;
  isRoute2x2: boolean;
  tauxMoyenAnneeFc: number;
  accidentsOrdinaireN: number;
  accidentsGiratoireN: number;
  gainSecuriteAccidents: number;
  gainSecuritePercent: number;
  tuesOrdinaire: number;
  tuesGiratoire: number;
  blessesGravesOrdinaire: number;
  blessesGravesGiratoire: number;
}
