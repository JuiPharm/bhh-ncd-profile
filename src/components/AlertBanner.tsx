import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { Observation, Allergy } from '../types';
import { checkClinicalAlert } from '../lib/clinical';

interface AlertBannerProps {
  observations: Observation[];
  allergies: Allergy[];
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ observations, allergies }) => {
  // 1. Get latest value of each observation type
  const latestObs: Record<string, Observation> = {};
  observations.forEach((obs) => {
    const existing = latestObs[obs.observation_type];
    if (!existing || new Date(obs.observation_date).getTime() > new Date(existing.observation_date).getTime()) {
      latestObs[obs.observation_type] = obs;
    }
  });

  // 2. Compute clinical alerts
  const alerts: string[] = [];
  Object.keys(latestObs).forEach((type) => {
    const obs = latestObs[type];
    const alert = checkClinicalAlert(type, obs.value);
    if (alert && alert.isAbnormal) {
      alerts.push(alert.message);
    }
  });

  // 3. Severe allergies check
  const criticalAllergies = allergies.filter(
    (a) => a.severity === 'Severe' || a.severity === 'Moderate'
  );

  if (alerts.length === 0 && criticalAllergies.length === 0) {
    return null; // Return nothing if there are no alerts
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Severe Allergies Alert Banner */}
      {criticalAllergies.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-650 p-4 rounded-xl shadow-sm flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-red-800 text-sm leading-tight">Allergy Warning</h4>
            <div className="text-xs text-red-750 mt-1 space-y-1">
              {criticalAllergies.map((allergy) => (
                <p key={allergy.id}>
                  Patient is allergic to <strong className="font-bold">{allergy.allergen}</strong> with{' '}
                  <span className="uppercase font-semibold text-red-800">{allergy.severity}</span> severity
                  {allergy.reaction ? ` (${allergy.reaction})` : ''}.
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clinical Metrics Warnings */}
      {alerts.length > 0 && (
        <div className="bg-amber-55 border-l-4 border-amber-600 p-4 rounded-xl shadow-sm flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-800 text-sm leading-tight">Clinical Alerts ({alerts.length})</h4>
            <ul className="list-disc list-inside text-xs text-amber-750 mt-1 space-y-0.5">
              {alerts.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
