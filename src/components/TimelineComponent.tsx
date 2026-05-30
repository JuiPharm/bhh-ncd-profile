import React from 'react';
import { 
  Activity, 
  Stethoscope, 
  Pill, 
  Syringe, 
  ShieldAlert, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  Observation, 
  Diagnosis, 
  Medication, 
  Vaccine, 
  Visit, 
  Allergy 
} from '../types';
import { formatDate } from '../lib/dates';

interface TimelineEvent {
  id: string;
  type: 'observation' | 'diagnosis' | 'medication' | 'vaccine' | 'visit' | 'allergy';
  date: string;
  dateVal: number;
  title: string;
  description: string;
  meta?: string;
  active?: boolean;
}

interface TimelineComponentProps {
  observations?: Observation[];
  diagnoses?: Diagnosis[];
  medications?: Medication[];
  vaccines?: Vaccine[];
  visits?: Visit[];
  allergies?: Allergy[];
}

export const TimelineComponent: React.FC<TimelineComponentProps> = ({
  observations = [],
  diagnoses = [],
  medications = [],
  vaccines = [],
  visits = [],
  allergies = [],
}) => {
  const events: TimelineEvent[] = [];

  // Group BP observations (SBP/DBP) on same day if possible, or print individual rows
  const bpObservationsGrouped: Record<string, { SBP?: string; DBP?: string; notes?: string }> = {};
  
  observations.forEach((obs) => {
    const val = obs.value;
    const dateStr = obs.observation_date.split('T')[0];
    
    if (obs.observation_type === 'SBP') {
      if (!bpObservationsGrouped[dateStr]) bpObservationsGrouped[dateStr] = {};
      bpObservationsGrouped[dateStr].SBP = val;
      if (obs.notes) bpObservationsGrouped[dateStr].notes = obs.notes;
    } else if (obs.observation_type === 'DBP') {
      if (!bpObservationsGrouped[dateStr]) bpObservationsGrouped[dateStr] = {};
      bpObservationsGrouped[dateStr].DBP = val;
      if (obs.notes) bpObservationsGrouped[dateStr].notes = obs.notes;
    } else {
      // Individual observation
      events.push({
        id: obs.id,
        type: 'observation',
        date: obs.observation_date,
        dateVal: new Date(obs.observation_date).getTime(),
        title: `${obs.observation_type} Recorded`,
        description: `Value: ${obs.value} ${obs.unit}`,
        meta: obs.notes || undefined,
      });
    }
  });

  // Add grouped BP events
  Object.keys(bpObservationsGrouped).forEach((dateKey) => {
    const bp = bpObservationsGrouped[dateKey];
    if (bp.SBP || bp.DBP) {
      const sbpVal = bp.SBP || '-';
      const dbpVal = bp.DBP || '-';
      events.push({
        id: `bp-${dateKey}`,
        type: 'observation',
        date: dateKey,
        dateVal: new Date(dateKey).getTime(),
        title: 'Blood Pressure Recorded',
        description: `Blood pressure reading: ${sbpVal}/${dbpVal} mmHg`,
        meta: bp.notes || undefined,
      });
    }
  });

  // Diagnoses
  diagnoses.forEach((d) => {
    events.push({
      id: d.id,
      type: 'diagnosis',
      date: d.diagnosed_date || d.created_at,
      dateVal: new Date(d.diagnosed_date || d.created_at).getTime(),
      title: `Diagnosis: ${d.diagnosis_name} ${d.icd10 ? `(${d.icd10})` : ''}`,
      description: d.diagnosis_detail || 'No description detail entered.',
      active: d.active,
    });
  });

  // Medications
  medications.forEach((m) => {
    events.push({
      id: m.id,
      type: 'medication',
      date: m.start_date || m.created_at,
      dateVal: new Date(m.start_date || m.created_at).getTime(),
      title: `Prescribed: ${m.generic_name} ${m.brand_name ? `(${m.brand_name})` : ''}`,
      description: `Dosage: ${m.strength || ''} ${m.dosage || ''} - ${m.frequency || ''}. Indication: ${m.indication || 'Unspecified'}`,
      meta: m.stop_date ? `Planned Stop: ${formatDate(m.stop_date)}` : undefined,
      active: m.active,
    });
  });

  // Vaccines
  vaccines.forEach((v) => {
    events.push({
      id: v.id,
      type: 'vaccine',
      date: v.vaccination_date,
      dateVal: new Date(v.vaccination_date).getTime(),
      title: `Vaccinated: ${v.vaccine_name}`,
      description: v.notes || 'Routine immunization.',
      meta: v.next_due_date ? `Next Due Booster: ${formatDate(v.next_due_date)}` : undefined,
    });
  });

  // Visits
  visits.forEach((vi) => {
    events.push({
      id: vi.id,
      type: 'visit',
      date: vi.visit_date,
      dateVal: new Date(vi.visit_date).getTime(),
      title: `Clinic Visit: ${vi.visit_type}`,
      description: `Provider: ${vi.provider}. ${vi.notes || ''}`,
    });
  });

  // Allergies
  allergies.forEach((a) => {
    events.push({
      id: a.id,
      type: 'allergy',
      date: a.created_at,
      dateVal: new Date(a.created_at).getTime(),
      title: `Allergy Logged: ${a.allergen}`,
      description: `Severity: ${a.severity}. Reaction: ${a.reaction || 'Unknown reaction'}`,
    });
  });

  // Sort descending by date
  events.sort((a, b) => b.dateVal - a.dateVal);

  if (events.length === 0) {
    return (
      <div className="text-center py-8 bg-white border border-slate-100 rounded-xl">
        <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">No historical clinical events recorded for this patient.</p>
      </div>
    );
  }

  // Icons map based on event type
  const iconConfig = {
    observation: { icon: Activity, bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    diagnosis: { icon: Stethoscope, bg: 'bg-sky-50 text-sky-700 border-sky-100' },
    medication: { icon: Pill, bg: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    vaccine: { icon: Syringe, bg: 'bg-purple-50 text-purple-700 border-purple-100' },
    visit: { icon: Calendar, bg: 'bg-slate-50 text-slate-700 border-slate-150' },
    allergy: { icon: ShieldAlert, bg: 'bg-red-50 text-red-700 border-red-100' },
  };

  return (
    <div className="relative border-l-2 border-slate-100 pl-6 ml-4 space-y-6 py-2">
      {events.map((evt) => {
        const config = iconConfig[evt.type];
        const IconComponent = config.icon;

        return (
          <div key={evt.id} className="relative group">
            {/* Left bullet circle containing icon */}
            <span className={`absolute -left-[37px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full border bg-white ${config.bg} shadow-sm group-hover:scale-105 transition-transform`}>
              <IconComponent className="h-4 w-4" />
            </span>

            {/* Event Box card */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <span className="text-xs font-bold text-slate-400">
                  {formatDate(evt.date)}
                </span>
                
                {evt.active !== undefined && (
                  <span className={`inline-block self-start text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                    evt.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {evt.active ? 'Active' : 'Historical'}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-slate-800 text-sm">{evt.title}</h4>
              <p className="text-xs text-slate-650 mt-1 leading-relaxed">{evt.description}</p>
              
              {evt.meta && (
                <div className="mt-2 text-[10px] text-slate-450 italic bg-slate-50 px-2 py-1 rounded border border-slate-100/50">
                  {evt.meta}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
