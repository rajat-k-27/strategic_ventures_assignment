import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { patientsApi } from '../api/patients';
import { assessmentsApi } from '../api/assessments';
import { goalsApi } from '../api/goals';
import { rapsApi } from '../api/raps';
import { Patient, ClinicalAssessment, RehabilitationGoal } from '../types';
import { GoalCard } from '../components/GoalCard';
import { StatusBadge } from '../components/StatusBadge';
import {
  FilePlus,
  ClipboardCheck,
  Target,
  Send,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const RAPCreation: React.FC = () => {
  const { user, quickSwitch } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    patientIdParam ? parseInt(patientIdParam) : null
  );
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Available assessments & goals for selected patient
  const [assessments, setAssessments] = useState<ClinicalAssessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);

  const [goals, setGoals] = useState<RehabilitationGoal[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<number[]>([]);

  // Plan parameters
  const [title, setTitle] = useState('');
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(6);
  const [targetReviewDate, setTargetReviewDate] = useState(
    new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (!selectedPatientId) return;

    const loadPatientClinicalData = async () => {
      try {
        const [patientData, assessmentsData, goalsData] = await Promise.all([
          patientsApi.getPatient(selectedPatientId),
          assessmentsApi.getAssessments(selectedPatientId),
          goalsApi.getGoals(selectedPatientId),
        ]);
        setSelectedPatient(patientData);
        setAssessments(assessmentsData);
        setGoals(goalsData);

        // Pre-select latest assessment if available
        if (assessmentsData.length > 0) {
          setSelectedAssessmentId(assessmentsData[0].id);
        } else {
          setSelectedAssessmentId(null);
        }

        // Pre-select all goals by default
        setSelectedGoalIds(goalsData.map((g) => g.id));

        // Default plan title based on diagnosis
        setTitle(`${patientData.primary_diagnosis.split(' ')[0]} Rehabilitation Action Plan`);
      } catch (err) {
        console.error('Failed to load patient clinical data:', err);
      }
    };

    loadPatientClinicalData();
  }, [selectedPatientId]);

  const toggleGoal = (goalId: number) => {
    setSelectedGoalIds((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const handleSubmit = async (submitNow: boolean) => {
    setErrorMessage(null);

    if (!selectedPatientId) {
      setErrorMessage('Please select a patient.');
      return;
    }
    if (!selectedAssessmentId) {
      setErrorMessage('A baseline clinical assessment is required. Please conduct an assessment first.');
      return;
    }
    if (selectedGoalIds.length === 0) {
      setErrorMessage('Please associate at least one measurable rehabilitation goal.');
      return;
    }
    if (!title.trim() || !clinicalSummary.trim()) {
      setErrorMessage('Plan title and clinical summary are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await rapsApi.createRAP({
        patient: selectedPatientId,
        assessment: selectedAssessmentId,
        goals: selectedGoalIds,
        title,
        clinical_summary: clinicalSummary,
        duration_weeks: durationWeeks,
        target_review_date: targetReviewDate,
        submit_now: submitNow,
      });

      // Redirect to approval dashboard to see the newly drafted or submitted plan!
      navigate('/approvals');
    } catch (err: any) {
      console.error('Failed to generate RAP:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to generate action plan. Please check all fields.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAssessment = assessments.find((a) => a.id === selectedAssessmentId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-sky-600" />
            Generate Rehabilitation Action Plan (RAP)
          </h1>
          <p className="text-xs text-slate-500">
            Synthesize clinical evaluations, measurable milestones, and submit for supervisor approval.
          </p>
        </div>

        {/* Patient Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Patient:
          </label>
          <select
            value={selectedPatientId || ''}
            onChange={(e) => setSelectedPatientId(parseInt(e.target.value))}
            className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 shadow-xs focus:ring-1 focus:ring-sky-500"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.patient_id} — {p.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Patient Profile Banner */}
      {selectedPatient && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                {selectedPatient.full_name}
              </span>
              <span className="text-xs font-mono text-sky-700 font-semibold">
                {selectedPatient.patient_id}
              </span>
              <StatusBadge status={selectedPatient.status} size="sm" />
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              Primary Diagnosis: <span className="font-medium text-slate-900">{selectedPatient.primary_diagnosis}</span>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            RAP ID will be auto-generated: <span className="text-slate-700 font-bold">RAP-YYYYMMDD-XXX</span>
          </div>
        </div>
      )}

      {/* Builder Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Assessment & Associated Goals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Baseline Assessment */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-sky-600" />
                1. Select Baseline Clinical Assessment
              </h3>
              <span className="text-xs text-slate-400">
                {assessments.length} assessment(s) found
              </span>
            </div>

            {assessments.length === 0 ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                <span>No clinical assessment found for this patient.</span>
                <button
                  type="button"
                  onClick={() => navigate(`/assessments?patientId=${selectedPatientId}`)}
                  className="font-bold underline"
                >
                  Conduct Assessment First
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedAssessmentId || ''}
                  onChange={(e) => setSelectedAssessmentId(parseInt(e.target.value))}
                  className="w-full text-xs font-medium border border-slate-300 rounded-lg p-2 bg-white text-slate-800"
                >
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      Assessment on {a.assessment_date} (Mobility: {a.mobility_score}/5, Fall Risk: {a.balance_risk})
                    </option>
                  ))}
                </select>

                {selectedAssessment && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Mobility Score</span>
                        <span className="font-semibold text-slate-800">
                          {selectedAssessment.mobility_score}/5 ({selectedAssessment.assistive_device})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Fall Risk</span>
                        <StatusBadge status={selectedAssessment.balance_risk} size="sm" />
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Assessor</span>
                        <span className="font-semibold text-slate-800">
                          {selectedAssessment.assessor_name}
                        </span>
                      </div>
                    </div>
                    <div className="text-slate-600 italic border-t border-slate-200 pt-2">
                      "{selectedAssessment.clinical_summary}"
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Associate Goals */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                2. Associate Measurable Rehabilitation Goals
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">
                  {selectedGoalIds.length} of {goals.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGoalIds(goals.map((g) => g.id))}
                  className="text-sky-600 hover:underline font-medium"
                >
                  Select All
                </button>
              </div>
            </div>

            {goals.length === 0 ? (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                <span>No rehabilitation goals found for this patient.</span>
                <button
                  type="button"
                  onClick={() => navigate(`/goals?patientId=${selectedPatientId}`)}
                  className="font-bold underline"
                >
                  Create Goals First
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {goals.map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    selectable
                    isSelected={selectedGoalIds.includes(g.id)}
                    onSelect={() => toggleGoal(g.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Plan Details & Submit Options */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              3. Plan Parameters & Schedule
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plan Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Comprehensive Stroke Recovery Plan - Phase 1"
                className="w-full text-xs border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Intervention Summary <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={clinicalSummary}
                onChange={(e) => setClinicalSummary(e.target.value)}
                placeholder="Describe therapeutic modalities, weekly session frequency, progression criteria, and discharge objectives..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration (Weeks)
                </label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(parseInt(e.target.value) || 1)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Review Date
                </label>
                <input
                  type="date"
                  value={targetReviewDate}
                  onChange={(e) => setTargetReviewDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            {/* Workflow Notice */}
            <div className="p-3 rounded-lg bg-sky-50 border border-sky-100 text-[11px] text-sky-800 space-y-1">
              <span className="font-bold block">Approval Workflow Notice:</span>
              <p>
                Saving as <strong>Draft</strong> keeps the plan private for further clinician edits.
              </p>
              <p>
                <strong>Submit for Review</strong> locks the draft and routes it to the Clinical Supervisor queue for formal approval.
              </p>
            </div>

            {/* Action Buttons */}
            {user?.role === 'SUPERVISOR' ? (
              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-2 mt-2">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                  Supervisor View Only
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  You are signed in as <strong>Dr. Vikram Malhotra (Supervisor)</strong>.
                  Action plans are authored by treating Clinicians and submitted for supervisor review.
                </p>
                <button
                  type="button"
                  onClick={() => quickSwitch('CLINICIAN')}
                  className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition-colors"
                >
                  Switch to Clinician (Dr. Rajesh Sharma) to Author Plan
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-slate-600" />
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit for Supervisor Review'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

