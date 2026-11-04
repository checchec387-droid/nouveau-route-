import React from 'react';
import { calculateClothoideReliefDifficile } from '../../utils/arpCalculations';
import { CalculationStepCard } from '../common/CalculationStepCard';
import { GitCommit } from 'lucide-react';

interface Props {
  data: any;
  onChange: (d: any) => void;
}

export const ClothoideReliefDifficileModule: React.FC<Props> = ({ data, onChange }) => {
  const result = calculateClothoideReliefDifficile(data);
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <GitCommit className="w-5 h-5 text-emerald-800" />
          <span>Clothoïdes en Relief Difficile</span>
        </h1>
      </div>
      <CalculationStepCard
        steps={result.steps}
        ruleRef={result.ruleRef}
        isCompliant={result.allowsMinShift && result.isResultantSlopeCompliant}
      />
    </div>
  );
};
