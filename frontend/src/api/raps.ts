import { apiClient } from './client';
import { RAPListItem, RAPDetail, RAPVersionSnapshot } from '../types';

export const rapsApi = {
  getRAPs: async (status?: string, patientId?: number): Promise<RAPListItem[]> => {
    const params: Record<string, any> = {};
    if (status && status !== 'ALL') params.status = status;
    if (patientId) params.patient = patientId;
    const res = await apiClient.get<any>('/api/raps/', { params });
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  getRAP: async (id: number): Promise<RAPDetail> => {
    const res = await apiClient.get<RAPDetail>(`/api/raps/${id}/`);
    return res.data;
  },

  createRAP: async (data: {
    patient: number;
    assessment: number;
    goals: number[];
    title: string;
    clinical_summary: string;
    duration_weeks: number;
    target_review_date: string;
    submit_now?: boolean;
  }): Promise<any> => {
    const res = await apiClient.post('/api/raps/', data);
    return res.data;
  },

  updateRAP: async (
    id: number,
    data: {
      patient: number;
      assessment: number;
      goals: number[];
      title: string;
      clinical_summary: string;
      duration_weeks: number;
      target_review_date: string;
      submit_now?: boolean;
    }
  ): Promise<any> => {
    const res = await apiClient.put(`/api/raps/${id}/`, data);
    return res.data;
  },

  submitRAP: async (id: number): Promise<{ message: string; data: RAPDetail }> => {
    const res = await apiClient.post(`/api/raps/${id}/submit/`);
    return res.data;
  },

  approveRAP: async (id: number, comments?: string): Promise<{ message: string; data: RAPDetail }> => {
    const res = await apiClient.post(`/api/raps/${id}/approve/`, { comments });
    return res.data;
  },

  returnRAP: async (id: number, comments: string): Promise<{ message: string; data: RAPDetail }> => {
    const res = await apiClient.post(`/api/raps/${id}/return_plan/`, { comments });
    return res.data;
  },

  getVersions: async (id: number): Promise<RAPVersionSnapshot[]> => {
    const res = await apiClient.get<RAPVersionSnapshot[]>(`/api/raps/${id}/versions/`);
    return res.data;
  },
};

