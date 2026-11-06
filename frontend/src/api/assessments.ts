import { apiClient } from './client';
import { ClinicalAssessment } from '../types';

export const assessmentsApi = {
  getAssessments: async (patientId?: number): Promise<ClinicalAssessment[]> => {
    const params: Record<string, any> = {};
    if (patientId) params.patient = patientId;
    const res = await apiClient.get<any>('/api/assessments/', { params });
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  getAssessment: async (id: number): Promise<ClinicalAssessment> => {
    const res = await apiClient.get<ClinicalAssessment>(`/api/assessments/${id}/`);
    return res.data;
  },

  createAssessment: async (data: Partial<ClinicalAssessment>): Promise<ClinicalAssessment> => {
    const res = await apiClient.post<ClinicalAssessment>('/api/assessments/', data);
    return res.data;
  },
};

