import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Plus } from 'lucide-react';

const observationFormSchema = z.object({
  observation_date: z.string().min(1, 'Observation date is required'),
  SBP: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), 'Must be a number'),
  DBP: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), 'Must be a number'),
  Weight: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), 'Must be a number'),
  BMI: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), 'Must be a number'),
  HbA1c: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), 'Must be a number'),
  LDL: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), 'Must be a number'),
  Glucose: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), 'Must be a number'),
  Uric_Acid: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), 'Must be a number'),
  Creatinine: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), 'Must be a number'),
  Lab_GFR: z.string().optional().refine(val => !val || !isNaN(parseFloat(val)), 'Must be a number'),
  notes: z.string().optional(),
});

type ObservationFormValues = z.infer<typeof observationFormSchema>;

interface ObservationBatchFormProps {
  patientId: string;
  onSave: (rows: any[]) => Promise<void>;
}

export const ObservationBatchForm: React.FC<ObservationBatchFormProps> = ({ patientId, onSave }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ObservationFormValues>({
    resolver: zodResolver(observationFormSchema),
    defaultValues: {
      observation_date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const weightVal = watch('Weight');
  const [heightCm, setHeightCm] = React.useState('');

  // Auto calculate BMI if height is supplied
  React.useEffect(() => {
    const w = parseFloat(weightVal || '');
    const h = parseFloat(heightCm || '');
    if (w > 0 && h > 0) {
      const hM = h / 100;
      const bmi = (w / (hM * hM)).toFixed(1);
      setValue('BMI', bmi);
    }
  }, [weightVal, heightCm, setValue]);

  const onSubmit = async (values: ObservationFormValues) => {
    setIsSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const rows: any[] = [];
      const date = values.observation_date;
      const notes = values.notes || '';

      const fields: Array<{ key: keyof ObservationFormValues; type: string; unit: string }> = [
        { key: 'SBP', type: 'SBP', unit: 'mmHg' },
        { key: 'DBP', type: 'DBP', unit: 'mmHg' },
        { key: 'Weight', type: 'Weight', unit: 'kg' },
        { key: 'BMI', type: 'BMI', unit: 'kg/m2' },
        { key: 'HbA1c', type: 'HbA1c', unit: '%' },
        { key: 'LDL', type: 'LDL', unit: 'mg/dL' },
        { key: 'Glucose', type: 'Glucose', unit: 'mg/dL' },
        { key: 'Uric_Acid', type: 'Uric Acid', unit: 'mg/dL' },
        { key: 'Creatinine', type: 'Creatinine', unit: 'mg/dL' },
        { key: 'Lab_GFR', type: 'Lab GFR', unit: 'mL/min/1.73m²' },
      ];

      fields.forEach(({ key, type, unit }) => {
        const val = values[key];
        if (val !== undefined && val !== '') {
          rows.push({
            patient_id: patientId,
            observation_type: type,
            value: parseFloat(val).toString(),
            unit,
            observation_date: date,
            notes: notes,
          });
        }
      });

      if (rows.length === 0) {
        throw new Error('Please fill in at least one clinical observation value.');
      }

      await onSave(rows);
      setSuccessMsg('Observations saved successfully.');
      reset({
        observation_date: new Date().toISOString().split('T')[0],
        notes: '',
        SBP: '',
        DBP: '',
        Weight: '',
        BMI: '',
        HbA1c: '',
        LDL: '',
        Glucose: '',
        Uric_Acid: '',
        Creatinine: '',
        Lab_GFR: '',
      });
      setHeightCm('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save observations.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm mb-4">Batch Observation Form</h3>
        
        {successMsg && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded text-xs text-emerald-800 font-semibold mb-4">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-800 font-semibold mb-4">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Observation Date</label>
            <input
              type="date"
              {...register('observation_date')}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none"
            />
            {errors.observation_date && (
              <span className="text-[10px] text-red-500 mt-1">{errors.observation_date.message}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Height (cm) <span className="text-[10px] text-slate-400 font-normal">(For BMI calc)</span></label>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="e.g. 170"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none"
            />
          </div>
        </div>

        <hr className="border-slate-100 my-4" />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">SBP (mmHg)</label>
            <input
              type="text"
              {...register('SBP')}
              placeholder="e.g. 120"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none"
            />
            {errors.SBP && <span className="text-[10px] text-red-500">{errors.SBP.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">DBP (mmHg)</label>
            <input
              type="text"
              {...register('DBP')}
              placeholder="e.g. 80"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none"
            />
            {errors.DBP && <span className="text-[10px] text-red-500">{errors.DBP.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Weight (kg)</label>
            <input
              type="text"
              {...register('Weight')}
              placeholder="e.g. 70"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none"
            />
            {errors.Weight && <span className="text-[10px] text-red-500">{errors.Weight.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">BMI (kg/m²)</label>
            <input
              type="text"
              {...register('BMI')}
              placeholder="e.g. 24.2"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none"
            />
            {errors.BMI && <span className="text-[10px] text-red-500">{errors.BMI.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">HbA1c (%)</label>
            <input
              type="text"
              {...register('HbA1c')}
              placeholder="e.g. 6.5"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none"
            />
            {errors.HbA1c && <span className="text-[10px] text-red-500">{errors.HbA1c.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">LDL (mg/dL)</label>
            <input
              type="text"
              {...register('LDL')}
              placeholder="e.g. 90"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none"
            />
            {errors.LDL && <span className="text-[10px] text-red-500">{errors.LDL.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Glucose (mg/dL)</label>
            <input
              type="text"
              {...register('Glucose')}
              placeholder="e.g. 100"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none"
            />
            {errors.Glucose && <span className="text-[10px] text-red-500">{errors.Glucose.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Uric Acid (mg/dL)</label>
            <input
              type="text"
              {...register('Uric_Acid')}
              placeholder="e.g. 5.5"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none"
            />
            {errors.Uric_Acid && <span className="text-[10px] text-red-500">{errors.Uric_Acid.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Creatinine (mg/dL)</label>
            <input
              type="text"
              {...register('Creatinine')}
              placeholder="e.g. 0.9"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none"
            />
            {errors.Creatinine && <span className="text-[10px] text-red-500">{errors.Creatinine.message}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Lab GFR (mL/min/1.73m²)</label>
            <input
              type="text"
              {...register('Lab_GFR')}
              placeholder="e.g. 90"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none"
            />
            {errors.Lab_GFR && <span className="text-[10px] text-red-500">{errors.Lab_GFR.message}</span>}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">General Notes</label>
          <input
            type="text"
            {...register('notes')}
            placeholder="Describe visit context or clinical details..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-sm outline-none"
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-hospital-600 hover:bg-hospital-700 disabled:bg-slate-300 text-white font-bold py-2.5 px-6 rounded-lg text-xs transition-colors shadow"
          >
            {isSubmitting ? 'Saving...' : 'Save Observations'}
            <Save className="h-4 w-4" />
          </button>
        </div>
      </div>
    </form>
  );
};
