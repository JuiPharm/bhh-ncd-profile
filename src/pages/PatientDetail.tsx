import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth';
import { apiRequest } from '../lib/api';
import { Layout } from '../components/Layout';
import { formatDate, formatDateBE } from '../lib/dates';
import { calculateAge, checkGoalStatus } from '../lib/clinical';
import { BPTrendChart } from '../components/BPTrendChart';
import { TrendChart } from '../components/TrendChart';
import { AlertBanner } from '../components/AlertBanner';
import { TimelineComponent } from '../components/TimelineComponent';
import { ObservationBatchForm } from '../components/ObservationBatchForm';
import { DiagnosisForm } from '../components/DiagnosisForm';
import { MedicationForm } from '../components/MedicationForm';
import { GoalForm } from '../components/GoalForm';
import { AllergyForm } from '../components/AllergyForm';
import { VaccineForm } from '../components/VaccineForm';

import {
  ArrowLeft,
  Printer,
  Share2,
  Calendar,
  Phone,
  User,
  Activity,
  HeartPulse,
  Scale,
  FlaskConical,
  Beaker,
  Stethoscope,
  Pill,
  Syringe,
  Target,
  ShieldAlert,
  Trash2,
  Key,
  ShieldCheck,
  Eye,
  Trash,
  Loader,
  Copy,
  CheckCircle,
  FileText
} from 'lucide-react';
import { 
  Patient, 
  Diagnosis, 
  Medication, 
  Allergy, 
  Goal, 
  Observation, 
  Vaccine, 
  Benefit,
  ShareToken 
} from '../types';

interface PatientDetailResponse {
  success: boolean;
  patient: Patient;
  diagnoses: Diagnosis[];
  medications: Medication[];
  allergies: Allergy[];
  goals: Goal[];
  observations: Observation[];
  vaccines: Vaccine[];
  shareTokens: ShareToken[];
  benefits: Benefit[];
}

interface PatientDetailProps {
  patientId: string;
}

