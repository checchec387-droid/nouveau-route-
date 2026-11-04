import {
  RoadCategory,
  ProjectMetadata,
  TraceEnPlanElement,
  ProfilEnLongElement,
  CalculationHistoryEntry
} from '../types/arp';
import {
  IctaalCategory,
  IctaalCrossSection,
  IctaalProjectMetadata
} from '../types/ictaal';
import {
  CarrefourProjectMetadata,
  CarrefourType,
  RegimePriorite,
  RoutePrincipaleType
} from '../types/carrefour';
import {
  EchangeurProjectMetadata,
  EchangeurType,
  BrancheVitesseType,
  DispositifSortieType,
  DispositifEntreeType
} from '../types/echangeurs';

export interface FullEchangeurProjectState {
  metadata: EchangeurProjectMetadata;
  deceleration: {
    vitesseAutorouteKmh: 130 | 110 | 90;
    vitesseCibleVrKmh: number;
    decliviteP: number;
    typeSortie: DispositifSortieType;
  };
  acceleration: {
    vitesseAutorouteKmh: 130 | 110 | 90;
    vitesseInitialeVrKmh: number;
    decliviteP: number;
    typeEntree: DispositifEntreeType;
  };
  bretelle: {
    vitesseBrancheKmh: BrancheVitesseType;
    radiusM: number;
    nombreVoies: 1 | 2;
    isVerglasZone: boolean;
    isReliefDifficile: boolean;
  };
  divergent: {
    obliquitePercent: 3 | 4 | 5;
    largeurTplM: number;
  };
  entrecroisement: {
    distanceReelleZM: number;
    vitesseAutorouteKmh: number;
    traficTransitT: number;
    traficEntrecroise1: number;
    traficEntrecroise2: number;
  };
  typologie: {
    natureIntersection: 'AUTOROUTE_ROUTE_SECONDAIRE' | 'AUTOROUTE_AUTOROUTE';
    traficEchangeTotal: number;
    contrainteEmprise: 'FAIBLE' | 'MOYENNE' | 'FORTE';
    presencePeage: boolean;
  };
  history: CalculationHistoryEntry[];
}

export interface FullCarrefourProjectState {
  metadata: CarrefourProjectMetadata;
  visibilite: {
    v85Kmh: number;
    regimePriorite: RegimePriorite;
    routePrincipaleType: RoutePrincipaleType;
    hasRampeSup2Percent: boolean;
    reculObservationM: number;
  };
  tourneAGauche: {
    largeurChausséeCouranteM: number;
    traficTournantGaucheVj: number;
    isPLSignificatif: boolean;
    vitesseV85Kmh: number;
  };
  giratoire: {
    rayonGiratoireRgM: number;
    nombreVoiesEntree: 1 | 2;
    hasTraficPLImportant: boolean;
  };
  capacite: {
    traficEntrantQe: number;
    traficSortantQs: number;
    traficTournantQt: number;
    largeurAnneauEllA: number;
    largeurEntreeEllE: number;
  };
  accidentologie: {
    traficPrincipalTp: number;
    traficSecondaireTs: number;
    nombreBranches: 3 | 4;
    periodeAnnees: number;
  };
  history: CalculationHistoryEntry[];
}

export interface FullProjectState {
  metadata: ProjectMetadata;
  deversNormal: {
    category: RoadCategory;
    isInterurbaine110: boolean;
    radiusR: number;
  };
  deversRD: {
    radiusR: number;
    longitudinalSlopeP: number;
    hasSnowOrFrost: boolean;
    userReducedDevers?: number;
  };
  clothoideNormal: {
    crossSectionType: '2 voies' | '3 voies' | '2x2 voies';
    radiusR: number;
    widthL: number;
    deltaDevers: number;
    category: RoadCategory;
    isInterurbaine110: boolean;
  };
  clothoideRD: {
    crossSectionType: '2 voies' | '3 voies' | '2x2 voies';
    radiusR: number;
    widthL: number;
    deltaDevers: number;
    proposedReducedLength?: number;
    exactLg?: number;
    deversAtPoint: number;
    longitudinalSlope: number;
  };
  surlargeur: {
    innerRadiusR: number;
    normalLaneWidth: number;
    isDifficultRelief: boolean;
  };
  largeurRoulable: {
    functionLevel: 'eleve' | 'intermediaire' | 'modere';
    tmja: number;
    heavyVehiclesPL: number;
  };
  traceEnPlan: {
    v85Kmh: number;
    elements: TraceEnPlanElement[];
  };
  profilEnLong: {
    v85Kmh: number;
    elements: ProfilEnLongElement[];
  };
  history: CalculationHistoryEntry[];
}

