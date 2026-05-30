import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { Layout } from '../components/Layout';
import { formatDate } from '../lib/dates';
import { calculateAge } from '../lib/clinical';
import { Printer, FileText, ArrowLeft, Loader, Search, Users } from 'lucide-react';
import { Patient, Diagnosis, Medication, Allergy, Observation, Vaccine } from '../types';

interface PatientReportResponse {
  success: boolean;
  patient: Patient;
  diagnoses: Diagnosis[];
  medications: Medication[];
  allergies: Allergy[];
  observations: Observation[];
  vaccines: Vaccine[];
}

interface PatientsListResponse {
  success: boolean;
  patients: Patient[];
}

export const Reports: React.FC = () => {
  // Extract patient ID from hash query parameters e.g., #/reports?id=123
  const hashParts = window.location.hash.split('?id=');
  const patientId = hashParts.length > 1 ? hashParts[1] : null;

  // 1. Fetch single patient data if ID is present
  const { data: patientReport, isLoading: isReportLoading, error: reportError } = useQuery<PatientReportResponse>({
    queryKey: ['patientReport', patientId],
    queryFn: () => apiRequest<PatientReportResponse>('reports.patientSummary', 'GET', { id: patientId }),
    enabled: !!patientId,
  });

  // 2. Fetch all patients if no ID is present
  const { data: registryData, isLoading: isRegistryLoading } = useQuery<PatientsListResponse>({
    queryKey: ['patientsRegistry'],
    queryFn: () => apiRequest<PatientsListResponse>('patients.list', 'GET'),
    enabled: !patientId,
  });

  const handlePrint = () => {
    window.print();
  };

  // Render Single Patient print-friendly report
  if (patientId) {
    if (isReportLoading) {
      return (
        <Layout currentRoute="reports">
          <div className="flex justify-center py-20">
            <Loader className="h-8 w-8 text-hospital-600 animate-spin" />
          </div>
        </Layout>
      );
    }

    if (reportError || !patientReport) {
      return (
        <Layout currentRoute="reports">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-800 text-sm font-semibold">
            Error loading report data. Check connectivity or patient ID.
          </div>
        </Layout>
      );
    }

    const { patient, diagnoses, medications, allergies, observations, vaccines } = patientReport;
    const age = calculateAge(patient.dob);

    // Filter latest observation values
    const latestObs: Record<string, Observation> = {};
    observations.forEach((obs) => {
      const existing = latestObs[obs.observation_type];
      if (!existing || new Date(obs.observation_date).getTime() > new Date(existing.observation_date).getTime()) {
        latestObs[obs.observation_type] = obs;
      }
    });

    return (
      <Layout currentRoute="reports">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Back button and Print button */}
          <div className="flex items-center justify-between gap-4 no-print">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 text-slate-500 hover:text-hospital-700 text-xs font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-hospital-600 hover:bg-hospital-700 text-white font-bold rounded-lg text-xs shadow transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print Report (PDF)
            </button>
          </div>

          {/* Printable Report Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm print:shadow-none print:border-none print:p-0 space-y-6">
            
            {/* Hospital Logo & Report Title */}
            <div className="text-center border-b pb-6 border-slate-100 flex flex-col items-center">
              <span className="font-bold text-lg text-slate-800 uppercase tracking-wider">BANGKOK HOSPITAL HAT YAI</span>
              <span className="text-[10px] text-slate-400 font-bold tracking-widest mt-0.5">NCD CLINICAL SUMMARY REPORT</span>
              <p className="text-[9px] text-slate-450 mt-1">Generated date: {new Date().toLocaleString()}</p>
            </div>

            {/* Demographics section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase border-b pb-1 border-slate-100">Patient Demographics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-450 block">Full Name:</span>
                  <strong className="text-slate-800">{patient.first_name} {patient.last_name}</strong>
                </div>
                <div>
                  <span className="text-slate-450 block">HN:</span>
                  <strong className="text-slate-850 font-mono">{patient.hn}</strong>
                </div>
                <div>
                  <span className="text-slate-450 block">Gender / Age:</span>
                  <strong className="text-slate-800 capitalize">{patient.gender} / {age} yrs</strong>
                </div>
                <div>
                  <span className="text-slate-450 block">Blood Group:</span>
                  <strong className="text-slate-800">{patient.blood_group}</strong>
                </div>
                <div>
                  <span className="text-slate-450 block">Date of Birth:</span>
                  <strong className="text-slate-850">{formatDate(patient.dob)}</strong>
                </div>
                <div>
                  <span className="text-slate-450 block">Phone:</span>
                  <strong className="text-slate-800">{patient.phone}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-450 block">Address:</span>
                  <strong className="text-slate-800 leading-normal">{patient.address}</strong>
                </div>
                <div>
                  <span className="text-slate-450 block">Emergency Contact:</span>
                  <strong className="text-slate-800">{patient.emergency_contact}</strong>
                </div>
                <div>
                  <span className="text-slate-450 block">Primary Physician:</span>
                  <strong className="text-slate-800">{patient.primary_physician}</strong>
                </div>
              </div>
            </div>

            {/* Clinical metrics observations summary */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase border-b pb-1 border-slate-100">Latest Vitals / Lab Observations</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-450 block">Blood Pressure:</span>
                  <strong className="text-slate-800">
                    {latestObs['SBP']?.value || '-'}/{latestObs['DBP']?.value || '-'} mmHg
                  </strong>
                  <span className="text-[9px] text-slate-400 block">{latestObs['SBP'] ? `Date: ${formatDate(latestObs['SBP'].observation_date)}` : ''}</span>
                </div>
                <div>
                  <span className="text-slate-450 block">Body Weight / BMI:</span>
                  <strong className="text-slate-800">
                    {latestObs['Weight']?.value || '-'} kg {latestObs['BMI']?.value ? `(${latestObs['BMI'].value} kg/m²)` : ''}
                  </strong>
                  <span className="text-[9px] text-slate-400 block">{latestObs['Weight'] ? `Date: ${formatDate(latestObs['Weight'].observation_date)}` : ''}</span>
                </div>
                <div>
                  <span className="text-slate-450 block">HbA1c Level:</span>
                  <strong className="text-slate-800">
                    {latestObs['HbA1c']?.value ? `${latestObs['HbA1c'].value} %` : '-'}
                  </strong>
                  <span className="text-[9px] text-slate-400 block">{latestObs['HbA1c'] ? `Date: ${formatDate(latestObs['HbA1c'].observation_date)}` : ''}</span>
                </div>
                <div>
                  <span className="text-slate-450 block">LDL Cholesterol:</span>
                  <strong className="text-slate-800">
                    {latestObs['LDL']?.value ? `${latestObs['LDL'].value} mg/dL` : '-'}
                  </strong>
                  <span className="text-[9px] text-slate-400 block">{latestObs['LDL'] ? `Date: ${formatDate(latestObs['LDL'].observation_date)}` : ''}</span>
                </div>
              </div>
            </div>

            {/* Diagnoses Registry list */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase border-b pb-1 border-slate-100">Chronic NCD Diagnoses</h3>
              {diagnoses.filter(d => d.active).length > 0 ? (
                <ul className="list-disc list-inside text-xs space-y-1.5 text-slate-700">
                  {diagnoses.filter(d => d.active).map(diag => (
                    <li key={diag.id}>
                      <strong className="font-mono text-hospital-800">{diag.icd10 || '-'}</strong>: <strong className="font-semibold text-slate-850">{diag.diagnosis_name}</strong> {diag.diagnosis_detail ? `— ${diag.diagnosis_detail}` : ''} (Diagnosed: {formatDate(diag.diagnosed_date)})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 italic text-xs">No active chronic diagnoses on file.</p>
              )}
            </div>

            {/* Drug Allergies */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase border-b pb-1 border-slate-100">Allergies / Adverse Drug Reactions</h3>
              {allergies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {allergies.map(all => (
                    <div key={all.id} className="border border-slate-100 p-2 rounded">
                      <span className="font-semibold text-red-650">{all.allergen}</span> (Reaction: {all.reaction || 'Unknown'}, Severity: <span className="font-bold">{all.severity}</span>)
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic text-xs">No Known Drug Allergies (NKDA).</p>
              )}
            </div>

            {/* Medications profile */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase border-b pb-1 border-slate-100">Current Medications</h3>
              {medications.filter(m => m.active).length > 0 ? (
                <table className="w-full text-left text-xs border border-slate-100 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="px-4 py-2">Drug Details</th>
                      <th className="px-4 py-2">Strength</th>
                      <th className="px-4 py-2">Dosage/Freq</th>
                      <th className="px-4 py-2">Indication</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {medications.filter(m => m.active).map(med => (
                      <tr key={med.id}>
                        <td className="px-4 py-2 font-semibold">{med.generic_name} {med.brand_name ? `(${med.brand_name})` : ''}</td>
                        <td className="px-4 py-2 font-bold">{med.strength}</td>
                        <td className="px-4 py-2">{med.dosage} - {med.frequency}</td>
                        <td className="px-4 py-2 font-medium">{med.indication || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-400 italic text-xs">No current active medications registered.</p>
              )}
            </div>

            {/* Vaccine history */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase border-b pb-1 border-slate-100">Immunization History</h3>
              {vaccines.length > 0 ? (
                <ul className="list-disc list-inside text-xs space-y-1.5 text-slate-700">
                  {vaccines.map(vac => (
                    <li key={vac.id}>
                      <strong className="font-semibold text-slate-850">{vac.vaccine_name}</strong> - Given: {formatDate(vac.vaccination_date)} {vac.next_due_date ? `(Next Booster Due: ${formatDate(vac.next_due_date)})` : ''} {vac.notes ? `[Notes: ${vac.notes}]` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 italic text-xs">No immunization records logged.</p>
              )}
            </div>
            
          </div>
        </div>
      </Layout>
    );
  }

  // Render general registry reports menu (Clinic Auditing dashboard)
  return (
    <Layout currentRoute="reports">
      <div className="space-y-6">
        <div>
          <h2 className="font-bold text-2xl text-slate-800">Clinic Reports & Audits</h2>
          <p className="text-slate-500 text-xs mt-1">Export NCD patient registers and run clinical summary sheets</p>
        </div>

        {/* Patient selector register */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Export Patient Health Record</h3>
          <p className="text-xs text-slate-500 mb-4">
            Search for a patient below to view and print their clinical summary report sheet:
          </p>

          {isRegistryLoading ? (
            <div className="flex justify-center py-4">
              <Loader className="h-5 w-5 text-hospital-600 animate-spin" />
            </div>
          ) : registryData?.patients && registryData.patients.length > 0 ? (
            <div className="max-w-md space-y-3">
              <label className="block text-xs font-semibold text-slate-400">Select Patient Profile</label>
              <div className="flex gap-2">
                <select
                  id="report-patient-select"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none text-slate-800 font-medium"
                  onChange={(e) => {
                    const pid = e.target.value;
                    if (pid) {
                      window.location.hash = `#/reports?id=${pid}`;
                    }
                  }}
                >
                  <option value="">-- Choose Patient from Registry --</option>
                  {registryData.patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} (HN: {p.hn})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-xs py-2">No patients registered in database.</p>
          )}
        </div>

        {/* Aggregate NCD Patient Registry List */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4">NCD Patient Register Index</h3>
          {registryData?.patients && registryData.patients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-100 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="px-4 py-3.5">HN</th>
                    <th className="px-4 py-3.5">Name</th>
                    <th className="px-4 py-3.5">Gender / Age</th>
                    <th className="px-4 py-3.5">Primary Physician</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {registryData.patients.map((pat) => (
                    <tr key={pat.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-semibold text-hospital-700">{pat.hn}</td>
                      <td className="px-4 py-3 font-bold">{pat.first_name} {pat.last_name}</td>
                      <td className="px-4 py-3 capitalize">{pat.gender} / {calculateAge(pat.dob)} yrs</td>
                      <td className="px-4 py-3">{pat.primary_physician || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => window.location.hash = `#/reports?id=${pat.id}`}
                          className="text-hospital-600 hover:text-hospital-850 font-bold hover:underline"
                        >
                          Generate PDF/Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400 text-xs py-4 text-center">No patients found in database.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};
