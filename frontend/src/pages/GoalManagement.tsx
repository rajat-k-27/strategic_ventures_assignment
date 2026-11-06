import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { patientsApi } from '../api/patients';
import { goalsApi } from '../api/goals';
import { Patient, RehabilitationGoal, GoalCategory, GoalStatus } from '../types';
import { GoalCard } from '../components/GoalCard';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { Target, Plus, Filter, CheckCircle2, Clock } from 'lucide-react';

export const GoalManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    patientIdParam ? parseInt(patientIdParam) : null
  );
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [allGoals, setAllGoals] = useState<RehabilitationGoal[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Add Goal Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newGoal, setNewGoal] = useState({
    category: 'MOBILITY' as GoalCategory,
    description: '',
    baseline: '',
    target: '',
    expected_completion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    status: 'IN_PROGRESS' as GoalStatus,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const patientsData = await patientsApi.getPatients();
        setPatients(patientsData);
        if (!selectedPatientId && patientsData.length > 0) {
          setSelectedPatientId(patientsData[0].id);
        }
      } catch (err) {
        console.error('Failed to load patients:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const loadGoals = async (patientId: number) => {
    try {
      const [patientData, goalsData] = await Promise.all([
        patientsApi.getPatient(patientId),
        goalsApi.getGoals(patientId),
      ]);
      setSelectedPatient(patientData);
      setAllGoals(goalsData);
      setSearchParams({ patientId: patientId.toString() });
    } catch (err) {
      console.error('Failed to load goals:', err);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      loadGoals(selectedPatientId);
    }
  }, [selectedPatientId]);

  // Instant in-memory filter (0ms delay)
  const filteredGoals = useMemo(() => {
    return allGoals.filter((g) => {
      const matchCat = !categoryFilter || g.category === categoryFilter;
      const matchStatus = !statusFilter || g.status === statusFilter;
      return matchCat && matchStatus;
    });
  }, [allGoals, categoryFilter, statusFilter]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    setIsSubmitting(true);
    try {
      const created = await goalsApi.createGoal({
        ...newGoal,
        patient: selectedPatientId,
      });
      setAllGoals((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setNewGoal({
        category: 'MOBILITY',
        description: '',
        baseline: '',
        target: '',
        expected_completion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        status: 'IN_PROGRESS',
      });
    } catch (err) {
      console.error('Failed to create goal:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (goalId: number, newStatus: GoalStatus) => {
    try {
      const updated = await goalsApi.updateGoal(goalId, { status: newStatus });
      setAllGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
    } catch (err) {
      console.error('Failed to update goal status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Rehabilitation Goal Management
          </h1>
          <p className="text-xs text-slate-500">
            Establish measurable baseline and target milestones for action plans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPatientId || ''}
            onChange={(e) => setSelectedPatientId(parseInt(e.target.value))}
            className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 shadow-xs focus:ring-1 focus:ring-sky-500"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.patient_id} — {p.full_name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </div>
      </div>

      {/* Patient Profile Snapshot */}
      {selectedPatient && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
              {selectedPatient.patient_id.split('-').pop()}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs">
                {selectedPatient.full_name} ({selectedPatient.age} yrs • {selectedPatient.gender})
              </div>
              <div className="text-[11px] text-slate-500">
                Diagnosis: <span className="text-slate-800 font-medium">{selectedPatient.primary_diagnosis}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Total Active Goals: <span className="font-bold text-slate-900">{allGoals.length}</span>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          {['', 'MOBILITY', 'BALANCE', 'UPPER_LIMB', 'LOWER_LIMB', 'ADL'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat ? cat.replace('_', ' ') : 'All Categories'}
            </button>
          ))}
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ACHIEVED">Achieved</option>
          </select>
        </div>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No rehabilitation goals found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click 'Add Goal' to create measurable baseline and target milestones for this patient.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onStatusChange={(newStatus) => handleStatusChange(g.id, newStatus)}
            />
          ))}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Rehabilitation Goal"
        subtitle={`Creating measurable goal for ${selectedPatient?.full_name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as GoalCategory })}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
            >
              <option value="MOBILITY">Functional Mobility</option>
              <option value="BALANCE">Balance & Posture</option>
              <option value="UPPER_LIMB">Upper Limb & Fine Motor</option>
              <option value="LOWER_LIMB">Lower Limb & Gait</option>
              <option value="ADL">Activities of Daily Living (ADL)</option>
              <option value="COGNITIVE">Cognitive & Safety Awareness</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Goal Description <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              placeholder="e.g. Independent sit-to-stand and 50m ambulation"
              className="w-full text-xs border border-slate-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Baseline Functional Level <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={newGoal.baseline}
              onChange={(e) => setNewGoal({ ...newGoal, baseline: e.target.value })}
              placeholder="e.g. Requires moderate assist x1 with wheeled walker; max distance 10m"
              className="w-full text-xs border border-slate-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Measurable Target Outcome <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={newGoal.target}
              onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
              placeholder="e.g. Independent transfer; walk 50m with quad cane without loss of balance"
              className="w-full text-xs border border-slate-300 rounded-lg p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Completion Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={newGoal.expected_completion_date}
                onChange={(e) => setNewGoal({ ...newGoal, expected_completion_date: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Status
              </label>
              <select
                value={newGoal.status}
                onChange={(e) => setNewGoal({ ...newGoal, status: e.target.value as GoalStatus })}
                className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ACHIEVED">Achieved</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add Goal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

