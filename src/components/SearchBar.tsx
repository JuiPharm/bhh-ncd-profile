import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  diagnosisFilter: string;
  onDiagnosisChange: (diagnosis: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  diagnosisFilter,
  onDiagnosisChange,
}) => {
  const diagnosisPresets = [
    { value: '', label: 'All Diagnoses' },
    { value: 'DM', label: 'Diabetes (DM)' },
    { value: 'HT', label: 'Hypertension (HT)' },
    { value: 'Dyslipidemia', label: 'Dyslipidemia' },
    { value: 'CHF', label: 'Heart Failure (CHF)' },
    { value: 'Stroke', label: 'Stroke' },
    { value: 'CKD', label: 'Kidney Disease (CKD)' },
    { value: 'Gout', label: 'Gout' },
  ];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 mb-6">
      {/* Text Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by HN, Name, or Phone number..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm transition-colors outline-none text-slate-800"
        />
      </div>

      {/* Diagnosis filter dropdown */}
      <div className="w-full md:w-64">
        <select
          value={diagnosisFilter}
          onChange={(e) => onDiagnosisChange(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm transition-colors outline-none text-slate-800"
        >
          {diagnosisPresets.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
