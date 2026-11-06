import { apiClient } from './client';
import { Patient, ClinicalAssessment, RehabilitationGoal, RAPListItem } from '../types';

export interface PatientListResponse {
  count: number;
  results: Patient[];
}

export interface PatientSummaryResponse {
  patient: Patient;
  assessments: ClinicalAssessment[];
  goals: RehabilitationGoal[];
  raps: RAPListItem[];
}

export const patientsApi = {
  getPatients: async (search?: string, status?: string): Promise<Patient[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (status) params.status = status;
    const res = await apiClient.get<PatientListResponse | Patient[]>('/api/patients/', { params });
    // Handles paginated or raw array format gracefully
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  getPatient: async (id: number): Promise<Patient> => {
    const res = await apiClient.get<Patient>(`/api/patients/${id}/`);
    return res.data;
  },

  createPatient: async (data: Partial<Patient>): Promise<Patient> => {
    const res = await apiClient.post<Patient>('/api/patients/', data);
    return res.data;
  },

  getPatientSummary: async (id: number): Promise<PatientSummaryResponse> => {
    const res = await apiClient.get<PatientSummaryResponse>(`/api/patients/${id}/summary/`);
    return res.data;
  },
};

