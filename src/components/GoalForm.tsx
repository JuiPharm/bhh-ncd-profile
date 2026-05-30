import React, { useState } from 'react';
import { Plus, Trash, Save } from 'lucide-react';

interface StagedGoal {
  goal_type: string;
  target_operator: '<' | '<=' | '>' | '>=' | '=';
  target_value: number;
  target_unit: string;
  active: boolean;
}

interface GoalFormProps {
  patientId: string;
  onSave: (rows: any[]) => Promise<void>;
}

export const GoalForm: React.FC<GoalFormProps> = ({ patientId, onSave }) => {
  const [staged, setStaged] = useState<StagedGoal[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Single goal inputs
  const [goalType, setGoalType] = useState('HbA1c');
  const [operator, setOperator] = useState<'<' | '<=' | '>' | '>=' | '='>('<');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('%');

  const presetGoals = [
    { label: 'HbA1c < 7 %', type: 'HbA1c', op: '<' as const, val: 7, unit: '%' },
    { label: 'SBP < 140 mmHg', type: 'SBP', op: '<' as const, val: 140, unit: 'mmHg' },
    { label: 'DBP < 90 mmHg', type: 'DBP', op: '<' as const, val: 90, unit: 'mmHg' },
    { label: 'LDL < 70 mg/dL', type: 'LDL', op: '<' as const, val: 70, unit: 'mg/dL' },
    { label: 'LDL < 100 mg/dL', type: 'LDL', op: '<' as const, val: 100, unit: 'mg/dL' },
    { label: 'Uric Acid < 6 mg/dL', type: 'Uric Acid', op: '<' as const, val: 6, unit: 'mg/dL' },
    { label: 'BMI < 25 kg/m²', type: 'BMI', op: '<' as const, val: 25, unit: 'kg/m2' },
  ];

  const applyPreset = (preset: typeof presetGoals[0]) => {
    setGoalType(preset.type);
    setOperator(preset.op);
    setValue(preset.val.toString());
    setUnit(preset.unit);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setGoalType(val);
    // Auto populate default units
    if (val === 'HbA1c') setUnit('%');
    else if (val === 'SBP' || val === 'DBP') setUnit('mmHg');
    else if (val === 'Weight') setUnit('kg');
    else if (val === 'BMI') setUnit('kg/m2');
    else setUnit('mg/dL');
  };

  const addStaged = () => {
    const numVal = parseFloat(value);
    if (isNaN(numVal)) {
      setErrorMsg('Target value must be a valid number.');
      return;
    }
    setErrorMsg('');
    
    // Check if goal is already staged
    if (staged.some(g => g.goal_type === goalType)) {
      setErrorMsg(`A goal for ${goalType} is already in the list.`);
      return;
    }

    setStaged([
      ...staged,
      {
        goal_type: goalType,
        target_operator: operator,
        target_value: numVal,
        target_unit: unit,
        active: true,
      },
    ]);
    setValue('');
  };

  const removeStaged = (idx: number) => {
    setStaged(staged.filter((_, i) => i !== idx));
  };

  const submitAll = async () => {
    if (staged.length === 0) {
      setErrorMsg('Please add at least one goal to the list first.');
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
      setSuccessMsg('Goals saved successfully.');
      setStaged([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save goals.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-6">
      <h3 className="font-bold text-slate-800 text-sm">Add Goals / Targets</h3>

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

      {/* Preset Targets Buttons */}
      <div>
        <span className="block text-xs font-semibold text-slate-400 mb-2">Preset Clinical Targets</span>
        <div className="flex flex-wrap gap-2">
          {presetGoals.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-hospital-50 border border-slate-200 hover:border-hospital-250 rounded-lg text-xs font-medium text-slate-700 hover:text-hospital-700 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Goal Custom Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Goal Type</label>
          <select
            value={goalType}
            onChange={handleTypeChange}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          >
            <option value="HbA1c">HbA1c</option>
            <option value="SBP">SBP (Systolic BP)</option>
            <option value="DBP">DBP (Diastolic BP)</option>
            <option value="Weight">Weight</option>
            <option value="BMI">BMI</option>
            <option value="LDL">LDL Cholesterol</option>
            <option value="Glucose">Glucose (POCT)</option>
            <option value="Uric Acid">Uric Acid</option>
            <option value="Creatinine">Creatinine</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Comparison</label>
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value as any)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          >
            <option value="<">&lt;</option>
            <option value="<=">&lt;=</option>
            <option value=">">&gt;</option>
            <option value=">=">&gt;=</option>
            <option value="=">=</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Value</label>
          <input
            type="number"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 7.0"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Unit</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g. %"
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
          Add to Goal List
        </button>
      </div>

      {/* Staged Goals List */}
      {staged.length > 0 && (
        <div className="border border-slate-100 rounded-xl overflow-hidden mt-4">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 text-xs font-bold text-slate-500">
            Staged Clinical Goals ({staged.length})
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                <th className="px-4 py-2">Parameter</th>
                <th className="px-4 py-2">Comparison Operator</th>
                <th className="px-4 py-2">Target Value</th>
                <th className="px-4 py-2">Unit</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {staged.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 font-semibold">{item.goal_type}</td>
                  <td className="px-4 py-2 font-mono font-bold text-hospital-600">{item.target_operator}</td>
                  <td className="px-4 py-2 font-semibold">{item.target_value}</td>
                  <td className="px-4 py-2">{item.target_unit}</td>
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
            {isSubmitting ? 'Saving Goals...' : 'Save Goals'}
            <Save className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
