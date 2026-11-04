import React from 'react';
import { calculateDeversReliefDifficile } from '../../utils/arpCalculations';
import { CalculationStepCard } from '../common/CalculationStepCard';
import { Mountain } from 'lucide-react';

interface Props {
  data: {
    radiusR: number;
    longitudinalSlopeP: number;
    hasSnowOrFrost: boolean;
    userReducedDevers?: number;
  };
  onChange: (d: any) => void;
}

export const DeversReliefDifficileModule: React.FC<Props> = ({ data, onChange }) => {
  const result = calculateDeversReliefDifficile(data);
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <Mountain className="w-5 h-5 text-emerald-800" />
          <span>Dévers — Routes en Relief Difficile</span>
        </h1>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Rayon (m)</label>
          <input
            type="number"
            value={data.radiusR}
            onChange={(e) => onChange({ ...data, radiusR: parseFloat(e.target.value) || 50 })}
            className="w-full text-xs border border-slate-200 rounded-lg p-2 font-mono"
          />
        </div>
        <div className="p-4 bg-emerald-50 rounded-xl text-xs">
          <span className="text-slate-500 block">Pente résultante</span>
          <span className="text-2xl font-bold font-mono text-emerald-950">{result.resultantSlope.toFixed(2)} %</span>
        </div>
      </div>
      <CalculationStepCard
        steps={result.steps}
        ruleRef={result.ruleRef}
        isCompliant={result.isResultantSlopeCompliant}
      />
    </div>
  );
};
