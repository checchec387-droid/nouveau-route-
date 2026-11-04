import React from 'react';
import { ShieldCheck } from 'lucide-react';
export const EchangeursComplianceModule: React.FC<{ projectState: any; onNavigate: (m: string) => void; }> = () => (
  <div className="space-y-6"><div className="bg-white rounded-2xl border border-slate-200 p-6"><h1 className="text-xl font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-600" /><span>Audit de Conformité Échangeurs (Cerema)</span></h1></div></div>
);
