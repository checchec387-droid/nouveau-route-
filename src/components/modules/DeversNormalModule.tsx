import React from 'react';
import { RoadCategory } from '../../types/arp';
import { calculateDeversNormal } from '../../utils/arpCalculations';
import { CalculationStepCard } from '../common/CalculationStepCard';
import { Compass, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  data: {
    category: RoadCategory;
    isInterurbaine110: boolean;
    radiusR: number;
  };
  onChange: (d: { category: RoadCategory; isInterurbaine110: boolean; radiusR: number }) => void;
}

export const DeversNormalModule: React.FC<Props> = ({ data, onChange }) => {
  const result = calculateDeversNormal(data);
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-sky-900" />
          <span>Calcul du Dévers — Cas Normal</span>
        </h1>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Rayon R (m)</label>
            <input
              type="number"
              value={data.radiusR}
              onChange={(e) => onChange({ ...data, radiusR: parseFloat(e.target.value) || 100 })}
              className="w-full text-xs font-mono border border-slate-200 rounded-lg p-2"
            />
          </div>
          <div className="p-4 bg-sky-50 rounded-xl text-xs">
            <span className="text-slate-500 block">Dévers calculé</span>
            <span className="text-2xl font-bold font-mono text-sky-950">{result.calculatedDevers.toFixed(2)} %</span>
          </div>
        </div>
      </div>
      <CalculationStepCard
        steps={result.steps}
        ruleRef={result.ruleRef}
        isCompliant={result.isRadiusValid}
      />
    </div>
  );
};
