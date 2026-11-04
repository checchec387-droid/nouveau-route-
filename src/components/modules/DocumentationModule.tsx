import React from 'react';
import { BookOpen } from 'lucide-react';

export const DocumentationModule: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-sky-900" />
          <span>Documentation Technique & Lexique Officiel ARP</span>
        </h1>
      </div>
    </div>
  );
};
