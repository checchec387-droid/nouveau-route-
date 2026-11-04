import React from 'react';
import { RoadType, FunctionLevel } from '../../types/arp';
import { Layers } from 'lucide-react';

interface Props {
  roadType: RoadType;
  functionLevel: FunctionLevel;
}

export const ProfilEnTraversModule: React.FC<Props> = ({ roadType, functionLevel }) => {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-sky-900" />
          <span>Modélisation du Profil en Travers Type</span>
        </h1>
      </div>
      <div className="p-4 bg-white border border-slate-200 rounded-xl">
        <span className="text-xs text-slate-600">Type de route : {roadType} — Niveau de fonction : {functionLevel}</span>
      </div>
    </div>
  );
};
