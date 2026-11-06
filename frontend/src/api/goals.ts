import { apiClient } from './client';
import { RehabilitationGoal } from '../types';

export const goalsApi = {
  getGoals: async (patientId?: number, category?: string, status?: string): Promise<RehabilitationGoal[]> => {
    const params: Record<string, any> = {};
    if (patientId) params.patient = patientId;
    if (category) params.category = category;
    if (status) params.status = status;
    const res = await apiClient.get<any>('/api/goals/', { params });
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  createGoal: async (data: Partial<RehabilitationGoal>): Promise<RehabilitationGoal> => {
    const res = await apiClient.post<RehabilitationGoal>('/api/goals/', data);
    return res.data;
  },

  updateGoal: async (id: number, data: Partial<RehabilitationGoal>): Promise<RehabilitationGoal> => {
    const res = await apiClient.patch<RehabilitationGoal>(`/api/goals/${id}/`, data);
    return res.data;
  },
};

