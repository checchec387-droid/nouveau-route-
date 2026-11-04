import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Route,
  Navigation,
  Compass,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Award,
  GraduationCap,
  Briefcase,
  GitMerge,
  GitFork
} from 'lucide-react';

interface Props {
  currentStandard: 'ARP' | 'ICTAAL' | 'CARREFOURS_INTERURBAINS' | 'ECHANGEURS';
  onSelectStandard: (std: 'ARP' | 'ICTAAL' | 'CARREFOURS_INTERURBAINS' | 'ECHANGEURS') => void;
  onClose?: () => void;
  isInitialSelection?: boolean;
}

export const NormSelectorModal: React.FC<Props> = ({
  currentStandard,
  onSelectStandard,
  onClose,
  isInitialSelection = false
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'cards' | 'comparatif'>('cards');

  const getJobIcon = (jobTitle?: string) => {
    if (jobTitle === 'Expert') return <Award className="w-4 h-4 text-purple-600" />;
    if (jobTitle === 'Étudiant') return <GraduationCap className="w-4 h-4 text-emerald-600" />;
    return <Briefcase className="w-4 h-4 text-sky-600" />;
  };

  return (
    <div className={`${isInitialSelection ? 'min-h-[85vh] flex flex-col justify-center' : 'fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto'}`}>
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full mx-auto overflow-hidden transition-all my-auto ${isInitialSelection ? '' : 'max-h-[92vh] flex flex-col'}`}>
        <div className="bg-linear-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-6 relative shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[11px] font-semibold tracking-wide uppercase">
                  Plateforme Multi-Normes de Conception Routière
                </span>
                {user && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 text-[11px]">
                    {getJobIcon(user.jobTitle)}
                    <span>{user.name}</span>
                    <span className="text-slate-400 font-mono">({user.jobTitle || 'Ingénieur'})</span>
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <Compass className="w-6 h-6 text-sky-400" />
                <span>Choix du Référentiel Technique de Conception</span>
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Sélectionnez le référentiel géométrique adapté : tracé linéaire (ARP / ICTAAL) ou normes spécifiques aux éléments singuliers (Carrefours Interurbains, Échangeurs).
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'cards'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Tous les Référentiels
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('comparatif')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'comparatif'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Quand utiliser ARP vs ICTAAL ?
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          {activeTab === 'cards' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-900 text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Section 1 : Normes Linéaires & Tracé d'Itinéraire
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Conception des sections courantes : tracé en plan, profil en long, profil en travers et coordination 3D
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ARP */}
                  <div
                    className={`relative rounded-2xl border-2 transition-all p-5 flex flex-col justify-between ${
                      currentStandard === 'ARP'
                        ? 'border-sky-600 bg-sky-50/40 ring-4 ring-sky-500/10 shadow-md'
                        : 'border-slate-200 bg-white hover:border-sky-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-sky-900 text-white text-xs font-bold font-mono">
                              ARP
                            </span>
                            <span className="text-[11px] font-semibold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                              Cerema / Sétra 2022
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-2">
                            Aménagement des Routes Principales
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Guide de conception géométrique des routes interurbaines principales
                          </p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                          <Route className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        <strong className="text-sky-950 block text-[11px] uppercase mb-1">Domaine d'application :</strong>
                        Routes départementales et nationales bidirectionnelles (types 4.1 et 4.2), 3 voies et artères interurbaines.
                      </div>
                    </div>
                    <div className="pt-4 mt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => onSelectStandard('ARP')}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                          currentStandard === 'ARP'
                            ? 'bg-sky-900 text-white hover:bg-sky-800'
                            : 'bg-white text-sky-900 border border-sky-300 hover:bg-sky-50'
                        }`}
                      >
                        <span>{currentStandard === 'ARP' ? 'Référentiel Linéaire ARP Actif' : 'Sélectionner la Norme ARP'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ICTAAL */}
                  <div
                    className={`relative rounded-2xl border-2 transition-all p-5 flex flex-col justify-between ${
                      currentStandard === 'ICTAAL'
                        ? 'border-emerald-600 bg-emerald-50/40 ring-4 ring-emerald-500/10 shadow-md'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-800 text-white text-xs font-bold font-mono">
                              ICTAAL
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Cerema Éd. 2015 / Màj 2021
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-2">
                            Aménagement des Autoroutes de Liaison
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Instruction sur les conditions techniques des autoroutes (Type 1)
                          </p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <Navigation className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        <strong className="text-emerald-950 block text-[11px] uppercase mb-1">Domaine d'application :</strong>
                        Autoroutes et voies rapides de type 1 isolées de l'environnement, 2x2 à 2x4 voies, carrefours exclusivement dénivelés.
                      </div>
                    </div>
                    <div className="pt-4 mt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => onSelectStandard('ICTAAL')}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                          currentStandard === 'ICTAAL'
                            ? 'bg-emerald-800 text-white hover:bg-emerald-700'
                            : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        <span>{currentStandard === 'ICTAAL' ? 'Référentiel Linéaire ICTAAL Actif' : 'Sélectionner la Norme ICTAAL'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2 : ÉLÉMENTS ROUTIERS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <span>Section 2 : Normes Spécifiques aux Éléments Routiers (Carrefours & Nœuds)</span>
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Normes techniques spécialisées pour les carrefours plans, carrefours à sens giratoire, tourne-à-gauche et échangeurs
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CARREFOURS */}
                  <div
                    className={`relative rounded-2xl border-2 transition-all p-5 flex flex-col justify-between ${
                      currentStandard === 'CARREFOURS_INTERURBAINS'
                        ? 'border-amber-600 bg-amber-50/50 ring-4 ring-amber-500/10 shadow-md'
                        : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-amber-600 text-white text-xs font-bold font-mono">
                              CARREFOURS
                            </span>
                            <span className="text-[11px] font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                              Guide SETRA Réf. B 9836 (Cerema)
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-2">
                            Aménagement des Carrefours Interurbains
                          </h3>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                          <GitMerge className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        Carrefours plans ordinaires (STOP / Cédez-le-passage), voie de tourne-à-gauche (TAG) et carrefours à sens giratoire.
                      </div>
                    </div>
                    <div className="pt-4 mt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => onSelectStandard('CARREFOURS_INTERURBAINS')}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                          currentStandard === 'CARREFOURS_INTERURBAINS'
                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                            : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-50'
                        }`}
                      >
                        <span>{currentStandard === 'CARREFOURS_INTERURBAINS' ? 'Norme Carrefours Interurbains Active' : 'Sélectionner la Norme Carrefours'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ÉCHANGEURS */}
                  <div
                    className={`relative rounded-2xl border-2 transition-all p-5 flex flex-col justify-between ${
                      currentStandard === 'ECHANGEURS'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-500/10 shadow-md'
                        : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-indigo-900 text-white text-xs font-bold font-mono">
                              ÉCHANGEURS
                            </span>
                            <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                              Guide Cerema Éd. 2015
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-2">
                            Aménagement des Échangeurs Dénivelés
                          </h3>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center shrink-0">
                          <GitFork className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        Diffuseurs dénivelés (trompette, lunettes, demi-trèfle, losange) et nœuds autoroutiers.
                      </div>
                    </div>
                    <div className="pt-4 mt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => onSelectStandard('ECHANGEURS')}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                          currentStandard === 'ECHANGEURS'
                            ? 'bg-indigo-900 text-white hover:bg-indigo-800'
                            : 'bg-white text-indigo-900 border border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        <span>{currentStandard === 'ECHANGEURS' ? 'Guide Échangeurs Actif' : 'Sélectionner le Guide Échangeurs'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comparatif' && (
            <div className="space-y-4">
              <div className="bg-sky-50/70 border border-sky-200 p-4 rounded-xl text-xs text-sky-950">
                <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-800" />
                  <span>Matrice Décisionnelle : ARP vs ICTAAL</span>
                </h3>
                <p>
                  <strong>ARP (2022) :</strong> Routes départementales et nationales ordinaires, vitesses 80-110 km/h, carrefours plans ou giratoires.<br/>
                  <strong>ICTAAL (2015/2021) :</strong> Autoroutes et voies rapides de liaison (Type 1), vitesses 110-130 km/h, carrefours dénivelés.
                </p>
              </div>
            </div>
          )}
        </div>

        {onClose && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500">
              Norme actuellement sélectionnée : <strong className="text-slate-800">{currentStandard}</strong>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
            >
              Fermer et retourner aux calculs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
