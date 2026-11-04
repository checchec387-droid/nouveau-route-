import React from 'react';
import { calculateSurlargeurLacet } from '../../utils/arpCalculations';
import { CalculationStepCard } from '../common/CalculationStepCard';
import { Maximize2 } from 'lucide-react';

interface Props {
  data: any;
  onChange: (d: any) => void;
}

export const SurlargeurLacetModule: React.FC<Props> = ({ data, onChange }) => {
  const result = calculateSurlargeurLacet(data);
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <Maximize2 className="w-5 h-5 text-sky-900" />
          <span>Surlargeurs en Courbe et Lacets</span>
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
