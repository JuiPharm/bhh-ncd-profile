import React, { useState } from 'react';
import { Plus, Trash, Save } from 'lucide-react';

interface StagedMedication {
  generic_name: string;
  brand_name: string;
  strength: string;
  dosage: string;
  frequency: string;
  indication: string;
  start_date: string;
  stop_date: string;
  active: boolean;
}

interface MedicationFormProps {
  patientId: string;
  onSave: (rows: any[]) => Promise<void>;
}

export const MedicationForm: React.FC<MedicationFormProps> = ({ patientId, onSave }) => {
  const [staged, setStaged] = useState<StagedMedication[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Single medication inputs
  const [genericName, setGenericName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [strength, setStrength] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [indication, setIndication] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [stopDate, setStopDate] = useState('');

  // Preset prescriptions from MR. CHUA BEE POH health book
  const presets = [
    { generic: 'Aspilets', brand: 'Aspilets', strength: '81 mg', dosage: '1 tab', freq: 'Once daily am', ind: 'Antiplatelet' },
    { generic: 'Atorvastatin + Ezetimibe', brand: 'Atozet FC (10/10)', strength: '10/10 mg', dosage: '1 tab', freq: 'Once daily pc am', ind: 'Dyslipidemia' },
    { generic: 'Spironolactone', brand: 'BERLACTONE', strength: '25 mg', dosage: '0.25 tab', freq: 'Once daily pc am', ind: 'Heart Failure' },
    { generic: 'Bisoprolol + Amlodipine', brand: 'Concor AM', strength: '5 mg + 5 mg', dosage: '0.5 tab', freq: 'Once daily pc am', ind: 'HT + CHF' },
    { generic: 'Metformin', brand: 'Metformin HB', strength: '500 mg', dosage: '0.5 tab', freq: 'Once daily pc am', ind: 'DM' },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setGenericName(preset.generic);
    setBrandName(preset.brand);
    setStrength(preset.strength);
    setDosage(preset.dosage);
    setFrequency(preset.freq);
    setIndication(preset.ind);
  };

  const addStaged = () => {
    if (!genericName.trim()) {
      setErrorMsg('Generic Name is required.');
      return;
    }
    setErrorMsg('');
    setStaged([
      ...staged,
      {
        generic_name: genericName.trim(),
        brand_name: brandName.trim(),
        strength: strength.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        indication: indication.trim(),
        start_date: startDate,
        stop_date: stopDate,
        active: true,
      },
    ]);
    // Clear inputs
    setGenericName('');
    setBrandName('');
    setStrength('');
    setDosage('');
    setFrequency('');
    setIndication('');
    setStopDate('');
  };

  const removeStaged = (idx: number) => {
    setStaged(staged.filter((_, i) => i !== idx));
  };

  const submitAll = async () => {
    if (staged.length === 0) {
      setErrorMsg('Please add at least one medication to the list first.');
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
      setSuccessMsg('Medications saved successfully.');
      setStaged([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save medications.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-6">
      <h3 className="font-bold text-slate-800 text-sm">Add Medications</h3>

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

      {/* Prescription presets */}
      <div>
        <span className="block text-xs font-semibold text-slate-400 mb-2">Preset Medication Guidelines</span>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.brand}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-hospital-50 border border-slate-200 hover:border-hospital-250 rounded-lg text-xs font-medium text-slate-700 hover:text-hospital-700 transition-colors"
            >
              {preset.brand} ({preset.strength})
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Medication Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Generic Name *</label>
          <input
            type="text"
            value={genericName}
            onChange={(e) => setGenericName(e.target.value)}
            placeholder="e.g. Metformin"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Brand Name</label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. Glucophage"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Strength</label>
          <input
            type="text"
            value={strength}
            onChange={(e) => setStrength(e.target.value)}
            placeholder="e.g. 500 mg"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Dosage</label>
          <input
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g. 1 tab"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Frequency</label>
          <input
            type="text"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            placeholder="e.g. Once daily pc am"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Indication</label>
          <input
            type="text"
            value={indication}
            onChange={(e) => setIndication(e.target.value)}
            placeholder="e.g. DM"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Stop Date (Optional)</label>
          <input
            type="date"
            value={stopDate}
            onChange={(e) => setStopDate(e.target.value)}
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

      {/* Staged Medications Table */}
      {staged.length > 0 && (
        <div className="border border-slate-100 rounded-xl overflow-hidden mt-4">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500">
            Staged Medications to Save ({staged.length})
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                <th className="px-4 py-2">Drug Name</th>
                <th className="px-4 py-2">Strength</th>
                <th className="px-4 py-2">Dosage/Freq</th>
                <th className="px-4 py-2">Indication</th>
                <th className="px-4 py-2">Start Date</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {staged.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 font-semibold">
                    {item.generic_name} {item.brand_name ? `(${item.brand_name})` : ''}
                  </td>
                  <td className="px-4 py-2">{item.strength || '-'}</td>
                  <td className="px-4 py-2">
                    {item.dosage} - {item.frequency}
                  </td>
                  <td className="px-4 py-2">{item.indication || '-'}</td>
                  <td className="px-4 py-2">{item.start_date}</td>
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
            {isSubmitting ? 'Saving List...' : 'Save Medications'}
            <Save className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
