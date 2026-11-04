import React from 'react';
import { TraceEnPlanElement, RoadCategory } from '../../types/arp';
import { Route } from 'lucide-react';

interface Props {
  category: RoadCategory;
  isInterurbaine110: boolean;
  data: {
    v85Kmh: number;
    elements: TraceEnPlanElement[];
  };
  onChange: (d: any) => void;
}

export const TraceEnPlanModule: React.FC<Props> = ({ category, data, onChange }) => {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <Route className="w-5 h-5 text-teal-900" />
          <span>Tracé en Plan Géométrique</span>
        </h1>
      </div>
      <div className="p-4 bg-white border border-slate-200 rounded-xl">
        <span className="text-xs text-slate-600">Vitesse V85 : {data.v85Kmh} km/h — Éléments : {data.elements.length}</span>
      </div>
    </div>
  );
};
