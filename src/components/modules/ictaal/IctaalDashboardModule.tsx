import React from 'react';
import { FullIctaalProjectState } from '../../../utils/storage';
export const IctaalDashboardModule: React.FC<{ projectState: FullIctaalProjectState; setActiveModule: (m: string) => void; openReports: () => void; onOpenNormSelector: () => void; }> = ({ projectState }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-2xl p-6">
        <h1 className="text-xl font-bold">{projectState.metadata.name}</h1>
        <p className="text-xs text-slate-300 mt-1">Norme ICTAAL (Autoroutes de Liaison 2015/2021)</p>
      </div>
    </div>
  );
};
