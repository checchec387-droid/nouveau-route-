import React from 'react';
import { CrossSectionType, RoadCategory } from '../../types/arp';
import { calculateClothoideNormal } from '../../utils/arpCalculations';
import { CalculationStepCard } from '../common/CalculationStepCard';
import { Spline } from 'lucide-react';

interface Props {
  data: {
    crossSectionType: CrossSectionType;
    radiusR: number;
    widthL: number;
    deltaDevers: number;
    category: RoadCategory;
    isInterurbaine110: boolean;
  };
  onChange: (d: any) => void;
}

export const ClothoideNormalModule: React.FC<Props> = ({ data, onChange }) => {
  const result = calculateClothoideNormal(data);
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <Spline className="w-5 h-5 text-indigo-900" />
          <span>Calcul des Clothoïdes — Cas Normal</span>
        </h1>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Rayon R (m)</label>
          <input
            type="number"
            value={data.radiusR}
            onChange={(e) => onChange({ ...data, radiusR: parseFloat(e.target.value) || 100 })}
            className="w-full text-xs border border-slate-200 rounded-lg p-2 font-mono"
          />
        </div>
        <div className="p-4 bg-indigo-50 rounded-xl text-xs">
          <span className="text-slate-500 block">Longueur L</span>
          <span className="text-2xl font-bold font-mono text-indigo-950">{result.lengthL.toFixed(2)} m</span>
        </div>
      </div>
      <CalculationStepCard
        steps={result.steps}
        ruleRef={result.ruleRef}
        isCompliant={true}
      />
    </div>
  );
};
