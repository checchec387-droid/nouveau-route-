import React from 'react';
import { History } from 'lucide-react';

interface Props {
  history: any[];
  onClearHistory: () => void;
}

export const HistoryModule: React.FC<Props> = ({ history, onClearHistory }) => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <History className="w-5 h-5 text-sky-900" />
          <span>Historique des Calculs</span>
        </h1>
      </div>
    </div>
  );
};
