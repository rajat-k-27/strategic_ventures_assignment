import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsApi, PatientSummaryResponse } from '../api/patients';
import { dashboardApi } from '../api/dashboard';
import { Patient, DashboardStats } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import {
  Users,
  Search,
  UserPlus,
  ClipboardCheck,
  Target,
  FilePlus,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  Activity,
  Calendar,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Summary Modal state
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [patientSummary, setPatientSummary] = useState<PatientSummaryResponse | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [patientsData, statsData] = await Promise.all([
        patientsApi.getPatients(search, statusFilter),
        dashboardApi.getStats(),
      ]);
      setPatients(patientsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenSummary = async (patientId: number) => {
    setSelectedPatientId(patientId);
    setIsSummaryLoading(true);
    try {
      const data = await patientsApi.getPatientSummary(patientId);
      setPatientSummary(data);
    } catch (err) {
      console.error('Failed to load patient summary:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Rehabilitation Patient Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage clinical intakes, evaluate functional assessments, and coordinate action plans.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/patients/register')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Register New Patient
          </button>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-sky-500 shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats.patients.total}</div>
              <div className="text-xs text-slate-500 font-medium">Registered Patients</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-amber-500 shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-amber-600 tracking-tight">{stats.raps.submitted}</div>
              <div className="text-xs text-slate-500 font-medium">Pending Approvals</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-rose-500 shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
              <AlertCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-rose-600 tracking-tight">{stats.raps.returned}</div>
              <div className="text-xs text-slate-500 font-medium">Returned for Revision</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-4 border-t-emerald-500 shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <CheckCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">{stats.raps.approved}</div>
              <div className="text-xs text-slate-500 font-medium">Approved Active RAPs</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, name, diagnosis..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Rehabilitation Statuses</option>
            <option value="ACTIVE">Active Rehabilitation</option>
            <option value="DISCHARGED">Discharged</option>
            <option value="ON_HOLD">Medical Hold</option>
          </select>
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Name / Age</th>
                <th className="py-3 px-4">Primary Diagnosis</th>
                <th className="py-3 px-4">Admission</th>
                <th className="py-3 px-4">RAP Status</th>
                <th className="py-3 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Loading patients...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No matching patient records found.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-sky-700">
                      {p.patient_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{p.full_name}</div>
                      <div className="text-[11px] text-slate-400">
                        {p.age} yrs • {p.gender}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-700">
                      <span className="font-medium">{p.primary_diagnosis}</span>
                      {p.secondary_diagnosis && (
                        <div className="text-[10px] text-slate-400 truncate">
                          {p.secondary_diagnosis}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{p.admission_date}</td>
                    <td className="py-3 px-4">
                      {p.active_rap_info ? (
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={p.active_rap_info.status} size="sm" />
                          <span className="text-[10px] text-slate-400 font-mono">
                            v{p.active_rap_info.version}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No RAP</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenSummary(p.id)}
                          title="View Comprehensive Patient Summary"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => navigate(`/assessments?patientId=${p.id}`)}
                          title="Conduct Clinical Assessment"
                          className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors flex items-center gap-1"
                        >
                          <ClipboardCheck className="w-3 h-3 text-sky-600" />
                          Assess
                        </button>

                        <button
                          onClick={() => navigate(`/goals?patientId=${p.id}`)}
                          title="Manage Goals"
                          className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors flex items-center gap-1"
                        >
                          <Target className="w-3 h-3 text-indigo-600" />
                          Goals
                        </button>

                        <button
                          onClick={() => navigate(`/raps/create?patientId=${p.id}`)}
                          title="Create Rehabilitation Action Plan"
                          className="px-2.5 py-1 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[11px] font-semibold transition-colors flex items-center gap-1"
                        >
                          <FilePlus className="w-3 h-3 text-sky-600" />
                          Plan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Summary Modal */}
      <Modal
        isOpen={!!selectedPatientId}
        onClose={() => {
          setSelectedPatientId(null);
          setPatientSummary(null);
        }}
        title="Comprehensive Patient Record"
        subtitle={patientSummary?.patient.full_name}
        maxWidth="3xl"
      >
        {isSummaryLoading || !patientSummary ? (
          <div className="text-center py-12 text-slate-400">Loading clinical summary...</div>
        ) : (
          <div className="space-y-6">
            {/* Header profile */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Patient ID</span>
                <span className="font-mono font-bold text-sky-700">
                  {patientSummary.patient.patient_id}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Age / Gender</span>
                <span className="font-semibold text-slate-800">
                  {patientSummary.patient.age} yrs • {patientSummary.patient.gender}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Admission Date</span>
                <span className="font-semibold text-slate-800">
                  {patientSummary.patient.admission_date}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Status</span>
                <StatusBadge status={patientSummary.patient.status} size="sm" />
              </div>
            </div>

            {/* Diagnosis */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block">Primary Diagnosis:</span>
              <p className="text-slate-700 font-medium">
                {patientSummary.patient.primary_diagnosis}
              </p>
              {patientSummary.patient.secondary_diagnosis && (
                <>
                  <span className="font-bold text-slate-900 block pt-1">
                    Secondary Diagnoses / Medical History:
                  </span>
                  <p className="text-slate-500">{patientSummary.patient.secondary_diagnosis}</p>
                </>
              )}
            </div>

            {/* Clinical Assessments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-sky-600" />
                  Clinical Assessments ({patientSummary.assessments.length})
                </h4>
                <button
                  onClick={() => {
                    setSelectedPatientId(null);
                    navigate(`/assessments?patientId=${patientSummary.patient.id}`);
                  }}
                  className="text-xs text-sky-600 hover:underline font-semibold"
                >
                  + Add Assessment
                </button>
              </div>

              {patientSummary.assessments.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-400 italic">
                  No clinical assessments recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {patientSummary.assessments.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          Date: {a.assessment_date}
                        </span>
                        <span className="text-slate-500">Assessor: {a.assessor_name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700">
                        <div>
                          <strong>Mobility:</strong> Score {a.mobility_score}/5 • Device: {a.assistive_device}
                        </div>
                        <div>
                          <strong>Balance:</strong> Score {a.balance_score}/56 •{' '}
                          <StatusBadge status={a.balance_risk} size="sm" />
                        </div>
                      </div>
                      <p className="text-slate-600 pt-1 italic">{a.clinical_summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Goals */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-600" />
                  Rehabilitation Goals ({patientSummary.goals.length})
                </h4>
                <button
                  onClick={() => {
                    setSelectedPatientId(null);
                    navigate(`/goals?patientId=${patientSummary.patient.id}`);
                  }}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  + Add Goal
                </button>
              </div>

              {patientSummary.goals.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-400 italic">
                  No rehabilitation goals recorded yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {patientSummary.goals.map((g) => (
                    <div key={g.id} className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900">{g.description}</span>
                        <StatusBadge status={g.status} size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Target: <span className="text-slate-700">{g.target}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rehabilitation Action Plans */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-sky-600" />
                Action Plans ({patientSummary.raps.length})
              </h4>
              {patientSummary.raps.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-400 italic">
                  No RAP generated for this patient yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {patientSummary.raps.map((rap) => (
                    <div
                      key={rap.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {rap.rap_id} — {rap.title}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-white font-mono">
                            v{rap.version}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Duration: {rap.duration_weeks} weeks • Target Review: {rap.target_review_date}
                        </div>
                      </div>
                      <StatusBadge status={rap.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

