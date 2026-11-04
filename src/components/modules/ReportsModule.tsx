import React from 'react';
import { FullProjectState } from '../../utils/storage';
import { FileCheck2 } from 'lucide-react';

interface Props {
  projectState: FullProjectState;
}

export const ReportsModule: React.FC<Props> = ({ projectState }) => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <FileCheck2 className="w-5 h-5 text-sky-900" />
          <span>Générateur de Rapport Technique</span>
        </h1>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
        >
          Imprimer
        </button>
      </div>
    </div>
  );
};
