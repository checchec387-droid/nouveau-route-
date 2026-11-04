import React, { useRef } from 'react';
import { ProjectMetadata } from '../../types/arp';
import { Save, Upload, Download, RotateCcw } from 'lucide-react';

interface Props {
  metadata: ProjectMetadata;
  onChange: (meta: ProjectMetadata) => void;
  onSave: () => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onResetToDefault: () => void;
}

export const ProjectSettingsModule: React.FC<Props> = ({
  metadata,
  onChange,
  onSave,
  onExportJson,
  onImportJson,
  onResetToDefault
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof ProjectMetadata, val: any) => {
    onChange({
      ...metadata,
      [field]: val
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Paramètres Généraux du Projet Routier
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sky-900 hover:bg-sky-800 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Enregistrer</span>
          </button>
          <button
            onClick={onExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Nom du projet d'aménagement
          </label>
          <input
            type="text"
            value={metadata.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
          />
        </div>
      </div>
    </div>
  );
};
