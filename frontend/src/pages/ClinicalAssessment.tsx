import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { patientsApi } from '../api/patients';
import { assessmentsApi } from '../api/assessments';
import { Patient, ClinicalAssessment as AssessmentType, BalanceRisk } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  ClipboardCheck,
  CheckCircle,
  Clock,
  User,
  Plus,
  Activity,
  ShieldAlert,
} from 'lucide-react';

export const ClinicalAssessment: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    patientIdParam ? parseInt(patientIdParam) : null
  );
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [assessments, setAssessments] = useState<AssessmentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    assessment_date: new Date().toISOString().split('T')[0],
    mobility_score: 3,
    assistive_device: 'Rolling Walker',
    mobility_notes: '',
    balance_score: 30,
    balance_risk: 'MODERATE' as BalanceRisk,
    balance_notes: '',
    upper_limb_strength_left: '4/5',
    upper_limb_strength_right: '5/5',
    upper_limb_notes: '',
    lower_limb_strength_left: '3/5',
    lower_limb_strength_right: '5/5',
    lower_limb_notes: '',
    clinical_summary: '',
  });

  // Load patients list on mount
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

  // When selectedPatientId changes, load patient details & assessments
  useEffect(() => {
    if (!selectedPatientId) return;

    const loadPatientDetails = async () => {
      try {
        const [patientData, assessmentsData] = await Promise.all([
          patientsApi.getPatient(selectedPatientId),
          assessmentsApi.getAssessments(selectedPatientId),
        ]);
        setSelectedPatient(patientData);
        setAssessments(assessmentsData);
        setSearchParams({ patientId: selectedPatientId.toString() });
      } catch (err) {
        console.error('Failed to load patient assessments:', err);
      }
    };
    loadPatientDetails();
  }, [selectedPatientId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'mobility_score' || name === 'balance_score' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    setIsSubmitting(true);
    setSuccessMsg(null);

    try {
      const created = await assessmentsApi.createAssessment({
        ...formData,
        patient: selectedPatientId,
      });

      setAssessments((prev) => [created, ...prev]);
      setSuccessMsg('Clinical assessment saved successfully and ready to be linked to an RAP!');

      // Reset text inputs
      setFormData((prev) => ({
        ...prev,
        mobility_notes: '',
        balance_notes: '',
        upper_limb_notes: '',
        lower_limb_notes: '',
        clinical_summary: '',
      }));
    } catch (err) {
      console.error('Failed to save assessment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Patient Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Clinical Assessment Records
          </h1>
          <p className="text-xs text-slate-500">
            Capture standardized findings across mobility, balance, upper, and lower limbs.
          </p>
        </div>

        {/* Patient Picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Select Patient:
          </label>
          <select
            value={selectedPatientId || ''}
            onChange={(e) => setSelectedPatientId(parseInt(e.target.value))}
            className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-xs"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.patient_id} — {p.full_name} ({p.primary_diagnosis.substring(0, 28)}...)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Profile Card */}
      {selectedPatient && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 font-bold font-mono text-sm">
              {selectedPatient.patient_id.split('-').pop()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {selectedPatient.full_name}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({selectedPatient.patient_id})
                </span>
                <StatusBadge status={selectedPatient.status} size="sm" />
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Primary Diagnosis: <span className="text-slate-900">{selectedPatient.primary_diagnosis}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div>
              <span className="block text-slate-400">Age & Gender:</span>
              <span className="font-semibold text-slate-700">
                {selectedPatient.age} yrs • {selectedPatient.gender}
              </span>
            </div>
            <div>
              <span className="block text-slate-400">Admission Date:</span>
              <span className="font-semibold text-slate-700">
                {selectedPatient.admission_date}
              </span>
            </div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: New Assessment Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-sky-600" />
                New Clinical Assessment
              </h2>
              <div>
                <input
                  type="date"
                  name="assessment_date"
                  value={formData.assessment_date}
                  onChange={handleInputChange}
                  className="text-xs border border-slate-300 rounded px-2 py-1 bg-white"
                />
              </div>
            </div>

            {/* Section 1: Functional Mobility */}
            <div>
              <h3 className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">
                1. Functional Mobility Findings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobility Independence Level (1-5)
                  </label>
                  <select
                    name="mobility_score"
                    value={formData.mobility_score}
                    onChange={handleInputChange}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value={1}>1 - Total Assistance</option>
                    <option value={2}>2 - Maximal Assistance</option>
                    <option value={3}>3 - Moderate Assistance</option>
                    <option value={4}>4 - Minimal Assist / Supervision</option>
                    <option value={5}>5 - Completely Independent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assistive Device Used
                  </label>
                  <input
                    type="text"
                    name="assistive_device"
                    value={formData.assistive_device}
                    onChange={handleInputChange}
                    placeholder="e.g. Rolling Walker, Quad Cane, None"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobility & Transfer Observations <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="mobility_notes"
                  required
                  rows={2}
                  value={formData.mobility_notes}
                  onChange={handleInputChange}
                  placeholder="Note sit-to-stand performance, gait distance, endurance, velocity, and gait abnormalities..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            {/* Section 2: Balance Findings */}
            <div>
              <h3 className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">
                2. Balance & Postural Control
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Balance Score (Berg 0-56 Equivalent)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={56}
                    name="balance_score"
                    value={formData.balance_score}
                    onChange={handleInputChange}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fall Risk Stratification
                  </label>
                  <select
                    name="balance_risk"
                    value={formData.balance_risk}
                    onChange={handleInputChange}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="LOW">Low Fall Risk (Berg 41-56)</option>
                    <option value="MODERATE">Moderate Fall Risk (Berg 21-40)</option>
                    <option value="HIGH">High Fall Risk (Berg 0-20)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Static & Dynamic Balance Observations <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="balance_notes"
                  required
                  rows={2}
                  value={formData.balance_notes}
                  onChange={handleInputChange}
                  placeholder="Sitting balance, single leg stance, tandem walking, postural perturbations, sway..."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            {/* Section 3: Upper & Lower Limbs */}
            <div>
              <h3 className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">
                3. Upper & Lower Limb Motor Function
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                {/* Upper Limb */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-semibold text-xs text-slate-800">Upper Limb</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500">Left Strength</label>
                      <input
                        type="text"
                        name="upper_limb_strength_left"
                        value={formData.upper_limb_strength_left}
                        onChange={handleInputChange}
                        className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500">Right Strength</label>
                      <input
                        type="text"
                        name="upper_limb_strength_right"
                        value={formData.upper_limb_strength_right}
                        onChange={handleInputChange}
                        className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">Findings & ROM</label>
                    <textarea
                      name="upper_limb_notes"
                      rows={2}
                      value={formData.upper_limb_notes}
                      onChange={handleInputChange}
                      placeholder="Grip strength, dexterity, shoulder subluxation, spasticity..."
                      className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                    />
                  </div>
                </div>

                {/* Lower Limb */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <div className="font-semibold text-xs text-slate-800">Lower Limb</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500">Left Strength</label>
                      <input
                        type="text"
                        name="lower_limb_strength_left"
                        value={formData.lower_limb_strength_left}
                        onChange={handleInputChange}
                        className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500">Right Strength</label>
                      <input
                        type="text"
                        name="lower_limb_strength_right"
                        value={formData.lower_limb_strength_right}
                        onChange={handleInputChange}
                        className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">Findings & Gait</label>
                    <textarea
                      name="lower_limb_notes"
                      rows={2}
                      value={formData.lower_limb_notes}
                      onChange={handleInputChange}
                      placeholder="Ankle dorsiflexion, knee stability, weight-bearing tolerance, clonus..."
                      className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Clinical Summary */}
            <div>
              <h3 className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-2">
                4. Assessor Clinical Summary & Potential
              </h3>
              <textarea
                name="clinical_summary"
                required
                rows={3}
                value={formData.clinical_summary}
                onChange={handleInputChange}
                placeholder="Overall clinical impression, primary functional limitations identified, rehabilitation prognosis, and safety precautions..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {isSubmitting ? 'Saving Assessment...' : 'Save Clinical Assessment'}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Past Assessments History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Assessment History ({assessments.length})
            </h3>
          </div>

          {assessments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-400">
              No previous clinical evaluations recorded for this patient.
            </div>
          ) : (
            <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
              {assessments.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-900">
                      {a.assessment_date}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      By: {a.assessor_name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded">
                      <span className="text-slate-400 block text-[10px]">Mobility Score</span>
                      <span className="font-semibold text-slate-800">
                        {a.mobility_score}/5 ({a.assistive_device})
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded">
                      <span className="text-slate-400 block text-[10px]">Balance Risk</span>
                      <StatusBadge status={a.balance_risk} size="sm" />
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 line-clamp-3 italic bg-slate-50/50 p-2 rounded border border-slate-100">
                    "{a.clinical_summary}"
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Upper: L{a.upper_limb_strength_left} R{a.upper_limb_strength_right}</span>
                    <span>Lower: L{a.lower_limb_strength_left} R{a.lower_limb_strength_right}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

