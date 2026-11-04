import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Settings,
  Database,
  Compass,
  Mountain,
  Spline,
  GitCommit,
  Maximize2,
  Columns3,
  Route,
  Activity,
  Layers,
  ShieldAlert,
  BarChart3,
  FileCheck2,
  History,
  BookOpen,
  Search,
  ShieldCheck,
  ArrowRightLeft,
  GitMerge,
  TrendingDown
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

interface Props {
  currentStandard: 'ARP' | 'ICTAAL' | 'CARREFOURS_INTERURBAINS' | 'ECHANGEURS';
  onOpenNormSelector: () => void;
  activeModule: string;
  setActiveModule: (m: string) => void;
  alertCount: { critical: number; warning: number };
  pendingAdminCount?: number;
}

export const Sidebar: React.FC<Props> = ({
  currentStandard,
  onOpenNormSelector,
  activeModule,
  setActiveModule,
  alertCount,
  pendingAdminCount = 0
}) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const arpNavGroups: NavGroup[] = [
    ...(isAdmin
      ? [
          {
            group: 'Administration & Sécurité',
            items: [
              {
                id: 'admin-console',
                label: 'Espace Administrateur',
                icon: ShieldCheck,
                badge: pendingAdminCount > 0 ? `${pendingAdminCount} alertes` : 'Admin',
                badgeColor:
                  pendingAdminCount > 0
                    ? 'bg-amber-400 text-slate-900 font-bold'
                    : 'bg-rose-700 text-white'
              }
            ]
          }
        ]
      : []),
    {
      group: 'Général (Norme ARP)',
      items: [
        { id: 'dashboard', label: '1. Tableau de bord', icon: LayoutDashboard },
        { id: 'project-settings', label: '2. Paramètres du projet', icon: Settings },
        { id: 'reference-data', label: '3. Données de référence ARP', icon: Database }
      ]
    },
    {
      group: 'Calculs Hydrauliques & Dévers',
      items: [
        { id: 'devers-normal', label: '4. Calcul des dévers (Normal)', icon: Compass },
        { id: 'devers-rd', label: '5. Dévers en relief difficile', icon: Mountain }
      ]
    },
    {
      group: 'Raccordements & Plateforme',
      items: [
        { id: 'clothoide-normal', label: '6. Calcul des clothoïdes', icon: Spline },
        { id: 'clothoide-rd', label: '7. Clothoïdes en relief difficile', icon: GitCommit },
        { id: 'surlargeur-lacet', label: '8. Surlargeurs et lacets', icon: Maximize2 },
        { id: 'largeur-roulable', label: '9. Largeur roulable RD', icon: Columns3 }
      ]
    },
    {
      group: 'Géométrie Routière Complète',
      items: [
        { id: 'trace-en-plan', label: '10. Tracé en plan (Éléments)', icon: Route },
        { id: 'profil-en-long', label: '11. Profil en long (Pentes & Z)', icon: Activity },
        { id: 'profil-en-travers', label: '12. Profil en travers (Modèle)', icon: Layers }
      ]
    },
    {
      group: 'Validation & Livrables',
      items: [
        {
          id: 'compliance',
          label: '13. Vérifications & conformité',
          icon: ShieldAlert,
          badge: alertCount.critical > 0 ? `${alertCount.critical}` : undefined,
          badgeColor: 'bg-rose-600 text-white'
        },
        { id: 'visualizations', label: '14. Visualisations 2D/3D', icon: BarChart3 },
        { id: 'reports', label: '15. Rapports & Livrables', icon: FileCheck2 },
        { id: 'history', label: '16. Historique des calculs', icon: History },
        { id: 'documentation', label: '17. Guide ARP (Août 2022)', icon: BookOpen }
      ]
    }
  ];

  const ictaalNavGroups: NavGroup[] = [
    ...(isAdmin
      ? [
          {
            group: 'Administration & Sécurité',
            items: [
              {
                id: 'admin-console',
                label: 'Espace Administrateur',
                icon: ShieldCheck,
                badge: pendingAdminCount > 0 ? `${pendingAdminCount} alertes` : 'Admin',
                badgeColor:
                  pendingAdminCount > 0
                    ? 'bg-amber-400 text-slate-900 font-bold'
                    : 'bg-rose-700 text-white'
              }
            ]
          }
        ]
      : []),
    {
      group: 'Général (Norme ICTAAL)',
      items: [
        { id: 'ictaal-dashboard', label: '1. Tableau de bord Autoroutier', icon: LayoutDashboard },
        { id: 'project-settings', label: '2. Paramètres Autoroute & Trafic', icon: Settings }
      ]
    },
    {
      group: 'Tracé & Pentes Transversales',
      items: [
        { id: 'ictaal-devers', label: '3. Tracé en plan & Dévers (1/R)', icon: Spline },
        { id: 'ictaal-clothoide', label: '4. Clothoïdes autoroutières', icon: Compass }
      ]
    },
    {
      group: 'Plateforme & Profils',
      items: [
        { id: 'ictaal-travers', label: '5. Profil en travers & BAU', icon: Columns3 },
        { id: 'ictaal-profil-long', label: '6. Profil en long & Fortes pentes (VSVL)', icon: TrendingDown }
      ]
    },
    {
      group: 'Échangeurs & Raccordements',
      items: [
        { id: 'ictaal-interchange', label: '7. Échangeurs, bretelles & insertions', icon: GitMerge }
      ]
    },
    {
      group: 'Validation & Dossiers',
      items: [
        {
          id: 'ictaal-compliance',
          label: '8. Audit réglementaire ICTAAL',
          icon: ShieldAlert,
          badge: alertCount.critical > 0 ? `${alertCount.critical}` : undefined,
          badgeColor: 'bg-rose-600 text-white'
        },
        { id: 'reports', label: '9. Dossier & Rapports techniques', icon: FileCheck2 },
        { id: 'history', label: '10. Historique des calculs', icon: History }
      ]
    }
  ];

  const carrefoursNavGroups: NavGroup[] = [
    ...(isAdmin
      ? [
          {
            group: 'Administration & Sécurité',
            items: [
              {
                id: 'admin-console',
                label: 'Espace Administrateur',
                icon: ShieldCheck,
                badge: pendingAdminCount > 0 ? `${pendingAdminCount} alertes` : 'Admin',
                badgeColor:
                  pendingAdminCount > 0
                    ? 'bg-amber-400 text-slate-900 font-bold'
                    : 'bg-rose-700 text-white'
              }
            ]
          }
        ]
      : []),
    {
      group: 'Diagnostic & Choix du Type',
      items: [
        { id: 'carrefour-dashboard', label: '1. Tableau de bord Carrefours', icon: LayoutDashboard },
        { id: 'project-settings', label: '2. Paramètres & Débits de Trafic', icon: Settings }
      ]
    },
    {
      group: 'Carrefours Giratoires (SETRA)',
      items: [
        { id: 'carrefour-giratoire', label: '3. Carrefours Giratoires (Anneau & PL)', icon: GitMerge }
      ]
    },
    {
      group: 'Carrefours Plans & Îlots',
      items: [
        { id: 'carrefour-tag', label: '4. Tourne-à-Gauche (TAG & Stockage)', icon: Columns3 }
      ]
    },
    {
      group: 'Visibilité & Sécurité Routière',
      items: [
        { id: 'carrefour-visibilite', label: '5. Triangles de Visibilité (d = 4m)', icon: Compass },
        { id: 'carrefour-compliance', label: '6. Audit de Sécurité du Nœud', icon: ShieldAlert }
      ]
    },
    {
      group: 'Dossier Technique & Historique',
      items: [
        { id: 'reports', label: '7. Note de calcul & Dossier', icon: FileCheck2 },
        { id: 'history', label: '8. Historique des calculs', icon: History }
      ]
    }
  ];

  const echangeursNavGroups: NavGroup[] = [
    ...(isAdmin
      ? [
          {
            group: 'Administration & Sécurité',
            items: [
              {
                id: 'admin-console',
                label: 'Espace Administrateur',
                icon: ShieldCheck,
                badge: pendingAdminCount > 0 ? `${pendingAdminCount} alertes` : 'Admin',
                badgeColor:
                  pendingAdminCount > 0
                    ? 'bg-amber-400 text-slate-900 font-bold'
                    : 'bg-rose-700 text-white'
              }
            ]
          }
        ]
      : []),
    {
      group: 'Vue d\'Ensemble & Conception',
      items: [
        { id: 'echangeurs-dashboard', label: '1. Tableau de bord & Typologie', icon: Compass },
        { id: 'project-settings', label: 'Paramètres du Projet Échangeur', icon: Settings }
      ]
    },
    {
      group: 'Dispositifs d\'Échange (Cerema)',
      items: [
        { id: 'echangeurs-sortie', label: '2. Sorties & Décélération (Ld)', icon: TrendingDown },
        { id: 'echangeurs-entree', label: '3. Entrées & Insertion (La)', icon: GitMerge }
      ]
    },
    {
      group: 'Audit Réglementaire & Sécurité',
      items: [
        { id: 'echangeurs-compliance', label: '6. Audit de Conformité Cerema', icon: ShieldCheck }
      ]
    },
    {
      group: 'Dossier Technique & Historique',
      items: [
        { id: 'reports', label: '7. Note de calcul & Export', icon: FileCheck2 },
        { id: 'history', label: '8. Historique des calculs', icon: History }
      ]
    }
  ];

  const currentNavGroups =
    currentStandard === 'ARP'
      ? arpNavGroups
      : currentStandard === 'ICTAAL'
      ? ictaalNavGroups
      : currentStandard === 'CARREFOURS_INTERURBAINS'
      ? carrefoursNavGroups
      : echangeursNavGroups;

  const filteredGroups = currentNavGroups
    .map((grp) => ({
      ...grp,
      items: grp.items.filter((item) =>
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
    .filter((grp) => grp.items.length > 0);

  return (
    <aside className="w-64 border-r border-slate-200 bg-white h-[calc(100vh-61px)] flex flex-col justify-between shrink-0 sticky top-[61px] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className={`p-3 rounded-xl border text-xs space-y-2 ${
          currentStandard === 'ARP'
            ? 'bg-sky-50 border-sky-200 text-sky-950'
            : currentStandard === 'ICTAAL'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : currentStandard === 'CARREFOURS_INTERURBAINS'
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : 'bg-indigo-50 border-indigo-200 text-indigo-950'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
              Référentiel Actif
            </span>
            <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-black text-white ${
              currentStandard === 'ARP'
                ? 'bg-sky-900'
                : currentStandard === 'ICTAAL'
                ? 'bg-emerald-800'
                : currentStandard === 'CARREFOURS_INTERURBAINS'
                ? 'bg-amber-600'
                : 'bg-indigo-900'
            }`}>
              {currentStandard === 'CARREFOURS_INTERURBAINS'
                ? 'CARREFOURS'
                : currentStandard === 'ECHANGEURS'
                ? 'ÉCHANGEURS'
                : currentStandard}
            </span>
          </div>
          <div className="text-[11px] font-medium leading-tight">
            {currentStandard === 'ARP'
              ? 'Routes Principales (Cerema Août 2022)'
              : currentStandard === 'ICTAAL'
              ? 'Autoroutes de Liaison (Cerema 2015/2021)'
              : currentStandard === 'CARREFOURS_INTERURBAINS'
              ? 'Carrefours Interurbains (SETRA Déc. 1998)'
              : 'Échangeurs sur Autoroutes (Cerema Éd. 2015)'}
          </div>
          <button
            type="button"
            onClick={onOpenNormSelector}
            className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border shadow-2xs ${
              currentStandard === 'ARP'
                ? 'bg-white hover:bg-sky-100 text-sky-900 border-sky-300'
                : currentStandard === 'ICTAAL'
                ? 'bg-white hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                : currentStandard === 'CARREFOURS_INTERURBAINS'
                ? 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white hover:bg-indigo-100 text-indigo-900 border-indigo-300'
            }`}
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Changer de Référentiel</span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un module..."
            className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-400 bg-slate-50 focus:bg-white transition-colors"
          />
        </div>

        <div className="space-y-4">
          {filteredGroups.map((grp, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                {grp.group}
              </span>
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveModule(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                        isActive
                          ? currentStandard === 'ARP'
                            ? 'bg-sky-900 text-white font-semibold shadow-xs'
                            : 'bg-emerald-800 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1.5 shrink-0 ${
                            isActive
                              ? 'bg-white text-slate-900'
                              : item.badgeColor || 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center justify-between">
          <span>{currentStandard === 'ARP' ? 'Guide ARP Cerema 2022' : 'ICTAAL Cerema 2015/2021'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </div>
      </div>
    </aside>
  );
};
