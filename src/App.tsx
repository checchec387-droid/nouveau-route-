import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  FullProjectState,
  FullIctaalProjectState,
  FullCarrefourProjectState,
  FullEchangeurProjectState,
  loadProjectState,
  saveProjectState,
  loadIctaalProjectState,
  saveIctaalProjectState,
  loadCarrefoursProjectState,
  saveCarrefoursProjectState,
  loadEchangeursProjectState,
  saveEchangeursProjectState,
  exportProjectToJson
} from './utils/storage';
import {
  runGlobalProjectAudit,
  calculateDeversNormal,
  calculateDeversReliefDifficile,
  calculateClothoideNormal
} from './utils/arpCalculations';

// Layout & Common Components
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AuthPortal } from './components/auth/AuthPortal';
import { AdminConsoleModule } from './components/admin/AdminConsoleModule';
import { NormSelectorModal } from './components/modules/NormSelectorModal';

// ARP Modules
import { DashboardModule } from './components/modules/DashboardModule';
import { ProjectSettingsModule } from './components/modules/ProjectSettingsModule';
import { ReferenceDataModule } from './components/modules/ReferenceDataModule';
import { DeversNormalModule } from './components/modules/DeversNormalModule';
import { DeversReliefDifficileModule } from './components/modules/DeversReliefDifficileModule';
import { ClothoideNormalModule } from './components/modules/ClothoideNormalModule';
import { ClothoideReliefDifficileModule } from './components/modules/ClothoideReliefDifficileModule';
import { SurlargeurLacetModule } from './components/modules/SurlargeurLacetModule';
import { LargeurRoulableModule } from './components/modules/LargeurRoulableModule';
import { TraceEnPlanModule } from './components/modules/TraceEnPlanModule';
import { ProfilEnLongModule } from './components/modules/ProfilEnLongModule';
import { ProfilEnTraversModule } from './components/modules/ProfilEnTraversModule';
import { GlobalComplianceModule } from './components/modules/GlobalComplianceModule';
import { VisualizationsModule } from './components/modules/VisualizationsModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { HistoryModule } from './components/modules/HistoryModule';
import { DocumentationModule } from './components/modules/DocumentationModule';

// ICTAAL Modules
import { IctaalDashboardModule } from './components/modules/ictaal/IctaalDashboardModule';
import { IctaalDeversModule } from './components/modules/ictaal/IctaalDeversModule';
import { IctaalClothoideModule } from './components/modules/ictaal/IctaalClothoideModule';
import { IctaalProfilTraversModule } from './components/modules/ictaal/IctaalProfilTraversModule';
import { IctaalInterchangeModule } from './components/modules/ictaal/IctaalInterchangeModule';
import { IctaalProfilLongModule } from './components/modules/ictaal/IctaalProfilLongModule';
import { IctaalComplianceModule } from './components/modules/ictaal/IctaalComplianceModule';

// Carrefours Interurbains Modules
import { CarrefoursDashboardModule } from './components/modules/carrefours/CarrefoursDashboardModule';
import { CarrefoursTourneAGaucheModule } from './components/modules/carrefours/CarrefoursTourneAGaucheModule';
import { CarrefoursGiratoireModule } from './components/modules/carrefours/CarrefoursGiratoireModule';
import { CarrefoursVisibiliteModule } from './components/modules/carrefours/CarrefoursVisibiliteModule';
import { CarrefoursComplianceModule } from './components/modules/carrefours/CarrefoursComplianceModule';

