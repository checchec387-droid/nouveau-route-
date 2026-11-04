import React, { useState } from 'react';
import { CalculationStep, RegulatoryRuleReference } from '../../types/arp';
import { ChevronDown, ChevronUp, BookOpen, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  steps: CalculationStep[];
  ruleRef: RegulatoryRuleReference;
  title?: string;
  isCompliant?: boolean;
}

export const CalculationStepCard: React.FC<Props> = ({
  steps,
  ruleRef,
  title = 'Détail du calcul et traçabilité réglementaire',
  isCompliant = true
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-5 py-3.5 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-200 select-none"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          <span className="text-xs text-slate-500 font-mono">
            {ruleRef.chapter} · {ruleRef.section} {ruleRef.table ? `· ${ruleRef.table}` : ''} ({ruleRef.page})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {ruleRef.status === 'CONFIRME_OFFICIEL' ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Source CEREMA 2022 vérifiée
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> À CONFIRMER DANS LE GUIDE ARP
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </div>

      {isOpen && (
        <div className="p-5 space-y-4 text-sm">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Référence Réglementaire Officielle
                </div>
                <div className="text-sm font-medium text-slate-900 mt-0.5">
                  {ruleRef.document} ({ruleRef.edition}) — {ruleRef.chapter}, {ruleRef.section} ({ruleRef.page})
                </div>
                {ruleRef.table && (
                  <div className="text-xs text-slate-600 mt-0.5 font-medium">{ruleRef.table}</div>
                )}
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {ruleRef.description}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className={`inline-block px-2.5 py-1 text-xs rounded font-medium ${
                  ruleRef.status === 'CONFIRME_OFFICIEL'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {ruleRef.status === 'CONFIRME_OFFICIEL' ? 'Règle validée' : 'À confirmer'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Déroulé mathématique pas à pas
            </div>
            {steps.map((st, idx) => (
              <div key={idx} className="rounded-lg border border-slate-100 bg-white p-3.5 hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="font-semibold text-slate-800 text-xs">
                    {st.label}
                  </div>
                  <div className="font-mono text-xs font-semibold text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    {st.result}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-slate-600 my-2 bg-slate-50 p-2 rounded">
                  <div>
                    <span className="text-slate-400">Formule : </span>
                    <span className="text-slate-800 font-medium">{st.formula}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Substitution : </span>
                    <span className="text-slate-800">{st.substitution}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {st.explanation}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Contrôle qualité bureau d'études : {isCompliant ? 'Calcul géométrique conforme' : 'Non-conformité identifiée'}</span>
            <span className="font-mono">Unités SI : mètre (m), pour cent (%)</span>
          </div>
        </div>
      )}
    </div>
  );
};
