import React from 'react';
import { ProfilEnLongElement, RoadCategory } from '../../types/arp';
import { Activity } from 'lucide-react';

interface Props {
  category: RoadCategory;
  isInterurbaine110: boolean;
  data: {
    v85Kmh: number;
    elements: ProfilEnLongElement[];
  };
  onChange: (d: any) => void;
  radiusHorizontalContext?: number;
}

export const ProfilEnLongModule: React.FC<Props> = ({ category, data, onChange }) => {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-purple-900" />
          <span>Profil en Long & Raccordements Verticaux</span>
        </h1>
      </div>
      <div className="p-4 bg-white border border-slate-200 rounded-xl">
        <span className="text-xs text-slate-600">Éléments altimétriques : {data.elements.length}</span>
      </div>
    </div>
  );
};
