import React from 'react';
import { User, Phone, Calendar, ArrowRight } from 'lucide-react';
import { Patient } from '../types';
import { calculateAge } from '../lib/clinical';

interface PatientCardProps {
  patient: Patient;
  activeDiagnosesNames: string[];
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, activeDiagnosesNames }) => {
  const age = calculateAge(patient.dob);
  
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
      <div>
        {/* HN and Gender */}
        <div className="flex items-center justify-between mb-3">
          <span className="bg-hospital-50 text-hospital-700 text-xs font-bold px-2.5 py-1 rounded-md tracking-wider">
            HN: {patient.hn}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
            patient.gender.toLowerCase() === 'male'
              ? 'bg-blue-50 text-blue-700'
              : patient.gender.toLowerCase() === 'female'
              ? 'bg-pink-50 text-pink-700'
              : 'bg-slate-100 text-slate-700'
          }`}>
            {patient.gender}
          </span>
        </div>

        {/* Full Name */}
        <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-hospital-600 transition-colors">
          {patient.first_name} {patient.last_name}
        </h3>

        {/* Demographics details */}
        <div className="mt-4 space-y-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Age: {age} yrs ({patient.dob})</span>
          </div>
          {patient.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>{patient.phone}</span>
            </div>
          )}
        </div>

        {/* Active NCD diagnoses badges */}
        {activeDiagnosesNames.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-4">
            {activeDiagnosesNames.map((diag, index) => (
              <span
                key={index}
                className="bg-hospital-100/60 text-hospital-800 text-[10px] font-semibold px-2 py-0.5 rounded"
              >
                {diag}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-4 h-6 flex items-center">
            <span className="text-slate-450 italic text-[10px]">No NCD registry diagnosis</span>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-50">
        <button
          onClick={() => window.location.hash = `#/patients/${patient.id}`}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-hospital-50 hover:bg-hospital-600 text-hospital-700 hover:text-white text-xs font-semibold transition-all duration-150"
        >
          View Full Profile
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
