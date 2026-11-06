import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  ClipboardCheck,
  Target,
  FilePlus,
  ShieldCheck,
  Activity,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Stethoscope,
  Check,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, quickSwitch } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Patients', path: '/', icon: Users },
    { name: 'Assessments', path: '/assessments', icon: ClipboardCheck },
    { name: 'Goals', path: '/goals', icon: Target },
    { name: 'Create RAP', path: '/raps/create', icon: FilePlus },
    { name: 'Approvals', path: '/approvals', icon: ShieldCheck, hasBadge: true },
  ];

  const handleRoleSwitch = (role: 'CLINICIAN' | 'SUPERVISOR' | 'ADMIN') => {
    quickSwitch(role);
    setRoleMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
              <Activity className="h-4.5 w-4.5 stroke-[2.4]" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-slate-900 text-sm tracking-tight block">
                Rehabilitation Action Plan
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Clinical Workflow Portal
              </span>
            </div>
          </Link>

          {/* Center: Clean Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'text-sky-700 bg-sky-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 opacity-80" />
                  <span>{item.name}</span>
                  {item.hasBadge && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 ml-0.5 animate-pulse" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right: Actions & User Persona */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Quick Action: Register */}
            <button
              onClick={() => navigate('/patients/register')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-500" />
              <span>New Patient</span>
            </button>

            {/* User Profile & Role Switcher */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-md border border-slate-200 bg-slate-50/80 hover:bg-slate-100/80 transition-colors"
                >
                  <div
                    className={`h-6 w-6 rounded-md text-white flex items-center justify-center text-xs font-bold ${
                      user.role === 'SUPERVISOR' ? 'bg-purple-600' : 'bg-sky-600'
                    }`}
                  >
                    {user.first_name ? user.first_name[0] : 'U'}
                  </div>

                  <div className="text-left hidden sm:block">
                    <span className="font-semibold text-slate-800 text-xs block leading-tight">
                      {user.full_name?.split(' ')[0] || user.username}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider block ${
                        user.role === 'SUPERVISOR' ? 'text-purple-700' : 'text-sky-700'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                </button>

                {/* Role Switcher Menu */}
                {roleMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 z-50">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Switch Persona (Evaluation)
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-0.5">
                        Currently: {user.full_name}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => handleRoleSwitch('CLINICIAN')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                          user.role === 'CLINICIAN'
                            ? 'bg-sky-50 text-sky-900 font-medium'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-3.5 h-3.5 text-sky-600" />
                          <div className="text-left">
                            <div className="font-medium text-slate-900">Dr. Rajesh Sharma</div>
                            <div className="text-[10px] text-slate-500">Clinician (Therapist)</div>
                          </div>
                        </div>
                        {user.role === 'CLINICIAN' && <Check className="w-3.5 h-3.5 text-sky-600" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRoleSwitch('SUPERVISOR')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                          user.role === 'SUPERVISOR'
                            ? 'bg-purple-50 text-purple-900 font-medium'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          <div className="text-left">
                            <div className="font-medium text-slate-900">Dr. Vikram Malhotra</div>
                            <div className="text-[10px] text-slate-500">Supervisor (Approver)</div>
                          </div>
                        </div>
                        {user.role === 'SUPERVISOR' && <Check className="w-3.5 h-3.5 text-purple-600" />}
                      </button>
                    </div>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-md bg-sky-600 text-white text-xs font-medium hover:bg-sky-700"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-2 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium ${
                      isActive
                        ? 'text-sky-700 bg-sky-50 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 opacity-80" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
            <NavLink
              to="/patients/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <UserPlus className="w-4 h-4 opacity-80" />
              <span>New Patient</span>
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
};
