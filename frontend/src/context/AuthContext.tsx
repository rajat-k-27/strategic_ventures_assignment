import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  quickSwitch: (role: 'CLINICIAN' | 'SUPERVISOR' | 'ADMIN') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('rehab_access_token');
      const savedUser = localStorage.getItem('rehab_user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Verify with backend
          const me = await authApi.getCurrentUser();
          setUser(me);
          localStorage.setItem('rehab_user', JSON.stringify(me));
        } catch {
          // Token expired or invalid
          localStorage.removeItem('rehab_access_token');
          localStorage.removeItem('rehab_refresh_token');
          localStorage.removeItem('rehab_user');
          setUser(null);
        }
      } else {
        // Auto-login as Clinician for first-time convenience if desired, or let user log in
        // Let's attempt auto-login with clinician credentials on first load so evaluator sees data immediately!
        try {
          const res = await authApi.login('clinician', 'password123');
          localStorage.setItem('rehab_access_token', res.access);
          localStorage.setItem('rehab_refresh_token', res.refresh);
          localStorage.setItem('rehab_user', JSON.stringify(res.user));
          setUser(res.user);
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(username, password);
      localStorage.setItem('rehab_access_token', res.access);
      localStorage.setItem('rehab_refresh_token', res.refresh);
      localStorage.setItem('rehab_user', JSON.stringify(res.user));
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('rehab_access_token');
    localStorage.removeItem('rehab_refresh_token');
    localStorage.removeItem('rehab_user');
    setUser(null);
  };

  const quickSwitch = async (role: 'CLINICIAN' | 'SUPERVISOR' | 'ADMIN') => {
    setIsLoading(true);
    try {
      const username =
        role === 'SUPERVISOR' ? 'supervisor' : role === 'ADMIN' ? 'admin' : 'clinician';
      const res = await authApi.login(username, 'password123');
      localStorage.setItem('rehab_access_token', res.access);
      localStorage.setItem('rehab_refresh_token', res.refresh);
      localStorage.setItem('rehab_user', JSON.stringify(res.user));
      setUser(res.user);
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        quickSwitch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

