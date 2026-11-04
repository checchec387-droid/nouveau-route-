import React from 'react';
import { FullCarrefourProjectState } from '../../../utils/storage';
export const CarrefoursDashboardModule: React.FC<{ projectState: FullCarrefourProjectState; setActiveModule: (m: string) => void; openReports: () => void; onOpenNormSelector: () => void; }> = ({ projectState }) => (
  <div className="space-y-6"><div className="bg-slate-900 text-white rounded-2xl p-6"><h1 className="text-xl font-bold">{projectState.metadata.name}</h1><p className="text-xs text-slate-300 mt-1">Carrefours Interurbains (Guide SETRA)</p></div></div>
);