export interface FullIctaalProjectState {
  metadata: IctaalProjectMetadata;
  devers: {
    category: IctaalCategory;
    radiusR: number;
    isWinterSnowFrostZone: boolean;
  };
  clothoide: {
    category: IctaalCategory;
    radiusR: number;
    deltaDevers: number;
    isRamp: boolean;
  };
  profilTravers: {
    category: IctaalCategory;
    crossSection: IctaalCrossSection;
    heavyVehiclesDailyPL: number;
    bandeMedianeWidthM: number;
    bermeWidthM: number;
  };
  interchange: {
    type: 'DECELERATION' | 'ACCELERATION' | 'BRETELLE_COURBE';
    category: IctaalCategory;
    slopePercent: number;
    targetSpeedKmh: number;
    radiusCurveM: number;
  };
  profilLong: {
    category: IctaalCategory;
    slopePercent: number;
    verticalRadiusM: number;
    isSaillant: boolean;
  };
  vsvl: {
    slopePercent: number;
    slopeLengthM: number;
    isRampe: boolean;
    speedPlEstimatedKmh: number;
    deniveleeDeltaM: number;
  };
  history: CalculationHistoryEntry[];
}

export function getPersonalizedArpInitialState(user?: { id?: string; name?: string; jobTitle?: string; organization?: string } | null): FullProjectState {
  const engineerTitle = user?.name ? (user.jobTitle ? `${user.jobTitle} ${user.name}` : user.name) : 'Ingénieur d\'études Routières';
  const firm = user?.organization || 'Cabinet d\'Ingénierie Géométrique & Routière';
  return {
    metadata: {
      id: `proj-arp-${Date.now()}`,
      name: 'Aménagement RD 904 - Section Évitement',
      dossierNumber: 'BE-2026-ARP-09',
      client: 'Conseil Départemental - Direction des Infrastructures',
      consultingFirm: firm,
      leadEngineer: engineerTitle,
      date: new Date().toISOString().slice(0, 10),
      version: '1.0 - Phase PRO',
      description: 'Étude d\'aménagement géométrique de la route principale selon le guide ARP du Cerema (Édition Août 2022). Vérification des lois de dévers, dimensionnement des clothoïdes et contrôle de coordination tracé/profil.',
      technicalNotes: 'Projet intégrant le basculement de dévers en section courante et les adaptations spécifiques en relief difficile (§ 6 ARP).',
      category: 'R1',
      roadType: '4.1',
      functionLevel: 'intermediaire',
      speedLimitKmh: 80,
      tmja: 2500,
      plDaily: 150,
      isWinterSnowFrostZone: false,
      isDifficultReliefSite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    deversNormal: {
      category: 'R1',
      isInterurbaine110: false,
      radiusR: 300
    },
    deversRD: {
      radiusR: 200,
      longitudinalSlopeP: 4.0,
      hasSnowOrFrost: false,
      userReducedDevers: undefined
    },
    clothoideNormal: {
      crossSectionType: '2 voies',
      radiusR: 300,
      widthL: 7.00,
      deltaDevers: 4.50,
      category: 'R1',
      isInterurbaine110: false
    },
    clothoideRD: {
      crossSectionType: '2 voies',
      radiusR: 150,
      widthL: 7.00,
      deltaDevers: 4.50,
      proposedReducedLength: undefined,
      exactLg: undefined,
      deversAtPoint: 5.0,
      longitudinalSlope: 4.0
    },
    surlargeur: {
      innerRadiusR: 100,
      normalLaneWidth: 3.50,
      isDifficultRelief: true
    },
    largeurRoulable: {
      functionLevel: 'intermediaire',
      tmja: 2500,
      heavyVehiclesPL: 150
    },
    traceEnPlan: {
      v85Kmh: 80,
      elements: [
        { id: 'tp-1', type: 'ALIGNEMENT', lengthM: 450, cumulPkStart: 0, cumulPkEnd: 450 },
        { id: 'tp-2', type: 'CLOTHOIDE', lengthM: 63, parameterA: 137.5, cumulPkStart: 450, cumulPkEnd: 513 },
        { id: 'tp-3', type: 'COURBE', lengthM: 180, radiusM: 300, direction: 'DROITE', cumulPkStart: 513, cumulPkEnd: 693 },
        { id: 'tp-4', type: 'CLOTHOIDE', lengthM: 63, parameterA: 137.5, cumulPkStart: 693, cumulPkEnd: 756 },
        { id: 'tp-5', type: 'ALIGNEMENT', lengthM: 320, cumulPkStart: 756, cumulPkEnd: 1076 }
      ]
    },
    profilEnLong: {
      v85Kmh: 80,
      elements: [
        { id: 'pl-1', type: 'DECLIVITE', slopePercent: 2.5, lengthM: 400, startZ: 142.0, endZ: 152.0, cumulPkStart: 0, cumulPkEnd: 400 },
        { id: 'pl-2', type: 'RACCORDEMENT_SAILLANT', verticalRadiusM: 3500, lengthM: 150, startZ: 152.0, endZ: 154.5, cumulPkStart: 400, cumulPkEnd: 550 },
        { id: 'pl-3', type: 'DECLIVITE', slopePercent: -1.8, lengthM: 526, startZ: 154.5, endZ: 145.0, cumulPkStart: 550, cumulPkEnd: 1076 }
      ]
    },
    history: [
      {
        id: 'hist-init',
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        moduleName: 'Initialisation du projet',
        summary: 'Initialisation personnalisée selon référentiel géométrique ARP CEREMA 2022',
        paramsSnapshot: { category: 'R1', roadType: '4.1', tmja: 2500 },
        resultsSnapshot: { deversNormal: '3.18%', clothoideL: '63.00 m' }
      }
    ]
  };
}

export function getPersonalizedIctaalInitialState(user?: { id?: string; name?: string; jobTitle?: string; organization?: string } | null): FullIctaalProjectState {
  const engineerTitle = user?.name ? (user.jobTitle ? `${user.jobTitle} ${user.name}` : user.name) : 'Ingénieur d\'études Autoroutières';
  const firm = user?.organization || 'Société d\'Ingénierie des Autoroutes & Voies Rapides';
  return {
    metadata: {
      id: `proj-ictaal-${Date.now()}`,
      name: 'Liaison Autoroutière A-350 - Contournement Sud',
      dossierNumber: 'BE-2026-ICTAAL-01',
      client: 'Direction Générale des Infrastructures de Transport (DGITM)',
      consultingFirm: firm,
      leadEngineer: engineerTitle,
      date: new Date().toISOString().slice(0, 10),
      version: '1.0 - Phase Avant-Projet',
      description: 'Conception géométrique d\'une autoroute de liaison 2x2 voies selon l\'instruction ICTAAL 2015/2021 (Cerema). Vérification des rayons L1/L2, raccordements par clothoïdes, BAU 3m et échangeur de raccordement.',
      technicalNotes: 'Dimensionnement en catégorie L1 (130 km/h) avec sections de décélération de bretelles et zone de sécurité latérale de 10 m.',
      category: 'L1',
      crossSection: '2x2',
      speedLimitKmh: 130,
      tmja: 28000,
      plDaily: 2400,
      isWinterSnowFrostZone: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    devers: {
      category: 'L1',
      radiusR: 800,
      isWinterSnowFrostZone: false
    },
    clothoide: {
      category: 'L1',
      radiusR: 800,
      deltaDevers: 5.5,
      isRamp: false
    },
    profilTravers: {
      category: 'L1',
      crossSection: '2x2',
      heavyVehiclesDailyPL: 2400,
      bandeMedianeWidthM: 3.0,
      bermeWidthM: 1.0
    },
    interchange: {
      type: 'DECELERATION',
      category: 'L1',
      slopePercent: -2.0,
      targetSpeedKmh: 50,
      radiusCurveM: 80
    },
    profilLong: {
      category: 'L1',
      slopePercent: 3.5,
      verticalRadiusM: 10000,
      isSaillant: true
    },
    vsvl: {
      slopePercent: 4.5,
      slopeLengthM: 1200,
      isRampe: true,
      speedPlEstimatedKmh: 42,
      deniveleeDeltaM: 54
    },
    history: [
      {
        id: 'hist-ictaal-init',
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        moduleName: 'Initialisation Projet Autoroutier',
        summary: 'Création du projet selon l\'Instruction ICTAAL 2015/2021 (Cerema)',
        paramsSnapshot: { category: 'L1', crossSection: '2x2', VMA: 130 },
        resultsSnapshot: { Rm: '600 m', Rdn: '1000 m', BAU: '3.00 m' }
      }
    ]
  };
}

export const INITIAL_PROJECT_STATE: FullProjectState = getPersonalizedArpInitialState(null);
export const INITIAL_ICTAAL_PROJECT_STATE: FullIctaalProjectState = getPersonalizedIctaalInitialState(null);

export function getPersonalizedCarrefoursInitialState(user?: { id?: string; name?: string; jobTitle?: string; organization?: string } | null): FullCarrefourProjectState {
  const engineerTitle = user?.name ? (user.jobTitle ? `${user.jobTitle} ${user.name}` : user.name) : 'Ingénieur d\'études Ouvrages & Carrefours';
  const firm = user?.organization || 'Direction de l\'Ingénierie des Nœuds Routiers';
  return {
    metadata: {
      id: `proj-carrefour-${Date.now()}`,
      name: 'Aménagement du Carrefour RD 904 / RD 12 - Nœud Nord',
      dossierNumber: 'BE-2026-CARREFOUR-01',
      client: 'Conseil Départemental & Direction des Routes',
      consultingFirm: firm,
      leadEngineer: engineerTitle,
      date: new Date().toISOString().slice(0, 10),
      version: '1.0 - Phase PRO / Étude de Sécurité',
      description: 'Conception géométrique d\'aménagement de carrefour interurbain selon le Guide Technique SETRA (Décembre 1998 / Cerema). Étude comparative de sécurité, visibilité au franchissement, aménagement de tourne-à-gauche ou carrefour giratoire.',
      technicalNotes: 'Vérification du triangle de visibilité (recul 4m), dimensionnement de la poche de stockage TAG et contrôle de la déflexion giratoire.',
      carrefourType: 'GIRATOIRE',
      routePrincipaleType: '2_VOIES',
      v85Kmh: 80,
      regimePriorite: 'CEDEZ_LE_PASSAGE',
      tmjaPrincipal: 6200,
      tmjaSecondaire: 1400,
      proportionPL: 0.10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    visibilite: {
      v85Kmh: 80,
      regimePriorite: 'CEDEZ_LE_PASSAGE',
      routePrincipaleType: '2_VOIES',
      hasRampeSup2Percent: false,
      reculObservationM: 4.0
    },
    tourneAGauche: {
      largeurChausséeCouranteM: 7.0,
      traficTournantGaucheVj: 240,
      isPLSignificatif: false,
      vitesseV85Kmh: 80
    },
    giratoire: {
      rayonGiratoireRgM: 20,
      nombreVoiesEntree: 1,
      hasTraficPLImportant: true
    },
    capacite: {
      traficEntrantQe: 450,
      traficSortantQs: 380,
      traficTournantQt: 320,
      largeurAnneauEllA: 7.0,
      largeurEntreeEllE: 4.0
    },
    accidentologie: {
      traficPrincipalTp: 6200,
      traficSecondaireTs: 1400,
      nombreBranches: 4,
      periodeAnnees: 5
    },
    history: [
      {
        id: 'hist-carrefour-init',
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        moduleName: 'Initialisation Projet Carrefour',
        summary: 'Création du projet selon le Guide Sétra Carrefours Interurbains (Réf. B 9836)',
        paramsSnapshot: { type: 'GIRATOIRE', Rg: 20, V85: 80 },
        resultsSnapshot: { Rg: '20 m', Anneau: '7.00 m', CollerettePL: '2.00 m', Deflexion: 'Conforme (< 100m)' }
      }
    ]
  };
}

export const INITIAL_CARREFOURS_PROJECT_STATE: FullCarrefourProjectState = getPersonalizedCarrefoursInitialState(null);

export function getPersonalizedEchangeursInitialState(user?: { name?: string; jobTitle?: string; organization?: string } | null): FullEchangeurProjectState {
  const engineerName = user?.name ? `${user.jobTitle || 'Ingénieur'} ${user.name}` : 'Ingénieur Études Ouvrages & Échangeurs';
  const firm = user?.organization || 'Direction de l\'Infrastructure et des Transports';
  return {
    metadata: {
      id: 'proj-ech-001',
      name: 'Diffuseur Autoroutier A10 / RD 910',
      dossierNumber: 'ECH-2026-A10-D04',
      client: 'Société Concessionnaire d\'Autoroutes (SCA) / DIR',
      consultingFirm: firm,
      leadEngineer: engineerName,
      date: new Date().toISOString().slice(0, 10),
      version: '1.0',
      description: 'Étude d\'aménagement d\'un diffuseur dénivelé complet selon le Guide Cerema Échangeurs sur routes de type autoroute (Éd. 2015).',
      technicalNotes: 'Conception des branches, voies de décélération/insertion, vérification d\'entrecroisement et sécurisation des divergents.',
      echangeurType: 'DIFFUSEUR',
      vitesseAutorouteKmh: 130,
      vitesseBrancheKmh: 70,
      nombreVoiesSectionCourante: 3,
      traficTransitT: 3200,
      traficSortantS: 580,
      traficEntrantE: 490,
      isReliefDifficile: false,
      isVerglasZone: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    deceleration: {
      vitesseAutorouteKmh: 130,
      vitesseCibleVrKmh: 70,
      decliviteP: -1.5,
      typeSortie: 'Sd1_1'
    },
    acceleration: {
      vitesseAutorouteKmh: 130,
      vitesseInitialeVrKmh: 65,
      decliviteP: 1.0,
      typeEntree: 'Ei1'
    },
    bretelle: {
      vitesseBrancheKmh: 70,
      radiusM: 180,
      nombreVoies: 1,
      isVerglasZone: false,
      isReliefDifficile: false
    },
    divergent: {
      obliquitePercent: 4,
      largeurTplM: 0.375
    },
    entrecroisement: {
      distanceReelleZM: 850,
      vitesseAutorouteKmh: 130,
      traficTransitT: 3200,
      traficEntrecroise1: 450,
      traficEntrecroise2: 380
    },
    typologie: {
      natureIntersection: 'AUTOROUTE_ROUTE_SECONDAIRE',
      traficEchangeTotal: 1070,
      contrainteEmprise: 'MOYENNE',
      presencePeage: false
    },
    history: [
      {
        id: 'hist-ech-init',
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
        moduleName: 'Initialisation Projet Échangeur',
        summary: 'Création du projet selon le Guide Cerema Échangeurs sur routes de type autoroute',
        paramsSnapshot: { type: 'DIFFUSEUR', V_autoroute: 130, V_branche: 70 },
        resultsSnapshot: { Sortie: 'Sd1_1 (Ld = 120m + biseau 150m)', Entree: 'Ei1 (La = 200m + biseau 75m)', Devers: '5.2%', Statut: 'Conforme Cerema' }
      }
    ]
  };
}

export const INITIAL_ECHANGEURS_PROJECT_STATE: FullEchangeurProjectState = getPersonalizedEchangeursInitialState(null);

const getArpStorageKey = (userId?: string) => userId ? `arp_project_state_user_${userId}` : 'arp_road_design_state_v1';
const getIctaalStorageKey = (userId?: string) => userId ? `ictaal_project_state_user_${userId}` : 'ictaal_highway_design_state_v1';
const getCarrefoursStorageKey = (userId?: string) => userId ? `carrefours_project_state_user_${userId}` : 'carrefours_interurbains_design_state_v1';
const getEchangeursStorageKey = (userId?: string) => userId ? `echangeurs_project_state_user_${userId}` : 'echangeurs_cerema_design_state_v1';

export function loadProjectState(user?: { id?: string; name?: string; jobTitle?: string; organization?: string } | null): FullProjectState {
  try {
    const key = getArpStorageKey(user?.id);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return getPersonalizedArpInitialState(user);
    }
    const parsed = JSON.parse(raw);
    if (!parsed.metadata || !parsed.deversNormal) {
      return getPersonalizedArpInitialState(user);
    }
    return parsed;
  } catch {
    return getPersonalizedArpInitialState(user);
  }
}

export function saveProjectState(state: FullProjectState, userId?: string): void {
  try {
    const key = getArpStorageKey(userId);
    const stateToSave = {
      ...state,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    localStorage.setItem(key, JSON.stringify(stateToSave));
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du projet ARP dans localStorage', err);
  }
}

export function loadIctaalProjectState(user?: { id?: string; name?: string; jobTitle?: string; organization?: string } | null): FullIctaalProjectState {
  try {
    const key = getIctaalStorageKey(user?.id);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return getPersonalizedIctaalInitialState(user);
    }
    const parsed = JSON.parse(raw);
    if (!parsed.metadata || !parsed.devers) {
      return getPersonalizedIctaalInitialState(user);
    }
    return parsed;
  } catch {
    return getPersonalizedIctaalInitialState(user);
  }
}

export function saveIctaalProjectState(state: FullIctaalProjectState, userId?: string): void {
  try {
    const key = getIctaalStorageKey(userId);
    const stateToSave = {
      ...state,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    localStorage.setItem(key, JSON.stringify(stateToSave));
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du projet ICTAAL dans localStorage', err);
  }
}

export function loadCarrefoursProjectState(user?: { id?: string; name?: string; jobTitle?: string; organization?: string } | null): FullCarrefourProjectState {
  try {
    const key = getCarrefoursStorageKey(user?.id);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return getPersonalizedCarrefoursInitialState(user);
    }
    const parsed = JSON.parse(raw);
    if (!parsed.metadata || !parsed.giratoire) {
      return getPersonalizedCarrefoursInitialState(user);
    }
    return parsed;
  } catch {
    return getPersonalizedCarrefoursInitialState(user);
  }
}

export function saveCarrefoursProjectState(state: FullCarrefourProjectState, userId?: string): void {
  try {
    const key = getCarrefoursStorageKey(userId);
    const stateToSave = {
      ...state,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    localStorage.setItem(key, JSON.stringify(stateToSave));
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du projet Carrefours dans localStorage', err);
  }
}

export function loadEchangeursProjectState(user?: { id?: string; name?: string; jobTitle?: string; organization?: string } | null): FullEchangeurProjectState {
  try {
    const key = getEchangeursStorageKey(user?.id);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return getPersonalizedEchangeursInitialState(user);
    }
    const parsed = JSON.parse(raw);
    if (!parsed.metadata || !parsed.deceleration) {
      return getPersonalizedEchangeursInitialState(user);
    }
    return parsed;
  } catch {
    return getPersonalizedEchangeursInitialState(user);
  }
}

export function saveEchangeursProjectState(state: FullEchangeurProjectState, userId?: string): void {
  try {
    const key = getEchangeursStorageKey(userId);
    const stateToSave = {
      ...state,
      metadata: {
        ...state.metadata,
        updatedAt: new Date().toISOString()
      }
    };
    localStorage.setItem(key, JSON.stringify(stateToSave));
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du projet Échangeurs dans localStorage', err);
  }
}

export function exportProjectToJson(
  state: FullProjectState | FullIctaalProjectState | FullCarrefourProjectState | FullEchangeurProjectState,
  prefix: string = 'Projet_Routier'
): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  const filename = `${prefix}_${(state.metadata.dossierNumber || 'Etude').replace(/[^a-zA-Z0-9_-]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportTableToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csvContent = 'data:text/csv;charset=utf-8,' + [
    headers.join(';'),
    ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
  ].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
