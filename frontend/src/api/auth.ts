import { apiClient } from './client';
import { User } from '../types';

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/api/auth/login/', {
      username,
      password,
    });
    return res.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await apiClient.get<User>('/api/auth/me/');
    return res.data;
  },

  getAvailableUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/api/auth/users/');
    return res.data;
  },
};

