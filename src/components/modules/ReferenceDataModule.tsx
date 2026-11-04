import React, { useState } from 'react';
import { ARP_RULES_REGISTRY } from '../../data/arpReferenceData';

export const ReferenceDataModule: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredRules = ARP_RULES_REGISTRY.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Bibliothèque des Données de Référence ARP (Cerema 2022)
        </h1>
      </div>
      <div className="space-y-4">
        {filteredRules.map((rule) => (
          <div key={rule.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                {rule.id}
              </span>
              <h3 className="text-sm font-bold text-slate-900">{rule.title}</h3>
            </div>
            {rule.formula && (
              <div className="mt-2 p-2 bg-slate-50 border border-slate-100 rounded text-xs font-mono text-slate-800">
                {rule.formula}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-600">{rule.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
