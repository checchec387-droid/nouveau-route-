import React from 'react';
import { FullProjectState } from '../../utils/storage';
import {
  calculateDeversNormal,
  calculateClothoideNormal,
  calculateDeversReliefDifficile,
  calculateLargeurRoulable,
  runGlobalProjectAudit
} from '../../utils/arpCalculations';
import {
  Compass,
  Spline,
  Mountain,
  Columns3,
  ShieldCheck,
  ShieldAlert,
  Route,
  Activity,
  ArrowRight,
  FileText,
  Calendar,
  Building2,
  UserCheck
} from 'lucide-react';

interface Props {
  projectState: FullProjectState;
  setActiveModule: (m: string) => void;
  openReports: () => void;
  onOpenNormSelector?: () => void;
}

export const DashboardModule: React.FC<Props> = ({
  projectState,
  setActiveModule,
  openReports,
  onOpenNormSelector
}) => {
  const { metadata, deversNormal, clothoideNormal, deversRD, largeurRoulable, traceEnPlan, profilEnLong } = projectState;
  const resDeversNormal = calculateDeversNormal(deversNormal);
  const resClothNormal = calculateClothoideNormal(clothoideNormal);
  const resDeversRD = calculateDeversReliefDifficile(deversRD);
  const resLargeur = calculateLargeurRoulable(largeurRoulable);

  const alerts = runGlobalProjectAudit({
    category: metadata.category,
    isInterurbaine110: deversNormal.isInterurbaine110,
    radiusNormal: deversNormal.radiusR,
    radiusRD: deversRD.radiusR,
    deversNormal: resDeversNormal.calculatedDevers,
    deversRD: resDeversRD.adoptedDevers,
    longitudinalSlopeRD: deversRD.longitudinalSlopeP,
    clothoideNormalLength: resClothNormal.lengthL,
    minShiftRDLength: 31.5,
    tmja: metadata.tmja,
    plDaily: metadata.plDaily,
    traceElements: traceEnPlan.elements,
    profilElements: profilEnLong.elements
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-slate-900 text-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-sky-300 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-sky-800 text-white font-bold">NORME ARP</span>
            <span>·</span>
            <span>Dossier : {metadata.dossierNumber}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">{metadata.name}</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl">{metadata.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Classification</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{metadata.category}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Trafic</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{metadata.tmja} v/j</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dévers Normal</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{resDeversNormal.calculatedDevers}%</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Clothoïde L</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{resClothNormal.lengthL.toFixed(1)} m</div>
        </div>
      </div>
    </div>
  );
};
