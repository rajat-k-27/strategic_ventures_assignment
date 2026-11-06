import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldCheck, Stethoscope, Lock, User as UserIcon } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, quickSwitch } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Invalid username or password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPersona = async (role: 'CLINICIAN' | 'SUPERVISOR' | 'ADMIN') => {
    setError('');
    setIsLoading(true);
    try {
      await quickSwitch(role);
      navigate('/');
    } catch {
      setError('Quick login failed. Ensure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Activity className="h-8 w-8 stroke-[2.2]" />
          </div>
          <h2 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Rehabilitation Action Plan <span className="text-sky-600">Management</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Clinical Workflow & Supervised Approval Portal
          </p>
        </div>

        {/* Quick Demo Personas */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
            Instant Demo Sign-In
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickPersona('CLINICIAN')}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-sky-200 bg-white hover:bg-sky-50 transition-all text-center shadow-xs group"
            >
              <Stethoscope className="w-5 h-5 text-sky-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900">Clinician</span>
              <span className="text-[10px] text-slate-500">Dr. Rajesh Sharma</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPersona('SUPERVISOR')}
              disabled={isLoading}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 transition-all text-center shadow-xs group"
            >
              <ShieldCheck className="w-5 h-5 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900">Supervisor</span>
              <span className="text-[10px] text-slate-500">Dr. Vikram Malhotra</span>
            </button>
          </div>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-slate-400 uppercase">Or sign in manually</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleManualLogin}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="clinician or supervisor"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