export const PatientDetail: React.FC<PatientDetailProps> = ({ patientId }) => {
  const queryClient = useQueryClient();
  const { isDoctorOrNurse, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'summary' | 'observations' | 'charts' | 'diagnosis' | 'medications' | 'goals' | 'allergies' | 'vaccines' | 'timeline' | 'sharing'>('summary');
  
  // Share link modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [consentApproved, setConsentApproved] = useState(true);
  const [expiresDays, setExpiresDays] = useState('7');
  const [consentNotes, setConsentNotes] = useState('');
  const [generatedShare, setGeneratedShare] = useState<{ token: string; pin: string; expires_at: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPIN, setCopiedPIN] = useState(false);
  const [actionError, setActionError] = useState('');

  // Fetch patient profile details
  const { data, isLoading, error } = useQuery<PatientDetailResponse>({
    queryKey: ['patientDetail', patientId],
    queryFn: () => apiRequest<PatientDetailResponse>('patients.get', 'GET', { id: patientId }),
    refetchInterval: activeTab === 'summary' || activeTab === 'observations' ? 10000 : 30000,
  });

  // Delete records mutator helper
  const deleteRecordMutation = useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) => 
      apiRequest('POST', 'POST', { action: `${type}.delete`, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientDetail', patientId] });
    }
  });

  // Create share link mutation
  const createShareMutation = useMutation({
    mutationFn: () => {
      const consentText = 'ข้าพเจ้ายินยอมให้แพทย์และบุคลากรทางการแพทย์เปิดเผยข้อมูลการรักษาพยาบาลและการติดตามโรคเรื้อรัง (NCD) ผ่านช่องทางสื่อสารที่ปลอดภัย';
      return apiRequest<any>('share.create', 'POST', {
        patient_id: patientId,
        expires_days: parseInt(expiresDays, 10),
        scope: 'read_profile',
        consent: {
          consent_type: 'Patient Profile Sharing Consent',
          consent_status: consentApproved ? 'Approved' : 'Rejected',
          consent_text_version: 'v1.0-TH',
          given_by: 'Patient',
          notes: `ยินยอม: ${consentNotes}. ข้อความความยินยอม: ${consentText}`
        }
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        setGeneratedShare(result);
        queryClient.invalidateQueries({ queryKey: ['patientDetail', patientId] });
      }
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to create share token.');
    }
  });

  // Revoke share link mutation
  const revokeShareMutation = useMutation({
    mutationFn: (tokenId: string) => apiRequest('share.revoke', 'POST', { token_id: tokenId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientDetail', patientId] });
    }
  });

  // Bulk save observations, diagnosis, meds, goals, allergies, vaccines
  const saveBulkMutation = useMutation({
    mutationFn: ({ type, rows }: { type: string; rows: any[] }) => 
      apiRequest(`${type}.bulkCreate`, 'POST', { rows }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientDetail', patientId] });
    }
  });

  if (isLoading) {
    return (
      <Layout currentRoute="patient-detail">
        <div className="flex items-center justify-center py-20">
          <Loader className="h-8 w-8 text-hospital-600 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout currentRoute="patient-detail">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-800 text-sm font-semibold">
          Failed to load patient profile details. Verify database connectivity.
        </div>
      </Layout>
    );
  }

  const { patient, diagnoses, medications, allergies, goals, observations, vaccines, shareTokens, benefits } = data;
  const age = calculateAge(patient.dob);

  // Group observations by parameter type
  const latestObs: Record<string, Observation> = {};
  observations.forEach((obs) => {
    const existing = latestObs[obs.observation_type];
    if (!existing || new Date(obs.observation_date).getTime() > new Date(existing.observation_date).getTime()) {
      latestObs[obs.observation_type] = obs;
    }
  });

  // Tab definitions
  const tabs = [
    { id: 'summary', name: 'Profile Summary', icon: User },
    { id: 'observations', name: 'Clinical Labs', icon: Activity },
    { id: 'charts', name: 'Clinical Charts', icon: HeartPulse },
    { id: 'diagnosis', name: 'Diagnoses', icon: Stethoscope },
    { id: 'medications', name: 'Medications', icon: Pill },
    { id: 'goals', name: 'Goal Targets', icon: Target },
    { id: 'allergies', name: 'Allergies', icon: ShieldAlert },
    { id: 'vaccines', name: 'Immunizations', icon: Syringe },
    { id: 'timeline', name: 'Care Timeline', icon: Calendar },
  ];

  if (isDoctorOrNurse) {
    tabs.push({ id: 'sharing', name: 'Share Profile (PDPA)', icon: Share2 });
  }

  const handleDelete = (type: string, recordId: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      deleteRecordMutation.mutate({ type, id: recordId });
    }
  };

  const copyToClipboard = (text: string, isPIN: boolean) => {
    navigator.clipboard.writeText(text);
    if (isPIN) {
      setCopiedPIN(true);
      setTimeout(() => setCopiedPIN(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <Layout currentRoute="patient-detail">
      <div className="space-y-6">
        {/* Navigation back and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => window.location.hash = '#/patients'}
            className="flex items-center gap-1.5 text-slate-550 hover:text-hospital-700 text-xs font-semibold self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Registry List
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => window.location.hash = `#/reports?id=${patient.id}`}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs transition-all shadow-sm"
            >
              <Printer className="h-4 w-4" />
              Print Medical Summary
            </button>
          </div>
        </div>

        {/* Patient Profile Card (Primary Header) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-hospital-900 flex items-center justify-center font-bold text-xl text-hospital-250 shrink-0">
              {patient.first_name.slice(0, 1).toUpperCase()}{patient.last_name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-xl text-slate-800 leading-tight">
                  {patient.first_name} {patient.last_name}
                </h2>
                <span className="bg-hospital-50 text-hospital-700 text-xs font-bold px-2 py-0.5 rounded tracking-wider">
                  HN: {patient.hn}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  patient.gender.toLowerCase() === 'male'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-pink-50 text-pink-700'
                }`}>
                  {patient.gender}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 mt-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Age: {age} yrs ({formatDate(patient.dob)})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>Phone: {patient.phone}</span>
                </div>
                {patient.primary_physician && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>Physician: {patient.primary_physician}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            {/* Display simple health package benefits */}
            {benefits.length > 0 && (
              <div className="bg-hospital-50/50 border border-hospital-100/50 rounded-xl p-3 text-xs min-w-[200px]">
                <span className="block font-bold text-hospital-850">Health Package Benefits</span>
                <div className="mt-1.5 space-y-1 text-slate-600 font-medium">
                  {benefits.map(b => (
                    <div key={b.id} className="flex justify-between gap-4">
                      <span>{b.benefit_type}:</span>
                      <strong className="text-hospital-900 font-bold">{b.used_amount.toLocaleString()} / {b.annual_limit.toLocaleString()} B.</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Warnings Panel */}
        <AlertBanner observations={observations} allergies={allergies} />

        {/* Tabs Bar */}
        <div className="border-b border-slate-200 overflow-x-auto">
          <div className="flex space-x-6 min-w-max pb-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSuccessMsg('');
                  setErrorMsg('');
                }}
                className={`flex items-center gap-2 py-3.5 px-1 border-b-2 text-xs font-semibold tracking-wide transition-all ${
                  activeTab === tab.id
                    ? 'border-hospital-600 text-hospital-800'
                    : 'border-transparent text-slate-450 hover:text-slate-750'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="mt-2">
          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Latest Vitals & NCD Badges */}
              <div className="space-y-6 lg:col-span-2">
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Latest Vitals & Clinical Measurements</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* BP */}
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <HeartPulse className="h-5 w-5 text-red-500 mb-2" />
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Blood Pressure</span>
                      <strong className="block text-lg font-bold text-slate-800 mt-1">
                        {latestObs['SBP']?.value || '-'}/{latestObs['DBP']?.value || '-'}
                      </strong>
                      <span className="text-[9px] text-slate-450">{latestObs['SBP'] ? formatDate(latestObs['SBP'].observation_date) : ''}</span>
                    </div>

                    {/* Weight */}
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <Scale className="h-5 w-5 text-indigo-500 mb-2" />
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">Weight</span>
                      <strong className="block text-lg font-bold text-slate-800 mt-1">
                        {latestObs['Weight']?.value ? `${latestObs['Weight'].value} kg` : '-'}
                      </strong>
                      <span className="text-[9px] text-slate-450">{latestObs['Weight'] ? formatDate(latestObs['Weight'].observation_date) : ''}</span>
                    </div>

                    {/* HbA1c */}
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <FlaskConical className="h-5 w-5 text-amber-500 mb-2" />
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">HbA1c</span>
                      <strong className="block text-lg font-bold text-slate-800 mt-1">
                        {latestObs['HbA1c']?.value ? `${latestObs['HbA1c'].value} %` : '-'}
                      </strong>
                      <span className="text-[9px] text-slate-450">{latestObs['HbA1c'] ? formatDate(latestObs['HbA1c'].observation_date) : ''}</span>
                    </div>

                    {/* LDL */}
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <Beaker className="h-5 w-5 text-blue-500 mb-2" />
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase">LDL Cholesterol</span>
                      <strong className="block text-lg font-bold text-slate-800 mt-1">
                        {latestObs['LDL']?.value ? `${latestObs['LDL'].value} mg/dL` : '-'}
                      </strong>
                      <span className="text-[9px] text-slate-450">{latestObs['LDL'] ? formatDate(latestObs['LDL'].observation_date) : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Active Diagnoses List */}
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Active Diagnoses</h3>
                  {diagnoses.filter(d => d.active).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {diagnoses.filter(d => d.active).map(diag => (
                        <div key={diag.id} className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/30 flex justify-between gap-3">
                          <div>
                            <span className="font-mono text-xs font-bold text-hospital-800">{diag.icd10 || '-'}</span>
                            <h4 className="font-bold text-slate-800 text-xs mt-1">{diag.diagnosis_name}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">{diag.diagnosis_detail}</p>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 self-start">
                            {formatDate(diag.diagnosed_date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs py-4 text-center">No active diagnoses logged.</p>
                  )}
                </div>

                {/* Active Medications List */}
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Current Active Medications</h3>
                  {medications.filter(m => m.active).length > 0 ? (
                    <div className="space-y-3">
                      {medications.filter(m => m.active).map(med => (
                        <div key={med.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/20 flex flex-col sm:flex-row justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">
                              {med.generic_name} {med.brand_name ? `(${med.brand_name})` : ''}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                              Dosage: <strong className="font-semibold text-slate-700">{med.strength} {med.dosage}</strong>, {med.frequency}.
                            </p>
                          </div>
                          <div className="text-[10px] text-slate-450 self-start sm:text-right">
                            <span className="block">Start: {formatDate(med.start_date)}</span>
                            {med.indication && <span className="block mt-0.5 font-medium text-hospital-700 bg-hospital-50 px-1.5 py-0.5 rounded">Indication: {med.indication}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs py-4 text-center">No active medications registered.</p>
                  )}
                </div>
              </div>

              {/* Right Column: Goal Targets Checklist */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-sm mb-4">Clinical Goal Matrix</h3>
                  {goals.filter(g => g.active).length > 0 ? (
                    <div className="space-y-3.5">
                      {goals.filter(g => g.active).map((goal) => {
                        const obs = latestObs[goal.goal_type];
                        const status = checkGoalStatus(goal, obs);
                        
                        return (
                          <div key={goal.id} className="border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3">
                            <div>
                              <span className="font-bold text-xs text-slate-700 block">{goal.goal_type} Target</span>
                              <span className="text-[10px] font-medium text-slate-450 mt-1 block">
                                Target: {goal.target_operator} {goal.target_value} {goal.target_unit}
                              </span>
                              {obs && (
                                <span className="text-[9px] text-slate-500 block mt-0.5">
                                  Latest: {obs.value} {obs.unit} ({formatDate(obs.observation_date)})
                                </span>
                              )}
                            </div>
                            <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md shrink-0 ${
                              status === 'Achieved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : status === 'Not achieved'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-slate-100 text-slate-550'
                            }`}>
                              {status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      No goal targets set.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OBSERVATIONS */}
          {activeTab === 'observations' && (
            <div className="space-y-6">
              {/* Batch Entry Form */}
              {isDoctorOrNurse && (
                <ObservationBatchForm
                  patientId={patientId}
                  onSave={async (rows) => {
                    await saveBulkMutation.mutateAsync({ type: 'observations', rows });
                  }}
                />
              )}

              {/* Observations Data Table */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Observation Records History</h3>
                {observations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Parameter Type</th>
                          <th className="px-4 py-3">Value</th>
                          <th className="px-4 py-3">Unit</th>
                          <th className="px-4 py-3">Clinical Notes</th>
                          {isDoctorOrNurse && <th className="px-4 py-3 text-right">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {observations
                          .sort((a, b) => new Date(b.observation_date).getTime() - new Date(a.observation_date).getTime())
                          .map((obs) => (
                            <tr key={obs.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-semibold text-slate-500">{formatDate(obs.observation_date)}</td>
                              <td className="px-4 py-3 font-bold text-hospital-700">{obs.observation_type}</td>
                              <td className="px-4 py-3 font-bold text-slate-800">{obs.value}</td>
                              <td className="px-4 py-3 text-slate-500">{obs.unit}</td>
                              <td className="px-4 py-3 truncate max-w-xs">{obs.notes || '-'}</td>
                              {isDoctorOrNurse && (
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => handleDelete('observations', obs.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs py-8 text-center">No clinical observations recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CHARTS */}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              {/* Dual BP chart */}
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-2">Blood Pressure (BP) Trend</h3>
                <BPTrendChart observations={observations} />
              </div>

              {/* Grid of other vital parameter graphs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-xs mb-2">Weight Trend (kg)</h3>
                  <TrendChart observations={observations} type="Weight" color="#4f46e5" />
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-xs mb-2">HbA1c Trend (%)</h3>
                  <TrendChart observations={observations} type="HbA1c" color="#f59e0b" warningThreshold={7.0} />
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-xs mb-2">LDL Cholesterol Trend (mg/dL)</h3>
                  <TrendChart observations={observations} type="LDL" color="#3b82f6" warningThreshold={100} />
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-xs mb-2">Uric Acid Trend (mg/dL)</h3>
                  <TrendChart observations={observations} type="Uric Acid" color="#ec4899" warningThreshold={7.0} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DIAGNOSIS */}
          {activeTab === 'diagnosis' && (
            <div className="space-y-6">
              {isDoctorOrNurse && (
                <DiagnosisForm
                  patientId={patientId}
                  onSave={async (rows) => {
                    await saveBulkMutation.mutateAsync({ type: 'diagnoses', rows });
                  }}
                />
              )}

              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Patient Diagnosis History</h3>
                {diagnoses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                          <th className="px-4 py-3">ICD-10</th>
                          <th className="px-4 py-3">Disease Registry</th>
                          <th className="px-4 py-3">Details / Free Text</th>
                          <th className="px-4 py-3">Diagnosed Date</th>
                          <th className="px-4 py-3">Status</th>
                          {isDoctorOrNurse && <th className="px-4 py-3 text-right">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {diagnoses
                          .sort((a, b) => new Date(b.diagnosed_date || b.created_at).getTime() - new Date(a.diagnosed_date || a.created_at).getTime())
                          .map((diag) => (
                            <tr key={diag.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-mono font-bold text-slate-800">{diag.icd10 || '-'}</td>
                              <td className="px-4 py-3 font-bold text-hospital-700">{diag.diagnosis_name}</td>
                              <td className="px-4 py-3">{diag.diagnosis_detail || '-'}</td>
                              <td className="px-4 py-3 text-slate-500">{formatDate(diag.diagnosed_date)}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  diag.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {diag.active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              {isDoctorOrNurse && (
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => handleDelete('diagnoses', diag.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs py-8 text-center">No disease registry history logged.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: MEDICATIONS */}
          {activeTab === 'medications' && (
            <div className="space-y-6">
              {isDoctorOrNurse && (
                <MedicationForm
                  patientId={patientId}
                  onSave={async (rows) => {
                    await saveBulkMutation.mutateAsync({ type: 'medications', rows });
                  }}
                />
              )}

              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Patient Medication Profile</h3>
                {medications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                          <th className="px-4 py-3">Generic (Brand)</th>
                          <th className="px-4 py-3">Strength</th>
                          <th className="px-4 py-3">Dosage</th>
                          <th className="px-4 py-3">Frequency</th>
                          <th className="px-4 py-3">Indication</th>
                          <th className="px-4 py-3">Duration</th>
                          <th className="px-4 py-3">Status</th>
                          {isDoctorOrNurse && <th className="px-4 py-3 text-right">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {medications
                          .sort((a, b) => new Date(b.start_date || b.created_at).getTime() - new Date(a.start_date || a.created_at).getTime())
                          .map((med) => (
                            <tr key={med.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-semibold">
                                {med.generic_name} {med.brand_name ? `(${med.brand_name})` : ''}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-800">{med.strength || '-'}</td>
                              <td className="px-4 py-3">{med.dosage || '-'}</td>
                              <td className="px-4 py-3 text-slate-500">{med.frequency}</td>
                              <td className="px-4 py-3 font-medium text-hospital-700">{med.indication || '-'}</td>
                              <td className="px-4 py-3 text-slate-400">
                                {formatDate(med.start_date)} - {med.stop_date ? formatDate(med.stop_date) : 'Ongoing'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  med.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {med.active ? 'Active' : 'Discontinued'}
                                </span>
                              </td>
                              {isDoctorOrNurse && (
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => handleDelete('medications', med.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs py-8 text-center">No medications logged in clinical record.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: GOALS */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              {isDoctorOrNurse && (
                <GoalForm
                  patientId={patientId}
                  onSave={async (rows) => {
                    await saveBulkMutation.mutateAsync({ type: 'goals', rows });
                  }}
                />
              )}

              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Patient Monitoring Targets</h3>
                {goals.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                          <th className="px-4 py-3">Parameter Type</th>
                          <th className="px-4 py-3">Target Formula</th>
                          <th className="px-4 py-3">Goal Unit</th>
                          <th className="px-4 py-3">Current Value</th>
                          <th className="px-4 py-3">Status</th>
                          {isDoctorOrNurse && <th className="px-4 py-3 text-right">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {goals.map((goal) => {
                          const obs = latestObs[goal.goal_type];
                          const status = checkGoalStatus(goal, obs);
                          
                          return (
                            <tr key={goal.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-semibold text-slate-800">{goal.goal_type}</td>
                              <td className="px-4 py-3 font-mono font-bold text-hospital-700">
                                {goal.target_operator} {goal.target_value}
                              </td>
                              <td className="px-4 py-3 text-slate-500">{goal.target_unit}</td>
                              <td className="px-4 py-3">
                                {obs ? (
                                  <strong className="font-semibold text-slate-700">
                                    {obs.value} ({formatDate(obs.observation_date)})
                                  </strong>
                                ) : (
                                  <span className="text-slate-400 italic">No recent readings</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                                  status === 'Achieved'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : status === 'Not achieved'
                                    ? 'bg-red-50 text-red-750'
                                    : 'bg-slate-100 text-slate-550'
                                }`}>
                                  {status}
                                </span>
                              </td>
                              {isDoctorOrNurse && (
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => handleDelete('goals', goal.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs py-8 text-center">No monitoring targets set.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: ALLERGIES */}
          {activeTab === 'allergies' && (
            <div className="space-y-6">
              {isDoctorOrNurse && (
                <AllergyForm
                  patientId={patientId}
                  onSave={async (rows) => {
                    await saveBulkMutation.mutateAsync({ type: 'allergies', rows });
                  }}
                />
              )}

              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Patient Allergy Records</h3>
                {allergies.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                          <th className="px-4 py-3">Allergen</th>
                          <th className="px-4 py-3">Reaction</th>
                          <th className="px-4 py-3">Severity</th>
                          {isDoctorOrNurse && <th className="px-4 py-3 text-right">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {allergies.map((allergy) => (
                          <tr key={allergy.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-red-650">{allergy.allergen}</td>
                            <td className="px-4 py-3">{allergy.reaction || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                allergy.severity === 'Severe'
                                  ? 'bg-red-100 text-red-755'
                                  : allergy.severity === 'Moderate'
                                  ? 'bg-amber-100 text-amber-705'
                                  : allergy.severity === 'Mild'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {allergy.severity}
                              </span>
                            </td>
                            {isDoctorOrNurse && (
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => handleDelete('allergies', allergy.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs py-8 text-center">No known drug/food allergies (NKDA) recorded.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: VACCINES */}
          {activeTab === 'vaccines' && (
            <div className="space-y-6">
              {isDoctorOrNurse && (
                <VaccineForm
                  patientId={patientId}
                  onSave={async (rows) => {
                    await saveBulkMutation.mutateAsync({ type: 'vaccines', rows });
                  }}
                />
              )}

              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Patient Immunization Card</h3>
                {vaccines.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                          <th className="px-4 py-3">Vaccine Name</th>
                          <th className="px-4 py-3">Immunized Date</th>
                          <th className="px-4 py-3">Booster Due Date</th>
                          <th className="px-4 py-3">Administration Notes</th>
                          {isDoctorOrNurse && <th className="px-4 py-3 text-right">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {vaccines
                          .sort((a, b) => new Date(b.vaccination_date).getTime() - new Date(a.vaccination_date).getTime())
                          .map((vac) => (
                            <tr key={vac.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-semibold text-hospital-700">{vac.vaccine_name}</td>
                              <td className="px-4 py-3 font-bold text-slate-500">{formatDate(vac.vaccination_date)}</td>
                              <td className="px-4 py-3 text-slate-850">
                                {vac.next_due_date ? (
                                  <span className={`font-semibold ${
                                    new Date(vac.next_due_date).getTime() < Date.now() ? 'text-warning font-bold' : ''
                                  }`}>
                                    {formatDate(vac.next_due_date)} {new Date(vac.next_due_date).getTime() < Date.now() ? '(Overdue)' : ''}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-3">{vac.notes || '-'}</td>
                              {isDoctorOrNurse && (
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => handleDelete('vaccines', vac.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs py-8 text-center">No vaccination history recorded.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 9: TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-6">Patient Clinical Event Feed</h3>
              <TimelineComponent
                observations={observations}
                diagnoses={diagnoses}
                medications={medications}
                vaccines={vaccines}
                allergies={allergies}
              />
            </div>
          )}

          {/* TAB 10: SHARING LINKS (PDPA COMPLIANT) */}
          {activeTab === 'sharing' && isDoctorOrNurse && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Secure Portal Sharing (PDPA)</h3>
                    <p className="text-xs text-slate-450 mt-1">Generate temporary profile share links for this patient</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsShareModalOpen(true);
                      setGeneratedShare(null);
                      setActionError('');
                    }}
                    className="flex items-center gap-1.5 bg-hospital-600 hover:bg-hospital-700 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors shadow"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Generate Share Link
                  </button>
                </div>

                {/* Exiting Active links registry */}
                <h4 className="font-semibold text-slate-700 text-xs mt-8 mb-3">Active Share Credentials</h4>
                {shareTokens && shareTokens.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-450 uppercase tracking-wider font-semibold">
                          <th className="px-4 py-3">Expiry Date</th>
                          <th className="px-4 py-3">Scope</th>
                          <th className="px-4 py-3">Access Count</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {shareTokens.map((tok) => {
                          const expired = new Date(tok.expires_at).getTime() < Date.now();
                          
                          return (
                            <tr key={tok.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-semibold text-slate-500">{formatDate(tok.expires_at)}</td>
                              <td className="px-4 py-3 font-mono">{tok.scope}</td>
                              <td className="px-4 py-3">{tok.access_count} hits</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  tok.revoked
                                    ? 'bg-red-50 text-red-700'
                                    : expired
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}>
                                  {tok.revoked ? 'Revoked' : expired ? 'Expired' : 'Active'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {!tok.revoked && !expired && (
                                  <button
                                    onClick={() => {
                                      if (confirm('Revoke this link immediately? The patient will lose access.')) {
                                        revokeShareMutation.mutate(tok.id);
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-750 hover:underline font-bold"
                                  >
                                    Revoke
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs py-6 text-center italic">No share credentials generated yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Generate Share Link Modal */}
        {isShareModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col my-8">
              <div className="bg-hospital-900 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-hospital-300" />
                  <span className="font-bold text-sm">Security Profile Share</span>
                </div>
                <button 
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-hospital-300 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!generatedShare ? (
                /* Staging options and Consent check */
                <div className="p-6 space-y-4">
                  {actionError && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-xs text-red-800 font-semibold">
                      {actionError}
                    </div>
                  )}

                  {/* THAI Consent recording text */}
                  <div className="bg-hospital-50 border border-hospital-100/50 rounded-xl p-4 space-y-3">
                    <h5 className="font-bold text-hospital-850 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="h-4.5 w-4.5 text-hospital-600" />
                      บันทึกความยินยอมของคนไข้ (Patient Consent)
                    </h5>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                      ข้าพเจ้ายินยอมให้แพทย์และบุคลากรทางการแพทย์เปิดเผยข้อมูลการรักษาพยาบาลและการติดตามโรคเรื้อรัง (NCD) ผ่านช่องทางสื่อสารที่ปลอดภัย
                    </p>
                    <label className="flex items-start gap-2.5 pt-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentApproved}
                        onChange={(e) => setConsentApproved(e.target.checked)}
                        className="mt-0.5 accent-hospital-600 rounded"
                      />
                      <span className="text-[11px] font-bold text-hospital-900">คนไข้ให้ความยินยอมเปิดเผยข้อมูล (Consent Provided)</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Share Link Expiry</label>
                    <select
                      value={expiresDays}
                      onChange={(e) => setExpiresDays(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                    >
                      <option value="1">1 Day</option>
                      <option value="7">7 Days (Standard)</option>
                      <option value="30">30 Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Consent Notes / Witness Name</label>
                    <input
                      type="text"
                      value={consentNotes}
                      onChange={(e) => setConsentNotes(e.target.value)}
                      placeholder="e.g. Approved verbally / Witness: Nurse Somsri"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-hospital-500 rounded-lg text-xs outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                    <button
                      onClick={() => setIsShareModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => createShareMutation.mutate()}
                      disabled={!consentApproved || createShareMutation.isPending}
                      className="bg-hospital-600 hover:bg-hospital-700 disabled:bg-slate-300 text-white font-bold py-2 px-5 rounded-lg text-xs transition-colors shadow"
                    >
                      {createShareMutation.isPending ? 'Generating...' : 'Confirm and Generate'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Generated Share Link & PIN display */
                <div className="p-6 space-y-6">
                  <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl text-emerald-850 text-xs">
                    <strong className="block font-bold">Credential Link Generated Successfully.</strong>
                    Please provide these details to the patient. Send the PIN separately.
                  </div>

                  <div className="space-y-4">
                    {/* Share Link Row */}
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Patient Portal Share Link</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}${window.location.pathname}#/share?token=${generatedShare.token}`}
                          className="flex-1 bg-slate-50 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono select-all outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}${window.location.pathname}#/share?token=${generatedShare.token}`, false)}
                          className="bg-slate-800 hover:bg-slate-900 text-white p-2 rounded-lg transition-colors shrink-0"
                          title="Copy Link"
                        >
                          {copiedLink ? <CheckCircle className="h-4.5 w-4.5 text-emerald-450" /> : <Copy className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                    </div>

                    {/* PIN challenge */}
                    <div>
                      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Security PIN Code</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={generatedShare.pin}
                          className="w-32 bg-slate-50 px-3 py-2 border border-slate-200 rounded-lg text-lg font-bold text-center tracking-widest font-mono text-hospital-800 outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(generatedShare.pin, true)}
                          className="bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-lg transition-colors shrink-0 flex items-center justify-center"
                          title="Copy PIN"
                        >
                          {copiedPIN ? <CheckCircle className="h-4.5 w-4.5 text-emerald-450" /> : <Copy className="h-4.5 w-4.5" />}
                        </button>
                      </div>
                      <span className="text-[10px] text-red-500 font-semibold block mt-1">
                        * Important: Do not send the link and the PIN inside the same chat message.
                      </span>
                    </div>

                    <div className="border-t border-slate-100 pt-4 mt-6 text-xs text-slate-450">
                      Link Expires on: <strong className="font-semibold">{formatDate(generatedShare.expires_at)}</strong>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setIsShareModalOpen(false)}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-6 rounded-lg text-xs transition-colors shadow"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
