import React, { useState } from 'react';
import { Plus, Trash, Save } from 'lucide-react';

interface StagedAllergy {
  allergen: string;
  reaction: string;
  severity: 'Unknown' | 'Mild' | 'Moderate' | 'Severe';
}

interface AllergyFormProps {
  patientId: string;
  onSave: (rows: any[]) => Promise<void>;
}

export const AllergyForm: React.FC<AllergyFormProps> = ({ patientId, onSave }) => {
  const [staged, setStaged] = useState<StagedAllergy[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Single allergy inputs
  const [allergen, setAllergen] = useState('');
  const [reaction, setReaction] = useState('');
  const [severity, setSeverity] = useState<'Unknown' | 'Mild' | 'Moderate' | 'Severe'>('Unknown');

  const addStaged = () => {
    if (!allergen.trim()) {
      setErrorMsg('Allergen is required.');
      return;
    }
    setErrorMsg('');
    setStaged([
      ...staged,
      {
        allergen: allergen.trim(),
        reaction: reaction.trim(),
        severity,
      },
    ]);
    setAllergen('');
    setReaction('');
    setSeverity('Unknown');
  };

  const removeStaged = (idx: number) => {
    setStaged(staged.filter((_, i) => i !== idx));
  };

  const submitAll = async () => {
    if (staged.length === 0) {
      setErrorMsg('Please add at least one allergy to the list first.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const rows = staged.map(item => ({
        patient_id: patientId,
        ...item,
      }));
      await onSave(rows);
      setSuccessMsg('Allergies saved successfully.');
      setStaged([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save allergies.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-6">
      <h3 className="font-bold text-slate-800 text-sm">Add Drug / Food Allergies</h3>

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded text-xs text-emerald-800 font-semibold">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-800 font-semibold">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Allergen *</label>
          <input
            type="text"
            value={allergen}
            onChange={(e) => setAllergen(e.target.value)}
            placeholder="e.g. Penicillin, Peanuts"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Reaction / Manifestation</label>
          <input
            type="text"
            value={reaction}
            onChange={(e) => setReaction(e.target.value)}
            placeholder="e.g. Skin rash, Anaphylaxis"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Severity</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          >
            <option value="Unknown">Unknown</option>
            <option value="Mild">Mild</option>
            <option value="Moderate">Moderate</option>
            <option value="Severe">Severe (Show critical badge)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={addStaged}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add to Allergy List
        </button>
      </div>

      {/* Staged Allergy List */}
      {staged.length > 0 && (
        <div className="border border-slate-100 rounded-xl overflow-hidden mt-4">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500">
            Staged Allergies ({staged.length})
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                <th className="px-4 py-2">Allergen</th>
                <th className="px-4 py-2">Reaction</th>
                <th className="px-4 py-2">Severity</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {staged.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 font-semibold text-red-650">{item.allergen}</td>
                  <td className="px-4 py-2">{item.reaction || '-'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.severity === 'Severe'
                        ? 'bg-red-100 text-red-700'
                        : item.severity === 'Moderate'
                        ? 'bg-amber-100 text-amber-705'
                        : item.severity === 'Mild'
                        ? 'bg-emerald-105 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeStaged(idx)}
                      className="p-1 hover:bg-red-50 text-slate-450 hover:text-red-650 rounded transition-colors"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {staged.length > 0 && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={submitAll}
            className="flex items-center gap-2 bg-hospital-600 hover:bg-hospital-700 disabled:bg-slate-350 text-white font-bold py-2.5 px-6 rounded-lg text-xs transition-colors shadow"
          >
            {isSubmitting ? 'Saving List...' : 'Save Allergies'}
            <Save className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