// Guide des Échangeurs Cerema
import { EchangeursDashboardModule } from './components/modules/echangeurs/EchangeursDashboardModule';
import { EchangeursSortieModule } from './components/modules/echangeurs/EchangeursSortieModule';
import { EchangeursEntreeModule } from './components/modules/echangeurs/EchangeursEntreeModule';
import { EchangeursBretellesModule } from './components/modules/echangeurs/EchangeursBretellesModule';
import { EchangeursEntrecroisementModule } from './components/modules/echangeurs/EchangeursEntrecroisementModule';
import { EchangeursComplianceModule } from './components/modules/echangeurs/EchangeursComplianceModule';

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  const [currentStandard, setCurrentStandard] = useState<'ARP' | 'ICTAAL' | 'CARREFOURS_INTERURBAINS' | 'ECHANGEURS'>(() => {
    const saved = localStorage.getItem('current_standard');
    if (saved === 'ICTAAL') return 'ICTAAL';
    if (saved === 'CARREFOURS_INTERURBAINS') return 'CARREFOURS_INTERURBAINS';
    if (saved === 'ECHANGEURS') return 'ECHANGEURS';
    return 'ARP';
  });
  const [isNormSelectorOpen, setIsNormSelectorOpen] = useState<boolean>(() => {
    return !localStorage.getItem('current_standard');
  });

  const [projectState, setProjectState] = useState<FullProjectState>(() => loadProjectState(user));
  const [ictaalState, setIctaalState] = useState<FullIctaalProjectState>(() => loadIctaalProjectState(user));
  const [carrefoursState, setCarrefoursState] = useState<FullCarrefourProjectState>(() => loadCarrefoursProjectState(user));
  const [echangeursState, setEchangeursState] = useState<FullEchangeurProjectState>(() => loadEchangeursProjectState(user));

  const [activeModule, setActiveModule] = useState<string>(() => {
    const savedStd = localStorage.getItem('current_standard');
    if (savedStd === 'ICTAAL') return 'ictaal-dashboard';
    if (savedStd === 'CARREFOURS_INTERURBAINS') return 'carrefour-dashboard';
    if (savedStd === 'ECHANGEURS') return 'echangeurs-dashboard';
    return 'dashboard';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSelectStandard = (std: 'ARP' | 'ICTAAL' | 'CARREFOURS_INTERURBAINS' | 'ECHANGEURS') => {
    setCurrentStandard(std);
    localStorage.setItem('current_standard', std);
    setIsNormSelectorOpen(false);
    if (std === 'ARP') setActiveModule('dashboard');
    else if (std === 'ICTAAL') setActiveModule('ictaal-dashboard');
    else if (std === 'CARREFOURS_INTERURBAINS') setActiveModule('carrefour-dashboard');
    else setActiveModule('echangeurs-dashboard');
  };

  const handleManualSave = () => {
    if (currentStandard === 'ARP') saveProjectState(projectState, user?.id);
    else if (currentStandard === 'ICTAAL') saveIctaalProjectState(ictaalState, user?.id);
    else if (currentStandard === 'CARREFOURS_INTERURBAINS') saveCarrefoursProjectState(carrefoursState, user?.id);
    else saveEchangeursProjectState(echangeursState, user?.id);
    showToast('Projet sauvegardé');
  };

  const resDeversNormal = calculateDeversNormal(projectState.deversNormal);
  const resDeversRD = calculateDeversReliefDifficile(projectState.deversRD);
  const resClothNormal = calculateClothoideNormal(projectState.clothoideNormal);

  const alerts = runGlobalProjectAudit({
    category: projectState.metadata.category,
    isInterurbaine110: projectState.deversNormal.isInterurbaine110,
    radiusNormal: projectState.deversNormal.radiusR,
    radiusRD: projectState.deversRD.radiusR,
    deversNormal: resDeversNormal.calculatedDevers,
    deversRD: resDeversRD.adoptedDevers,
    longitudinalSlopeRD: projectState.deversRD.longitudinalSlopeP,
    clothoideNormalLength: resClothNormal.lengthL,
    minShiftRDLength: 31.5,
    tmja: projectState.metadata.tmja,
    plDaily: projectState.metadata.plDaily,
    traceElements: projectState.traceEnPlan.elements,
    profilElements: projectState.profilEnLong.elements
  });

  const criticalCount = alerts.filter(a => a.level === 'CRITIQUE').length;
  const warningCount = alerts.filter(a => a.level === 'MAJEUR' || a.level === 'AVERTISSEMENT').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Chargement sécurisé de RoadDesign Studio...</span>
        </div>
      </div>
    );
  }

  if (!user || user.status !== 'APPROVED') {
    return (
      <AuthPortal
        initialView="login"
        onAdminLogin={() => setActiveModule('admin-console')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <div className="no-print">
        <Navbar
          currentStandard={currentStandard}
          onOpenNormSelector={() => setIsNormSelectorOpen(true)}
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          metadata={
            currentStandard === 'ARP'
              ? projectState.metadata
              : currentStandard === 'ICTAAL'
              ? ictaalState.metadata
              : currentStandard === 'CARREFOURS_INTERURBAINS'
              ? carrefoursState.metadata
              : echangeursState.metadata
          }
          onSave={handleManualSave}
          openReports={() => setActiveModule('reports')}
        />
      </div>

      {isNormSelectorOpen && (
        <NormSelectorModal
          currentStandard={currentStandard}
          onSelectStandard={handleSelectStandard}
          onClose={() => setIsNormSelectorOpen(false)}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg">
          {toastMessage}
        </div>
      )}

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <div className="no-print">
          <Sidebar
            currentStandard={currentStandard}
            onOpenNormSelector={() => setIsNormSelectorOpen(true)}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            alertCount={{ critical: criticalCount, warning: warningCount }}
          />
        </div>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeModule === 'admin-console' && isAdmin && (
            <AdminConsoleModule />
          )}

          {currentStandard === 'ARP' && (
            <>
              {activeModule === 'dashboard' && (
                <DashboardModule
                  projectState={projectState}
                  setActiveModule={setActiveModule}
                  openReports={() => setActiveModule('reports')}
                  onOpenNormSelector={() => setIsNormSelectorOpen(true)}
                />
              )}
              {activeModule === 'project-settings' && (
                <ProjectSettingsModule
                  metadata={projectState.metadata}
                  onChange={(newMeta) => setProjectState(prev => ({ ...prev, metadata: newMeta }))}
                  onSave={handleManualSave}
                  onExportJson={() => exportProjectToJson(projectState)}
                  onImportJson={(f) => {}}
                  onResetToDefault={() => {}}
                />
              )}
              {activeModule === 'reference-data' && <ReferenceDataModule />}
              {activeModule === 'devers-normal' && (
                <DeversNormalModule
                  data={projectState.deversNormal}
                  onChange={(newD) => setProjectState(prev => ({ ...prev, deversNormal: newD }))}
                />
              )}
              {activeModule === 'devers-rd' && (
                <DeversReliefDifficileModule
                  data={projectState.deversRD}
                  onChange={(newD) => setProjectState(prev => ({ ...prev, deversRD: newD }))}
                />
              )}
              {activeModule === 'clothoide-normal' && (
                <ClothoideNormalModule
                  data={projectState.clothoideNormal}
                  onChange={(newD) => setProjectState(prev => ({ ...prev, clothoideNormal: newD }))}
                />
              )}
              {activeModule === 'clothoide-rd' && (
                <ClothoideReliefDifficileModule
                  data={projectState.clothoideRD}
                  onChange={(newD) => setProjectState(prev => ({ ...prev, clothoideRD: newD }))}
                />
              )}
              {activeModule === 'surlargeur-lacet' && (
                <SurlargeurLacetModule
                  data={projectState.surlargeur}
                  onChange={(newD) => setProjectState(prev => ({ ...prev, surlargeur: newD }))}
                />
              )}
              {activeModule === 'largeur-roulable' && (
                <LargeurRoulableModule
                  data={projectState.largeurRoulable}
                  onChange={(newD) => setProjectState(prev => ({ ...prev, largeurRoulable: newD }))}
                />
              )}
              {activeModule === 'trace-en-plan' && (
                <TraceEnPlanModule
                  category={projectState.metadata.category}
                  isInterurbaine110={projectState.deversNormal.isInterurbaine110}
                  data={projectState.traceEnPlan}
                  onChange={(newD) => setProjectState(prev => ({ ...prev, traceEnPlan: newD }))}
                />
              )}
              {activeModule === 'profil-en-long' && (
                <ProfilEnLongModule
                  category={projectState.metadata.category}
                  isInterurbaine110={projectState.deversNormal.isInterurbaine110}
                  data={projectState.profilEnLong}
                  onChange={(newD) => setProjectState(prev => ({ ...prev, profilEnLong: newD }))}
                />
              )}
              {activeModule === 'profil-en-travers' && (
                <ProfilEnTraversModule
                  roadType={projectState.metadata.roadType}
                  functionLevel={projectState.metadata.functionLevel}
                />
              )}
              {activeModule === 'compliance' && (
                <GlobalComplianceModule
                  projectState={projectState}
                  setActiveModule={setActiveModule}
                />
              )}
              {activeModule === 'visualizations' && (
                <VisualizationsModule projectState={projectState} />
              )}
              {activeModule === 'reports' && (
                <ReportsModule projectState={projectState} />
              )}
              {activeModule === 'history' && (
                <HistoryModule
                  history={projectState.history}
                  onClearHistory={() => setProjectState(prev => ({ ...prev, history: [] }))}
                />
              )}
              {activeModule === 'documentation' && <DocumentationModule />}
            </>
          )}

          {currentStandard === 'ICTAAL' && (
            <>
              {activeModule === 'ictaal-dashboard' && (
                <IctaalDashboardModule
                  projectState={ictaalState}
                  setActiveModule={setActiveModule}
                  openReports={() => setActiveModule('ictaal-compliance')}
                  onOpenNormSelector={() => setIsNormSelectorOpen(true)}
                />
              )}
              {activeModule === 'ictaal-devers' && <IctaalDeversModule />}
              {activeModule === 'ictaal-clothoide' && <IctaalClothoideModule />}
              {activeModule === 'ictaal-travers' && <IctaalProfilTraversModule />}
              {activeModule === 'ictaal-interchange' && <IctaalInterchangeModule />}
              {activeModule === 'ictaal-profil-long' && <IctaalProfilLongModule />}
              {activeModule === 'ictaal-compliance' && <IctaalComplianceModule />}
            </>
          )}

          {currentStandard === 'CARREFOURS_INTERURBAINS' && (
            <>
              {activeModule === 'carrefour-dashboard' && (
                <CarrefoursDashboardModule
                  projectState={carrefoursState}
                  setActiveModule={setActiveModule}
                  openReports={() => setActiveModule('carrefour-compliance')}
                  onOpenNormSelector={() => setIsNormSelectorOpen(true)}
                />
              )}
              {activeModule === 'carrefour-giratoire' && <CarrefoursGiratoireModule />}
              {activeModule === 'carrefour-tag' && <CarrefoursTourneAGaucheModule />}
              {activeModule === 'carrefour-visibilite' && <CarrefoursVisibiliteModule />}
              {activeModule === 'carrefour-compliance' && <CarrefoursComplianceModule />}
            </>
          )}

          {currentStandard === 'ECHANGEURS' && (
            <>
              {activeModule === 'echangeurs-dashboard' && (
                <EchangeursDashboardModule
                  projectState={echangeursState}
                  onNavigate={setActiveModule}
                  onOpenNormSelector={() => setIsNormSelectorOpen(true)}
                />
              )}
              {activeModule === 'echangeurs-sortie' && <EchangeursSortieModule />}
              {activeModule === 'echangeurs-entree' && <EchangeursEntreeModule />}
              {activeModule === 'echangeurs-bretelles' && <EchangeursBretellesModule />}
              {activeModule === 'echangeurs-entrecroisement' && <EchangeursEntrecroisementModule />}
              {activeModule === 'echangeurs-compliance' && (
                <EchangeursComplianceModule
                  projectState={echangeursState}
                  onNavigate={setActiveModule}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
