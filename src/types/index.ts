export type UserRole = 'admin' | 'doctor' | 'nurse' | 'staff' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  hn: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  blood_group: string;
  phone: string;
  line_id: string;
  address: string;
  emergency_contact: string;
  primary_physician: string;
  created_at: string;
  updated_at: string;
}

export interface Diagnosis {
  id: string;
  patient_id: string;
  icd10: string;
  diagnosis_name: string;
  diagnosis_detail: string;
  active: boolean;
  diagnosed_date: string;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  patient_id: string;
  generic_name: string;
  brand_name: string;
  strength: string;
  dosage: string;
  frequency: string;
  indication: string;
  start_date: string;
  stop_date: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Allergy {
  id: string;
  patient_id: string;
  allergen: string;
  reaction: string;
  severity: 'Unknown' | 'Mild' | 'Moderate' | 'Severe';
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  patient_id: string;
  goal_type: string;
  target_operator: '<' | '<=' | '>' | '>=' | '=';
  target_value: number;
  target_unit: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Observation {
  id: string;
  patient_id: string;
  observation_type: 'SBP' | 'DBP' | 'Weight' | 'BMI' | 'HbA1c' | 'LDL' | 'Glucose' | 'Uric Acid' | 'Creatinine';
  value: string; // stored as string to support decimal inputs safely
  unit: string;
  observation_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  patient_id: string;
  visit_date: string;
  provider: string;
  visit_type: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Benefit {
  id: string;
  patient_id: string;
  benefit_type: string;
  annual_limit: number;
  used_amount: number;
  valid_from: string;
  valid_to: string;
  created_at: string;
  updated_at: string;
}

export interface Vaccine {
  id: string;
  patient_id: string;
  vaccine_name: string;
  vaccination_date: string;
  next_due_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  table_name: string;
  record_id: string;
  timestamp: string;
}

export interface PatientConsent {
  id: string;
  patient_id: string;
  consent_type: string;
  consent_status: 'Approved' | 'Rejected' | 'Withdrawn';
  consent_text_version: string;
  given_by: string;
  given_at: string;
  expired_at: string;
  notes: string;
}

export interface ShareToken {
  id: string;
  patient_id: string;
  scope: string;
  expires_at: string;
  revoked: boolean;
  access_count: number;
  created_at: string;
  last_access_at: string;
}

export interface AccessLog {
  id: string;
  patient_id: string;
  share_token_id: string;
  accessed_at: string;
  ip_hint: string;
  user_agent: string;
  result: string;
}

export interface DropdownItem {
  list_name: string;
  value: string;
  label: string;
  sort_order: number;
  active: boolean;
}
