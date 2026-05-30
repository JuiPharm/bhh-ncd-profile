import React, { useState } from 'react';
import { apiRequest } from '../lib/api';
import { formatDate } from '../lib/dates';
import { calculateAge } from '../lib/clinical';
import { 
  Hospital, 
  Lock, 
  Unlock, 
  Calendar, 
  User, 
  HeartPulse, 
  Activity, 
  Scale, 
  FlaskConical, 
  Beaker,
  ShieldAlert,
  Loader,
  AlertTriangle
} from 'lucide-react';
import { Patient, Diagnosis, Medication, Allergy, Observation, Vaccine } from '../types';

interface SharedProfileResponse {
  success: boolean;
  patient: Partial<Patient>;
  diagnoses: Diagnosis[];
  medications: Medication[];
  allergies: Allergy[];
  observations: Observation[];
  vaccines: Vaccine[];
}

export const SharePortal: React.FC = () => {
  const hashParts = window.location.hash.split('?token=');
  const token = hashParts.length > 1 ? hashParts[1].split('&')[0] : null;

  const [pin, setPin] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile] = useState<SharedProfileResponse | null>(null);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
          <h2 className="font-bold text-slate-800 text-sm">Invalid Share Link</h2>
          <p className="text-xs text-slate-500">The sharing token is missing from the URL. Please verify the link provided by your clinic.</p>
        </div>
      </div>
    );
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6 || isNaN(parseInt(pin))) {
      setErrorMsg('Please enter a valid 6-digit PIN.');
      return;
    }
    setErrorMsg('');
    setIsUnlocking(true);
    try {
      const result = await apiRequest<SharedProfileResponse>('share.getPatientProfile', 'GET', {
        token,
        pin,
        ip_hint: 'patient_portal',
        user_agent: navigator.userAgent
      });
      if (result.success) {
        setProfile(result);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the PIN or link expiration.');
    } finally {
      setIsUnlocking(false);
    }
  };

  // 1. Render PIN entry challenge if not unlocked
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-hospital-900 p-8 text-white text-center flex flex-col items-center border-b border-hospital-850">
            <div className="h-12 w-12 rounded-full bg-hospital-800 flex items-center justify-center mb-3">
              <Lock className="h-5 w-5 text-hospital-300 animate-pulse" />
            </div>
            <h2 className="font-bold text-lg tracking-wide">BHH Patient Portal</h2>
            <p className="text-[10px] text-hospital-300 uppercase tracking-widest mt-1">PDPA SECURED PATIENT PROFILE</p>
          </div>

          <form onSubmit={handleUnlock} className="p-8 space-y-6">
            <div className="text-center text-xs text-slate-500">
              Please enter the 6-digit security PIN provided by your healthcare team to access your NCD profile.
            </div>

            {errorMsg && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-800 font-semibold">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider text-center">Security PIN Code</label>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-xl text-2xl font-bold tracking-widest text-center font-mono outline-none transition-colors"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={isUnlocking}
              className="w-full flex items-center justify-center gap-2 bg-hospital-600 hover:bg-hospital-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-lg"
            >
              {isUnlocking ? (
                <>
                  <Loader className="h-4.5 w-4.5 animate-spin" />
                  Verifying PIN...
                </>
              ) : (
                <>
                  <Unlock className="h-4.5 w-4.5" />
                  Unlock Health Profile
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Render unlocked read-only single patient profile summary
  const { patient, diagnoses, medications, allergies, observations, vaccines } = profile;
  const age = calculateAge(patient.dob || '');

  const latestObs: Record<string, Observation> = {};
  observations.forEach((obs) => {
    const existing = latestObs[obs.observation_type];
    if (!existing || new Date(obs.observation_date).getTime() > new Date(existing.observation_date).getTime()) {
      latestObs[obs.observation_type] = obs;
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Header Brand */}
      <header className="bg-hospital-900 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Hospital className="h-8 w-8 text-hospital-300" />
          <div>
            <h1 className="font-bold text-base leading-tight">Bangkok Hospital Hat Yai</h1>
            <p className="text-[9px] text-hospital-400 font-bold uppercase tracking-wider mt-0.5">Secure Patient Portal</p>
          </div>
        </div>
        <div className="bg-hospital-800 text-hospital-200 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border border-hospital-700">
          Read-Only Access
        </div>
      </header>

      {/* Patient demographics */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-hospital-900 text-hospital-300 flex items-center justify-center font-bold text-lg">
            {patient.first_name?.slice(0, 1).toUpperCase()}{patient.last_name?.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-800">{patient.first_name} {patient.last_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-slate-50 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500">HN: {patient.hn}</span>
              <span className="text-[10px] text-slate-400 capitalize">{patient.gender} | Age: {age} yrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vitals grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
          <HeartPulse className="h-5 w-5 text-red-500 mb-2" />
          <span className="block text-[9px] font-bold text-slate-400 uppercase">Blood Pressure</span>
          <strong className="block text-base font-bold text-slate-800 mt-1">
            {latestObs['SBP']?.value || '-'}/{latestObs['DBP']?.value || '-'} mmHg
          </strong>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
          <Scale className="h-5 w-5 text-indigo-500 mb-2" />
          <span className="block text-[9px] font-bold text-slate-400 uppercase">Weight / BMI</span>
          <strong className="block text-base font-bold text-slate-800 mt-1 font-sans">
            {latestObs['Weight']?.value ? `${latestObs['Weight'].value} kg` : '-'}
          </strong>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
          <FlaskConical className="h-5 w-5 text-amber-500 mb-2" />
          <span className="block text-[9px] font-bold text-slate-400 uppercase">HbA1c Level</span>
          <strong className="block text-base font-bold text-slate-800 mt-1">
            {latestObs['HbA1c']?.value ? `${latestObs['HbA1c'].value} %` : '-'}
          </strong>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
          <Beaker className="h-5 w-5 text-blue-500 mb-2" />
          <span className="block text-[9px] font-bold text-slate-400 uppercase">LDL Cholesterol</span>
          <strong className="block text-base font-bold text-slate-800 mt-1 font-sans">
            {latestObs['LDL']?.value ? `${latestObs['LDL'].value} mg/dL` : '-'}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Diseases */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-xs uppercase border-b pb-1.5 border-slate-50">Active Conditions</h3>
          {diagnoses.length > 0 ? (
            <ul className="list-disc list-inside text-xs space-y-1.5 text-slate-700">
              {diagnoses.map(d => (
                <li key={d.id} className="leading-relaxed">
                  <strong className="font-mono text-hospital-850">{d.icd10 || '-'}</strong>: <strong className="font-semibold text-slate-850">{d.diagnosis_name}</strong> {d.diagnosis_detail}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-xs italic">No active conditions listed.</p>
          )}
        </div>

        {/* Allergies list */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-xs uppercase border-b pb-1.5 border-slate-50">Allergies Warning</h3>
          {allergies.length > 0 ? (
            <div className="space-y-2">
              {allergies.map(a => (
                <div key={a.id} className="border border-slate-100 p-2.5 rounded-lg text-xs flex justify-between items-center bg-red-50/10">
                  <div>
                    <span className="font-semibold text-red-650">{a.allergen}</span>
                    <span className="block text-[9px] text-slate-400 mt-0.5">Reaction: {a.reaction || 'Unknown'}</span>
                  </div>
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    a.severity === 'Severe' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {a.severity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-xs italic">No known drug allergies (NKDA).</p>
          )}
        </div>

        {/* Current Active Meds */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-3 md:col-span-2">
          <h3 className="font-bold text-slate-800 text-xs uppercase border-b pb-1.5 border-slate-50">Current Medications</h3>
          {medications.length > 0 ? (
            <table className="w-full text-left text-xs border border-slate-100 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-4 py-2">Medication Name</th>
                  <th className="px-4 py-2">Dosage / Frequency</th>
                  <th className="px-4 py-2 font-sans">Indication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {medications.map(med => (
                  <tr key={med.id}>
                    <td className="px-4 py-2 font-semibold">
                      {med.generic_name} {med.brand_name ? `(${med.brand_name})` : ''}
                    </td>
                    <td className="px-4 py-2 font-mono text-slate-600">
                      {med.strength} — {med.dosage} {med.frequency}
                    </td>
                    <td className="px-4 py-2 font-semibold text-hospital-700">{med.indication || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-400 text-xs italic">No active medications registered.</p>
          )}
        </div>

        {/* Immunizations history */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-3 md:col-span-2">
          <h3 className="font-bold text-slate-800 text-xs uppercase border-b pb-1.5 border-slate-50">Immunizations</h3>
          {vaccines.length > 0 ? (
            <ul className="list-disc list-inside text-xs space-y-1.5 text-slate-700">
              {vaccines.map(vac => (
                <li key={vac.id}>
                  <strong className="font-semibold text-slate-800">{vac.vaccine_name}</strong> - Given: {formatDate(vac.vaccination_date)} {vac.notes ? `(${vac.notes})` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-xs italic">No immunizations recorded.</p>
          )}
        </div>
      </div>
      
    </div>
  );
};
