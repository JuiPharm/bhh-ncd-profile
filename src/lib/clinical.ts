import { Observation, Goal } from '../types';

/**
 * Calculates BMI based on weight (kg) and height (cm)
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

/**
 * Calculates age in years from DOB string (YYYY-MM-DD)
 */
export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const diffMs = Date.now() - dob.getTime();
  const ageDate = new Date(diffMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

/**
 * Checks abnormal clinical values based on general medical guidelines
 */
export interface ClinicalAlert {
  isAbnormal: boolean;
  severity: 'warning' | 'critical';
  message: string;
}

export function checkClinicalAlert(type: string, valueStr: string | number): ClinicalAlert | null {
  const val = typeof valueStr === 'string' ? parseFloat(valueStr) : valueStr;
  if (isNaN(val)) return null;

  switch (type) {
    case 'SBP':
      if (val >= 140) {
        return { isAbnormal: true, severity: 'critical', message: `High Systolic BP: ${val} mmHg (Target < 140)` };
      }
      break;
    case 'DBP':
      if (val >= 90) {
        return { isAbnormal: true, severity: 'critical', message: `High Diastolic BP: ${val} mmHg (Target < 90)` };
      }
      break;
    case 'HbA1c':
      if (val >= 7.0) {
        return { isAbnormal: true, severity: 'critical', message: `Uncontrolled HbA1c: ${val}% (Target < 7%)` };
      }
      break;
    case 'LDL':
      if (val >= 100) {
        return { isAbnormal: true, severity: 'critical', message: `High LDL: ${val} mg/dL (Target < 100)` };
      } else if (val >= 70) {
        return { isAbnormal: true, severity: 'warning', message: `Elevated LDL: ${val} mg/dL (Ideal for high-risk < 70)` };
      }
      break;
    case 'Glucose':
      if (val >= 126) {
        return { isAbnormal: true, severity: 'critical', message: `High Fasting/POCT Glucose: ${val} mg/dL` };
      }
      break;
    case 'Uric Acid':
      if (val >= 7.0) {
        return { isAbnormal: true, severity: 'warning', message: `High Uric Acid: ${val} mg/dL (Target < 6)` };
      }
      break;
    case 'BMI':
      if (val >= 25) {
        return { isAbnormal: true, severity: 'warning', message: `Overweight BMI: ${val} kg/m² (Target < 25)` };
      } else if (val < 18.5) {
        return { isAbnormal: true, severity: 'warning', message: `Underweight BMI: ${val} kg/m²` };
      }
      break;
    default:
      return null;
  }
  return null;
}

/**
 * Checks a patient's latest observation value against an active goal
 */
export function checkGoalStatus(
  goal: Goal,
  latestObservation: Observation | undefined
): 'Achieved' | 'Not achieved' | 'No recent data' {
  if (!latestObservation) return 'No recent data';
  
  const obsValue = parseFloat(latestObservation.value);
  const goalValue = goal.target_value;
  
  if (isNaN(obsValue) || isNaN(goalValue)) return 'No recent data';
  
  let achieved = false;
  switch (goal.target_operator) {
    case '<':
      achieved = obsValue < goalValue;
      break;
    case '<=':
      achieved = obsValue <= goalValue;
      break;
    case '>':
      achieved = obsValue > goalValue;
      break;
    case '>=':
      achieved = obsValue >= goalValue;
      break;
    case '=':
      achieved = Math.abs(obsValue - goalValue) < 0.001;
      break;
    default:
      return 'No recent data';
  }
  
  return achieved ? 'Achieved' : 'Not achieved';
}
