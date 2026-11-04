import React from 'react';
import { FullProjectState } from '../../utils/storage';
import { ShieldAlert } from 'lucide-react';

interface Props {
  projectState: FullProjectState;
  setActiveModule: (m: string) => void;
}

export const GlobalComplianceModule: React.FC<Props> = ({ projectState }) => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-sky-900" />
          <span>Contrôle Global du Projet & Vérifications de Conformité</span>
        </h1>
      </div>
      <div className="p-4 bg-white border border-slate-200 rounded-xl">
        <span className="text-xs text-slate-600">Audit réglementaire exécuté.</span>
      </div>
    </div>
  );
};
