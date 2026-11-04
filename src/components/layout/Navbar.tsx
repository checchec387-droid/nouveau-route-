import React from 'react';
import { ProjectMetadata } from '../../types/arp';
import { IctaalProjectMetadata } from '../../types/ictaal';
import { CarrefourProjectMetadata } from '../../types/carrefour';
import { EchangeurProjectMetadata } from '../../types/echangeurs';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Save,
  ShieldCheck,
  LogOut,
  Award,
  GraduationCap,
  Briefcase,
  ArrowRightLeft
} from 'lucide-react';

interface Props {
  currentStandard: 'ARP' | 'ICTAAL' | 'CARREFOURS_INTERURBAINS' | 'ECHANGEURS';
  onOpenNormSelector: () => void;
  activeModule: string;
  setActiveModule: (m: string) => void;
  metadata: ProjectMetadata | IctaalProjectMetadata | CarrefourProjectMetadata | EchangeurProjectMetadata;
  onSave: () => void;
  openReports: () => void;
  pendingCount?: number;
}

export const Navbar: React.FC<Props> = ({
  currentStandard,
  onOpenNormSelector,
  activeModule,
  setActiveModule,
  onSave,
  openReports,
  pendingCount = 0
}) => {
  const { user, logout, isAdmin } = useAuth();

  const getJobIcon = (jobTitle?: string) => {
    if (jobTitle === 'Expert') return <Award className="w-3.5 h-3.5 text-purple-600" />;
    if (jobTitle === 'Étudiant') return <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />;
    return <Briefcase className="w-3.5 h-3.5 text-sky-600" />;
  };

  const getBrandBadgeColor = () => {
    if (currentStandard === 'ARP') return 'bg-sky-900';
    if (currentStandard === 'ICTAAL') return 'bg-emerald-800';
    if (currentStandard === 'CARREFOURS_INTERURBAINS') return 'bg-amber-600';
    return 'bg-indigo-900';
  };

  const getBrandSubtitle = () => {
    if (currentStandard === 'ARP') return "Conception Géométrique des Routes Principales (ARP 2022)";
    if (currentStandard === 'ICTAAL') return "Aménagement des Autoroutes de Liaison (ICTAAL 2015/2021)";
    if (currentStandard === 'CARREFOURS_INTERURBAINS') return "Aménagement des Carrefours Interurbains (Guide SETRA / Cerema)";
    return "Aménagement des Échangeurs sur Autoroutes (Guide Cerema Éd. 2015)";
  };

  const getHomeModule = () => {
    if (currentStandard === 'ARP') return 'dashboard';
    if (currentStandard === 'ICTAAL') return 'ictaal-dashboard';
    if (currentStandard === 'CARREFOURS_INTERURBAINS') return 'carrefour-dashboard';
    return 'echangeurs-dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between gap-4 px-6 py-2.5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveModule(getHomeModule())}
            className="flex items-center gap-2.5 text-left focus:outline-hidden cursor-pointer"
          >
            <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-black text-sm tracking-wider shadow-xs ${getBrandBadgeColor()}`}>
              {currentStandard === 'CARREFOURS_INTERURBAINS' ? 'CI' : currentStandard === 'ECHANGEURS' ? 'ECH' : 'RD'}
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900 whitespace-nowrap block">
                RoadDesign Studio Pro
              </span>
              <span className="text-[11px] text-slate-500 whitespace-nowrap block font-medium">
                {getBrandSubtitle()}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenNormSelector}
            title="Changer de référentiel technique (ARP / ICTAAL / Carrefours / Échangeurs)"
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
              currentStandard === 'ARP'
                ? 'bg-sky-50 border-sky-300 text-sky-950 hover:bg-sky-100'
                : currentStandard === 'ICTAAL'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100'
                : currentStandard === 'CARREFOURS_INTERURBAINS'
                ? 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100'
                : 'bg-indigo-50 border-indigo-300 text-indigo-950 hover:bg-indigo-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              currentStandard === 'ARP'
                ? 'bg-sky-600'
                : currentStandard === 'ICTAAL'
                ? 'bg-emerald-600'
                : currentStandard === 'CARREFOURS_INTERURBAINS'
                ? 'bg-amber-500'
                : 'bg-indigo-600'
            }`} />
            <span>
              Norme : {
                currentStandard === 'CARREFOURS_INTERURBAINS'
                  ? 'Carrefours (SETRA)'
                  : currentStandard === 'ECHANGEURS'
                  ? 'Échangeurs (Cerema)'
                  : currentStandard
              }
            </span>
            <ArrowRightLeft className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        </div>

        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold uppercase tracking-wider text-slate-600">
          {currentStandard === 'ARP' && (
            <>
              <button
                onClick={() => setActiveModule('dashboard')}
                className={`transition-colors whitespace-nowrap hover:text-sky-900 pb-0.5 cursor-pointer ${
                  activeModule === 'dashboard' ? 'text-sky-900 border-b-2 border-sky-900' : ''
                }`}
              >
                Tableau de bord
              </button>
              <button
                onClick={() => setActiveModule('devers-normal')}
                className={`transition-colors whitespace-nowrap hover:text-sky-900 pb-0.5 cursor-pointer ${
                  activeModule === 'devers-normal' || activeModule === 'devers-rd'
                    ? 'text-sky-900 border-b-2 border-sky-900'
                    : ''
                }`}
              >
                Dévers ARP
              </button>
              <button
                onClick={() => setActiveModule('clothoide-normal')}
                className={`transition-colors whitespace-nowrap hover:text-sky-900 pb-0.5 cursor-pointer ${
                  activeModule === 'clothoide-normal' || activeModule === 'clothoide-rd'
                    ? 'text-sky-900 border-b-2 border-sky-900'
                    : ''
                }`}
              >
                Clothoïdes
              </button>
              <button
                onClick={() => setActiveModule('trace-en-plan')}
                className={`transition-colors whitespace-nowrap hover:text-sky-900 pb-0.5 cursor-pointer ${
                  activeModule === 'trace-en-plan' ||
                  activeModule === 'profil-en-long' ||
                  activeModule === 'profil-en-travers'
                    ? 'text-sky-900 border-b-2 border-sky-900'
                    : ''
                }`}
              >
                Profils
              </button>
              <button
                onClick={() => setActiveModule('compliance')}
                className={`transition-colors whitespace-nowrap hover:text-sky-900 pb-0.5 cursor-pointer ${
                  activeModule === 'compliance' ? 'text-sky-900 border-b-2 border-sky-900' : ''
                }`}
              >
                Conformité
              </button>
            </>
          )}

          {currentStandard === 'ICTAAL' && (
            <>
              <button
                onClick={() => setActiveModule('ictaal-dashboard')}
                className={`transition-colors whitespace-nowrap hover:text-emerald-900 pb-0.5 cursor-pointer ${
                  activeModule === 'ictaal-dashboard' ? 'text-emerald-900 border-b-2 border-emerald-900' : ''
                }`}
              >
                Tableau de bord
              </button>
              <button
                onClick={() => setActiveModule('ictaal-devers')}
                className={`transition-colors whitespace-nowrap hover:text-emerald-900 pb-0.5 cursor-pointer ${
                  activeModule === 'ictaal-devers' ? 'text-emerald-900 border-b-2 border-emerald-900' : ''
                }`}
              >
                Dévers ICTAAL
              </button>
              <button
                onClick={() => setActiveModule('ictaal-clothoide')}
                className={`transition-colors whitespace-nowrap hover:text-emerald-900 pb-0.5 cursor-pointer ${
                  activeModule === 'ictaal-clothoide' ? 'text-emerald-900 border-b-2 border-emerald-900' : ''
                }`}
              >
                Clothoïdes
              </button>
              <button
                onClick={() => setActiveModule('ictaal-travers')}
                className={`transition-colors whitespace-nowrap hover:text-emerald-900 pb-0.5 cursor-pointer ${
                  activeModule === 'ictaal-travers' ? 'text-emerald-900 border-b-2 border-emerald-900' : ''
                }`}
              >
                Profil Travers
              </button>
              <button
                onClick={() => setActiveModule('ictaal-interchange')}
                className={`transition-colors whitespace-nowrap hover:text-emerald-900 pb-0.5 cursor-pointer ${
                  activeModule === 'ictaal-interchange' ? 'text-emerald-900 border-b-2 border-emerald-900' : ''
                }`}
              >
                Échangeurs
              </button>
              <button
                onClick={() => setActiveModule('ictaal-compliance')}
                className={`transition-colors whitespace-nowrap hover:text-emerald-900 pb-0.5 cursor-pointer ${
                  activeModule === 'ictaal-compliance' ? 'text-emerald-900 border-b-2 border-emerald-900' : ''
                }`}
              >
                Audit ICTAAL
              </button>
            </>
          )}

          {currentStandard === 'CARREFOURS_INTERURBAINS' && (
            <>
              <button
                onClick={() => setActiveModule('carrefour-dashboard')}
                className={`transition-colors whitespace-nowrap hover:text-amber-900 pb-0.5 cursor-pointer ${
                  activeModule === 'carrefour-dashboard' ? 'text-amber-900 border-b-2 border-amber-600' : ''
                }`}
              >
                Tableau de bord
              </button>
              <button
                onClick={() => setActiveModule('carrefour-giratoire')}
                className={`transition-colors whitespace-nowrap hover:text-amber-900 pb-0.5 cursor-pointer ${
                  activeModule === 'carrefour-giratoire' ? 'text-amber-900 border-b-2 border-amber-600' : ''
                }`}
              >
                Giratoires
              </button>
              <button
                onClick={() => setActiveModule('carrefour-tag')}
                className={`transition-colors whitespace-nowrap hover:text-amber-900 pb-0.5 cursor-pointer ${
                  activeModule === 'carrefour-tag' ? 'text-amber-900 border-b-2 border-amber-600' : ''
                }`}
              >
                Tourne-à-Gauche
              </button>
              <button
                onClick={() => setActiveModule('carrefour-visibilite')}
                className={`transition-colors whitespace-nowrap hover:text-amber-900 pb-0.5 cursor-pointer ${
                  activeModule === 'carrefour-visibilite' ? 'text-amber-900 border-b-2 border-amber-600' : ''
                }`}
              >
                Visibilité
              </button>
              <button
                onClick={() => setActiveModule('carrefour-compliance')}
                className={`transition-colors whitespace-nowrap hover:text-amber-900 pb-0.5 cursor-pointer ${
                  activeModule === 'carrefour-compliance' ? 'text-amber-900 border-b-2 border-amber-600' : ''
                }`}
              >
                Audit Carrefour
              </button>
            </>
          )}

          {currentStandard === 'ECHANGEURS' && (
            <>
              <button
                onClick={() => setActiveModule('echangeurs-dashboard')}
                className={`transition-colors whitespace-nowrap hover:text-indigo-900 pb-0.5 cursor-pointer ${
                  activeModule === 'echangeurs-dashboard' ? 'text-indigo-900 border-b-2 border-indigo-600' : ''
                }`}
              >
                Tableau de bord
              </button>
              <button
                onClick={() => setActiveModule('echangeurs-sortie')}
                className={`transition-colors whitespace-nowrap hover:text-indigo-900 pb-0.5 cursor-pointer ${
                  activeModule === 'echangeurs-sortie' ? 'text-indigo-900 border-b-2 border-indigo-600' : ''
                }`}
              >
                Sorties & Décélération
              </button>
              <button
                onClick={() => setActiveModule('echangeurs-entree')}
                className={`transition-colors whitespace-nowrap hover:text-indigo-900 pb-0.5 cursor-pointer ${
                  activeModule === 'echangeurs-entree' ? 'text-indigo-900 border-b-2 border-indigo-600' : ''
                }`}
              >
                Entrées & Insertion
              </button>
              <button
                onClick={() => setActiveModule('echangeurs-bretelles')}
                className={`transition-colors whitespace-nowrap hover:text-indigo-900 pb-0.5 cursor-pointer ${
                  activeModule === 'echangeurs-bretelles' ? 'text-indigo-900 border-b-2 border-indigo-600' : ''
                }`}
              >
                Branches & Dévers
              </button>
              <button
                onClick={() => setActiveModule('echangeurs-entrecroisement')}
                className={`transition-colors whitespace-nowrap hover:text-indigo-900 pb-0.5 cursor-pointer ${
                  activeModule === 'echangeurs-entrecroisement' ? 'text-indigo-900 border-b-2 border-indigo-600' : ''
                }`}
              >
                Entrecroisement
              </button>
              <button
                onClick={() => setActiveModule('echangeurs-compliance')}
                className={`transition-colors whitespace-nowrap hover:text-indigo-900 pb-0.5 cursor-pointer ${
                  activeModule === 'echangeurs-compliance' ? 'text-indigo-900 border-b-2 border-indigo-600' : ''
                }`}
              >
                Audit Cerema
              </button>
            </>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveModule('admin-console')}
              className={`transition-colors whitespace-nowrap shrink-0 text-rose-700 hover:text-rose-900 pb-0.5 flex items-center gap-1.5 cursor-pointer ${
                activeModule === 'admin-console' ? 'border-b-2 border-rose-700 font-bold' : ''
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Espace Admin</span>
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse shadow-xs">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onSave}
            title="Sauvegarder dans le navigateur"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Sauvegarder</span>
          </button>
          <button
            onClick={openReports}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentStandard === 'ARP'
                ? 'bg-sky-900 hover:bg-sky-800'
                : 'bg-emerald-800 hover:bg-emerald-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Dossier</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1">
                  <span>{user.name}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-end gap-1">
                  {getJobIcon(user.jobTitle)}
                  <span className="font-semibold text-slate-700">{user.jobTitle || 'Ingénieur'}</span>
                  <span>·</span>
                  <span className={user.role === 'SUPERADMIN' ? 'text-rose-700 font-bold' : 'text-slate-600'}>
                    {user.role === 'SUPERADMIN' ? 'Admin' : (user.organization || 'Bureau d\'études')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => logout()}
                title="Déconnexion sécurisée"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
