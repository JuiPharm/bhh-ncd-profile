import React, { useState } from 'react';
import { Plus, Trash, Save } from 'lucide-react';

interface StagedVaccine {
  vaccine_name: string;
  vaccination_date: string;
  next_due_date: string;
  notes: string;
}

interface VaccineFormProps {
  patientId: string;
  onSave: (rows: any[]) => Promise<void>;
}

export const VaccineForm: React.FC<VaccineFormProps> = ({ patientId, onSave }) => {
  const [staged, setStaged] = useState<StagedVaccine[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Single vaccine inputs
  const [vaccineName, setVaccineName] = useState('');
  const [vacDate, setVacDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const vaccinePresets = [
    { name: 'Influenza (Flu Vaccine)', offsetMonths: 12, notes: 'Annual shot recommended for NCD patients' },
    { name: 'Pneumococcal (PCV13 / PPSV23)', offsetMonths: 60, notes: 'Pneumonia prevention' },
    { name: 'Tetanus, Diphtheria, Pertussis (Tdap)', offsetMonths: 120, notes: 'Booster every 10 years' },
    { name: 'COVID-19 Booster', offsetMonths: 12, notes: 'Annual variant coverage' },
  ];

  const applyPreset = (preset: typeof vaccinePresets[0]) => {
    setVaccineName(preset.name);
    setNotes(preset.notes);
    
    // Auto calculate next due date
    const d = new Date(vacDate);
    if (!isNaN(d.getTime())) {
      d.setMonth(d.getMonth() + preset.offsetMonths);
      setDueDate(d.toISOString().split('T')[0]);
    }
  };

  const addStaged = () => {
    if (!vaccineName.trim()) {
      setErrorMsg('Vaccine Name is required.');
      return;
    }
    setErrorMsg('');
    setStaged([
      ...staged,
      {
        vaccine_name: vaccineName.trim(),
        vaccination_date: vacDate,
        next_due_date: dueDate,
        notes: notes.trim(),
      },
    ]);
    setVaccineName('');
    setDueDate('');
    setNotes('');
  };

  const removeStaged = (idx: number) => {
    setStaged(staged.filter((_, i) => i !== idx));
  };

  const submitAll = async () => {
    if (staged.length === 0) {
      setErrorMsg('Please add at least one vaccine to the list first.');
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
      setSuccessMsg('Vaccines saved successfully.');
      setStaged([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save vaccines.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-6">
      <h3 className="font-bold text-slate-800 text-sm">Add Vaccine Records</h3>

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

      {/* Preset Vaccine choices */}
      <div>
        <span className="block text-xs font-semibold text-slate-400 mb-2">Preset NCD Recommended Vaccines</span>
        <div className="flex flex-wrap gap-2">
          {vaccinePresets.map((preset) => (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Vaccine Name *</label>
          <input
            type="text"
            value={vaccineName}
            onChange={(e) => setVaccineName(e.target.value)}
            placeholder="e.g. Influenza"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Vaccination Date</label>
          <input
            type="date"
            value={vacDate}
            onChange={(e) => setVacDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Next Due Date (Optional)</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Left deltoid, batch #12"
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

      {/* Staged Vaccines list table */}
      {staged.length > 0 && (
        <div className="border border-slate-100 rounded-xl overflow-hidden mt-4">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500">
            Staged Vaccines to Save ({staged.length})
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                <th className="px-4 py-2">Vaccine Name</th>
                <th className="px-4 py-2">Vaccination Date</th>
                <th className="px-4 py-2">Next Due Date</th>
                <th className="px-4 py-2">Notes</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {staged.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 font-semibold text-hospital-700">{item.vaccine_name}</td>
                  <td className="px-4 py-2">{item.vaccination_date}</td>
                  <td className="px-4 py-2">{item.next_due_date || '-'}</td>
                  <td className="px-4 py-2">{item.notes || '-'}</td>
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
            {isSubmitting ? 'Saving List...' : 'Save Vaccines'}
            <Save className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
