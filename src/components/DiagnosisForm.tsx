import React, { useState } from 'react';
import { Plus, Trash, Save } from 'lucide-react';

interface StagedDiagnosis {
  icd10: string;
  diagnosis_name: string;
  diagnosis_detail: string;
  diagnosed_date: string;
  active: boolean;
}

interface DiagnosisFormProps {
  patientId: string;
  onSave: (rows: any[]) => Promise<void>;
}

export const DiagnosisForm: React.FC<DiagnosisFormProps> = ({ patientId, onSave }) => {
  const [staged, setStaged] = useState<StagedDiagnosis[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Single record inputs
  const [icd15, setIcd10] = useState('');
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const presets = [
    { name: 'DM (Diabetes Mellitus)', icd10: 'E11.9', detail: 'Type 2 Diabetes Mellitus' },
    { name: 'HT (Hypertension)', icd10: 'I10', detail: 'Essential Hypertension' },
    { name: 'Dyslipidemia', icd10: 'E78.5', detail: 'Hyperlipidemia, unspecified' },
    { name: 'CHF (Congestive Heart Failure)', icd10: 'I50.9', detail: 'Heart failure, unspecified' },
    { name: 'Stroke', icd10: 'I63.9', detail: 'Cerebral infarction, unspecified' },
    { name: 'CKD (Chronic Kidney Disease)', icd10: 'N18.9', detail: 'Chronic kidney disease, unspecified stage' },
    { name: 'Gout', icd10: 'M10.9', detail: 'Gout, unspecified' },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setName(preset.name.split(' (')[0]); // DM or HT
    setIcd10(preset.icd10);
    setDetail(preset.detail);
  };

  const addStaged = () => {
    if (!name.trim()) {
      setErrorMsg('Diagnosis Name is required.');
      return;
    }
    setErrorMsg('');
    setStaged([
      ...staged,
      {
        icd10: icd15.trim().toUpperCase(),
        diagnosis_name: name.trim(),
        diagnosis_detail: detail.trim(),
        diagnosed_date: date,
        active: true,
      },
    ]);
    // Clear inputs
    setIcd10('');
    setName('');
    setDetail('');
  };

  const removeStaged = (idx: number) => {
    setStaged(staged.filter((_, i) => i !== idx));
  };

  const submitAll = async () => {
    if (staged.length === 0) {
      setErrorMsg('Please add at least one diagnosis to the list first.');
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
      setSuccessMsg('Diagnoses saved successfully.');
      setStaged([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save diagnoses.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-6">
      <h3 className="font-bold text-slate-800 text-sm">Add Diagnoses</h3>

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

      {/* Preset NCD buttons */}
      <div>
        <span className="block text-xs font-semibold text-slate-400 mb-2">Preset NCD Conditions</span>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-hospital-50 border border-slate-200 hover:border-hospital-250 rounded-lg text-xs font-medium text-slate-700 hover:text-hospital-700 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Add New Diagnosis Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">ICD-10 Code</label>
          <input
            type="text"
            value={icd15}
            onChange={(e) => setIcd10(e.target.value)}
            placeholder="e.g. E11.9"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none uppercase"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Diagnosis Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. DM"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Details / Free Text</label>
          <input
            type="text"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="e.g. DM type 2 with CKD stage 3"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Diagnosed Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={addStaged}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add to Staging List
        </button>
      </div>

      {/* Staged Diagnoses Table */}
      {staged.length > 0 && (
        <div className="border border-slate-100 rounded-xl overflow-hidden mt-4">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500">
            Staged Diagnoses to Save ({staged.length})
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                <th className="px-4 py-2">ICD-10</th>
                <th className="px-4 py-2">Diagnosis</th>
                <th className="px-4 py-2">Details</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {staged.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 font-mono font-semibold">{item.icd10 || '-'}</td>
                  <td className="px-4 py-2 font-semibold">{item.diagnosis_name}</td>
                  <td className="px-4 py-2">{item.diagnosis_detail || '-'}</td>
                  <td className="px-4 py-2">{item.diagnosed_date}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeStaged(idx)}
                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-650 rounded transition-colors"
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
            {isSubmitting ? 'Saving List...' : 'Save Diagnoses'}
            <Save className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
