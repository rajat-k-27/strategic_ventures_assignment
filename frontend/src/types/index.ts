export type UserRole = 'CLINICIAN' | 'SUPERVISOR' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  title: string;
  license_number: string;
  is_clinician: boolean;
  is_supervisor: boolean;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type PatientStatus = 'ACTIVE' | 'DISCHARGED' | 'ON_HOLD';

export interface Patient {
  id: number;
  patient_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  age: number;
  gender: Gender;
  contact_phone: string;
  contact_email: string;
  address: string;
  primary_diagnosis: string;
  secondary_diagnosis: string;
  admission_date: string;
  status: PatientStatus;
  created_by_name: string;
  active_rap_info: {
    id: number;
    rap_id: string;
    status: RAPStatus;
    version: number;
  } | null;
  created_at: string;
  updated_at: string;
}

export type BalanceRisk = 'LOW' | 'MODERATE' | 'HIGH';

export interface ClinicalAssessment {
  id: number;
  patient: number;
  patient_name?: string;
  patient_id_display?: string;
  assessor: number;
  assessor_name: string;
  assessment_date: string;
  mobility_score: number;
  assistive_device: string;
  mobility_notes: string;
  balance_score: number;
  balance_risk: BalanceRisk;
  balance_notes: string;
  upper_limb_strength_left: string;
  upper_limb_strength_right: string;
  upper_limb_notes: string;
  lower_limb_strength_left: string;
  lower_limb_strength_right: string;
  lower_limb_notes: string;
  clinical_summary: string;
  created_at: string;
  updated_at: string;
}

export type GoalCategory =
  | 'MOBILITY'
  | 'BALANCE'
  | 'UPPER_LIMB'
  | 'LOWER_LIMB'
  | 'ADL'
  | 'COGNITIVE';

export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ACHIEVED' | 'REVISED';

export interface RehabilitationGoal {
  id: number;
  patient: number;
  patient_name?: string;
  patient_id_display?: string;
  category: GoalCategory;
  category_display: string;
  description: string;
  baseline: string;
  target: string;
  expected_completion_date: string;
  status: GoalStatus;
  status_display: string;
  created_at: string;
  updated_at: string;
}

export type RAPStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RETURNED' | 'REVISED';

export interface RAPVersionSnapshot {
  id: number;
  version_number: number;
  status: RAPStatus;
  action: string;
  comments: string;
  snapshot: any;
  performed_by: number | null;
  performed_by_name: string;
  created_at: string;
}

export interface RAPListItem {
  id: number;
  rap_id: string;
  title: string;
  patient: number;
  patient_name: string;
  patient_id_display: string;
  status: RAPStatus;
  status_display: string;
  version: number;
  duration_weeks: number;
  target_review_date: string;
  approval_comments: string;
  goals_count: number;
  created_by_name: string;
  reviewed_by_name: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RAPDetail {
  id: number;
  rap_id: string;
  patient: Patient;
  assessment: ClinicalAssessment;
  goals: RehabilitationGoal[];
  title: string;
  clinical_summary: string;
  duration_weeks: number;
  target_review_date: string;
  status: RAPStatus;
  status_display: string;
  version: number;
  approval_comments: string;
  submitted_at: string | null;
  submitted_by_name: string;
  reviewed_at: string | null;
  reviewed_by_name: string;
  created_by_name: string;
  versions: RAPVersionSnapshot[];
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  patients: {
    total: number;
    active: number;
  };
  clinical: {
    total_assessments: number;
    total_goals: number;
  };
  raps: {
    total: number;
    draft: number;
    submitted: number;
    returned: number;
    revised: number;
    approved: number;
  };
  recent_raps: {
    id: number;
    rap_id: string;
    title: string;
    patient_name: string;
    status: RAPStatus;
    status_display: string;
    version: number;
    updated_at: string;
  }[];
}

