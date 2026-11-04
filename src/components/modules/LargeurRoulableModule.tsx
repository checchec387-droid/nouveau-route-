import React from 'react';
import { calculateLargeurRoulable } from '../../utils/arpCalculations';
import { CalculationStepCard } from '../common/CalculationStepCard';
import { Columns3 } from 'lucide-react';

interface Props {
  data: any;
  onChange: (d: any) => void;
}

export const LargeurRoulableModule: React.FC<Props> = ({ data, onChange }) => {
  const result = calculateLargeurRoulable(data);
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <Columns3 className="w-5 h-5 text-amber-800" />
          <span>Largeur Roulable Réduite — Relief Difficile</span>
        </h1>
      </div>
      <CalculationStepCard
        steps={result.steps}
        ruleRef={result.ruleRef}
        isCompliant={true}
      />
    </div>
  );
};
