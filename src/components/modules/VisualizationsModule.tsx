import React from 'react';
import { FullProjectState } from '../../utils/storage';
import { BarChart3 } from 'lucide-react';

interface Props {
  projectState: FullProjectState;
}

export const VisualizationsModule: React.FC<Props> = ({ projectState }) => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <BarChart3 className="w-5 h-5 text-sky-900" />
          <span>Graphiques et Schémas Techniques du Projet</span>
        </h1>
      </div>
    </div>
  );
};
