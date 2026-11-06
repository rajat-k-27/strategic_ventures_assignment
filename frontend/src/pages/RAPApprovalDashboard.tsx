import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { rapsApi } from '../api/raps';
import { RAPListItem, RAPDetail, RAPStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { VersionTimeline } from '../components/VersionTimeline';
import { Modal } from '../components/Modal';
import { GoalCard } from '../components/GoalCard';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  FileText,
  User,
  Calendar,
  Send,
  MessageSquare,
  History,
  Target,
  ClipboardCheck,
  ExternalLink,
} from 'lucide-react';

export const RAPApprovalDashboard: React.FC = () => {
  const { user, quickSwitch } = useAuth();
  const [allRaps, setAllRaps] = useState<RAPListItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('SUBMITTED');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal State
  const [selectedRapId, setSelectedRapId] = useState<number | null>(null);
  const [selectedRap, setSelectedRap] = useState<RAPDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Review Actions Form State
  const [reviewComments, setReviewComments] = useState('');
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Clinician Revision Form State
  const [isReviseOpen, setIsReviseOpen] = useState(false);
  const [revisedTitle, setRevisedTitle] = useState('');
  const [revisedSummary, setRevisedSummary] = useState('');
  const [revisedDuration, setRevisedDuration] = useState(6);
  const [revisedReviewDate, setRevisedReviewDate] = useState('');

  // Load all RAPs once upfront (silent refresh option avoids screen flash)
  const loadAllRAPs = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await rapsApi.getRAPs();
      setAllRaps(data);
    } catch (err) {
      console.error('Failed to load RAPs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllRAPs();
  }, []);

  // Instant in-memory counts for each tab badge
  const tabCounts = useMemo(() => {
    return {
      SUBMITTED: allRaps.filter((r) => r.status === 'SUBMITTED').length,
      RETURNED: allRaps.filter((r) => r.status === 'RETURNED').length,
      APPROVED: allRaps.filter((r) => r.status === 'APPROVED').length,
      DRAFT: allRaps.filter((r) => r.status === 'DRAFT' || r.status === 'REVISED').length,
      ALL: allRaps.length,
    };
  }, [allRaps]);

  // Instant in-memory filtering (0ms latency, silky smooth tab switching)
  const visibleRaps = useMemo(() => {
    if (activeTab === 'ALL') return allRaps;
    if (activeTab === 'DRAFT') return allRaps.filter((r) => r.status === 'DRAFT' || r.status === 'REVISED');
    return allRaps.filter((r) => r.status === activeTab);
  }, [allRaps, activeTab]);

  const handleOpenDetail = async (rapId: number) => {
    setSelectedRapId(rapId);
    setIsDetailLoading(true);
    setActionError(null);
    setActionSuccess(null);
    setReviewComments('');
    try {
      const detail = await rapsApi.getRAP(rapId);
      setSelectedRap(detail);

      // Pre-fill revision state if needed
      setRevisedTitle(detail.title);
      setRevisedSummary(detail.clinical_summary);
      setRevisedDuration(detail.duration_weeks);
      setRevisedReviewDate(detail.target_review_date);
    } catch (err) {
      console.error('Failed to load RAP detail:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Supervisor Action: Approve
  const handleApprove = async () => {
    if (!selectedRapId) return;
    setActionError(null);
    setIsActionSubmitting(true);
    try {
      const res = await rapsApi.approveRAP(selectedRapId, reviewComments);
      setSelectedRap(res.data);
      setActionSuccess(`Plan ${res.data.rap_id} approved successfully!`);
      loadAllRAPs(true);
    } catch (err: any) {
      setActionError(
        err.response?.data?.error || 'Failed to approve plan. Ensure you have Supervisor permissions.'
      );
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Supervisor Action: Return for Revision
  const handleReturn = async () => {
    if (!selectedRapId) return;
    if (!reviewComments.trim()) {
      setActionError('Feedback comments explaining required revisions are mandatory when returning a plan.');
      return;
    }

    setActionError(null);
    setIsActionSubmitting(true);
    try {
      const res = await rapsApi.returnRAP(selectedRapId, reviewComments);
      setSelectedRap(res.data);
      setActionSuccess(`Plan ${res.data.rap_id} returned to clinician for revision.`);
      loadAllRAPs(true);
    } catch (err: any) {
      setActionError(
        err.response?.data?.error || 'Failed to return plan. Ensure you have Supervisor permissions.'
      );
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Clinician Action: Submit draft or revision
  const handleSubmitPlan = async () => {
    if (!selectedRapId) return;
    setActionError(null);
    setIsActionSubmitting(true);
    try {
      const res = await rapsApi.submitRAP(selectedRapId);
      setSelectedRap(res.data);
      setActionSuccess(`Plan ${res.data.rap_id} submitted for supervisor approval.`);
      loadAllRAPs(true);
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to submit plan.');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Clinician Action: Revise returned plan & Re-submit
  const handleSaveRevision = async (submitNow: boolean) => {
    if (!selectedRap || !selectedRapId) return;
    setActionError(null);
    setIsActionSubmitting(true);

    try {
      const res = await rapsApi.updateRAP(selectedRapId, {
        patient: selectedRap.patient.id,
        assessment: selectedRap.assessment.id,
        goals: selectedRap.goals.map((g) => g.id),
        title: revisedTitle,
        clinical_summary: revisedSummary,
        duration_weeks: revisedDuration,
        target_review_date: revisedReviewDate,
        submit_now: submitNow,
      });

      const updatedDetail = await rapsApi.getRAP(selectedRapId);
      setSelectedRap(updatedDetail);
      setIsReviseOpen(false);
      setActionSuccess(
        submitNow
          ? `Plan revised and re-submitted to supervisor (v${updatedDetail.version}).`
          : `Plan revised and saved as draft (v${updatedDetail.version}).`
      );
      loadAllRAPs(true);
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to revise plan.');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const tabs = [
    { id: 'SUBMITTED', label: 'Pending Review', icon: Clock },
    { id: 'RETURNED', label: 'Returned for Revision', icon: AlertCircle },
    { id: 'APPROVED', label: 'Approved Plans', icon: CheckCircle2 },
    { id: 'DRAFT', label: 'Drafts', icon: FileText },
    { id: 'ALL', label: 'All Plans', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            Rehabilitation Action Plan Approval Dashboard
          </h1>
          <p className="text-xs text-slate-500">
            Formal clinical review pipeline: DRAFT → SUBMITTED → APPROVED / RETURNED → REVISED → SUBMITTED.
          </p>
        </div>

        {/* Current Role Banner */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-400 font-medium">Logged in as:</span>
          <span className="font-bold text-slate-900">{user?.full_name}</span>
          <span
            className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
              user?.role === 'SUPERVISOR'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {user?.role}
          </span>
        </div>
      </div>

      {/* Tabs with Instant Badges */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id as keyof typeof tabCounts] || 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5 opacity-80" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* RAPs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">RAP ID</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Plan Title</th>
                <th className="py-3 px-4">Version</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timeline / Reviewer</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Loading action plans...
                  </td>
                </tr>
              ) : visibleRaps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No action plans in this status.
                  </td>
                </tr>
              ) : (
                visibleRaps.map((rap) => (
                  <tr key={rap.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700">
                      {rap.rap_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{rap.patient_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {rap.patient_id_display}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-800 truncate">{rap.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {rap.duration_weeks} wks • {rap.goals_count} associated goals
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-mono font-bold text-xs">
                        v{rap.version}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={rap.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {rap.status === 'SUBMITTED' ? (
                        <div className="text-amber-700 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Submitted by {rap.created_by_name}
                        </div>
                      ) : rap.status === 'APPROVED' ? (
                        <div className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approved by {rap.reviewed_by_name}
                        </div>
                      ) : rap.status === 'RETURNED' ? (
                        <div className="text-rose-700 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Returned by {rap.reviewed_by_name}
                        </div>
                      ) : (
                        <span>Created by {rap.created_by_name}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(rap.id)}
                        className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold transition-colors flex items-center gap-1 ml-auto"
                      >
                        Review Plan
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Detail Modal */}
      <Modal
        isOpen={!!selectedRapId}
        onClose={() => {
          setSelectedRapId(null);
          setSelectedRap(null);
          setIsReviseOpen(false);
        }}
        title={`Action Plan Review: ${selectedRap?.rap_id || ''}`}
        subtitle={selectedRap?.title}
        maxWidth="4xl"
      >
        {isDetailLoading || !selectedRap ? (
          <div className="text-center py-16 text-slate-400">Loading action plan details...</div>
        ) : (
          <div className="space-y-6">
            {/* Action Feedback Alerts */}
            {actionSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {actionError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Workflow Action Bar */}
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Current Status:
                  </span>
                  <StatusBadge status={selectedRap.status} size="sm" />
                  <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold">
                    Version {selectedRap.version}
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  Target Review Date:{' '}
                  <span className="text-white font-semibold">
                    {selectedRap.target_review_date}
                  </span>
                </div>
              </div>

              {/* Status-specific action controls */}
              {/* 1. SUBMITTED STATUS */}
              {selectedRap.status === 'SUBMITTED' && (
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  {user?.role === 'SUPERVISOR' ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-purple-400" />
                          Supervisor Clinical Decision:
                        </span>
                        <span className="text-[11px] text-purple-300 font-medium">
                          Reviewer: Dr. Vikram Malhotra (Supervisor)
                        </span>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={reviewComments}
                          onChange={(e) => setReviewComments(e.target.value)}
                          placeholder="Add supervisor review feedback or mandatory revision notes..."
                          className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={isActionSubmitting}
                          onClick={handleReturn}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Return for Revision
                        </button>

                        <button
                          type="button"
                          disabled={isActionSubmitting}
                          onClick={handleApprove}
                          className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve Action Plan
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-amber-300 py-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
                        <span>
                          Plan is submitted and currently under review by Dr. Vikram Malhotra (Clinical Supervisor).
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-300/90 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded font-medium">
                        Awaiting Supervisor Decision
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 2. RETURNED STATUS */}
              {selectedRap.status === 'RETURNED' && (
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs">
                    <span className="font-bold block text-rose-100 mb-0.5">
                      Supervisor Feedback & Required Revisions:
                    </span>
                    {selectedRap.approval_comments || 'Revision requested.'}
                  </div>

                  {user?.role === 'CLINICIAN' ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300">
                        As the treating clinician, address supervisor feedback and advance plan version:
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsReviseOpen(!isReviseOpen)}
                        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {isReviseOpen ? 'Close Revision Editor' : 'Revise & Upgrade Version'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-rose-300 py-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <span>
                          Plan returned for revision. Awaiting Clinician (Dr. Rajesh Sharma) to address notes and re-submit.
                        </span>
                      </div>
                      <span className="text-[11px] text-rose-300/90 bg-rose-950/60 border border-rose-800/60 px-2.5 py-1 rounded font-medium">
                        Awaiting Clinician Revision
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 3. DRAFT or REVISED STATUS */}
              {(selectedRap.status === 'DRAFT' || selectedRap.status === 'REVISED') && (
                <div className="pt-2 border-t border-slate-800">
                  {user?.role === 'CLINICIAN' ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300">
                        {selectedRap.status === 'REVISED'
                          ? `Plan revision v${selectedRap.version} ready. Submit to Supervisor for review:`
                          : 'This plan is currently a Draft. Submit to Supervisor for review when ready:'}
                      </span>
                      <button
                        type="button"
                        disabled={isActionSubmitting}
                        onClick={handleSubmitPlan}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Submit for Approval
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-400 py-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span>
                          {selectedRap.status === 'REVISED'
                            ? 'Plan revision is in progress by Clinician. Awaiting submission before supervisor review.'
                            : 'Plan is currently in Draft status authored by Clinician. Clinician must submit it before supervisor review.'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded font-medium">
                        Awaiting Clinician Submission
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 4. APPROVED STATUS */}
              {selectedRap.status === 'APPROVED' && (
                <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-emerald-400 py-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      Plan is Approved and Active (Version {selectedRap.version}). Reviewed by Dr. Vikram Malhotra.
                    </span>
                  </div>
                  {selectedRap.approval_comments && (
                    <span className="text-slate-300 text-[11px] italic bg-slate-800/80 px-2.5 py-1 rounded">
                      Notes: "{selectedRap.approval_comments}"
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Revision Editor Drawer (When Clinician clicked Revise) */}
            {isReviseOpen && user?.role === 'CLINICIAN' && (
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-purple-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-purple-600" />
                    Plan Revision Studio (Upgrading to Version {selectedRap.version + 1})
                  </h4>
                  <span className="text-[11px] text-purple-700 font-medium">
                    Previous version {selectedRap.version} will be preserved in history
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Plan Title
                    </label>
                    <input
                      type="text"
                      value={revisedTitle}
                      onChange={(e) => setRevisedTitle(e.target.value)}
                      className="w-full text-xs border border-purple-300 rounded-lg p-2 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Updated Clinical Strategy & Intervention
                    </label>
                    <textarea
                      rows={4}
                      value={revisedSummary}
                      onChange={(e) => setRevisedSummary(e.target.value)}
                      placeholder="Incorporate supervisor recommendations here..."
                      className="w-full text-xs border border-purple-300 rounded-lg p-2 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Duration (Weeks)
                      </label>
                      <input
                        type="number"
                        value={revisedDuration}
                        onChange={(e) => setRevisedDuration(parseInt(e.target.value) || 1)}
                        className="w-full text-xs border border-purple-300 rounded-lg p-2 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Target Review Date
                      </label>
                      <input
                        type="date"
                        value={revisedReviewDate}
                        onChange={(e) => setRevisedReviewDate(e.target.value)}
                        className="w-full text-xs border border-purple-300 rounded-lg p-2 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isActionSubmitting}
                      onClick={() => handleSaveRevision(false)}
                      className="px-4 py-2 rounded-lg bg-white border border-purple-300 text-purple-800 text-xs font-semibold hover:bg-purple-100 transition-colors"
                    >
                      Save Revision as Draft
                    </button>
                    <button
                      type="button"
                      disabled={isActionSubmitting}
                      onClick={() => handleSaveRevision(true)}
                      className="px-5 py-2 rounded-lg bg-purple-700 text-white text-xs font-semibold hover:bg-purple-800 transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Save & Re-Submit to Supervisor
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Patient Header Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Patient</span>
                <span className="font-bold text-slate-900">{selectedRap.patient.full_name}</span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  {selectedRap.patient.patient_id}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Primary Diagnosis</span>
                <span className="font-semibold text-slate-800">
                  {selectedRap.patient.primary_diagnosis}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Cycle Duration</span>
                <span className="font-semibold text-slate-800">
                  {selectedRap.duration_weeks} Weeks
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Author Clinician</span>
                <span className="font-semibold text-slate-800">
                  {selectedRap.created_by_name}
                </span>
              </div>
            </div>

            {/* Plan Clinical Summary */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block uppercase tracking-wider text-[11px] text-slate-500">
                Clinical Rationale & Intervention Strategy:
              </span>
              <p className="text-slate-700 leading-relaxed font-medium">
                {selectedRap.clinical_summary}
              </p>
            </div>

            {/* Reference Assessment & Goals Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Baseline Assessment */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-sky-600" />
                  Baseline Clinical Assessment
                </h4>

                {selectedRap.assessment ? (
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Mobility Score</span>
                        <span className="font-bold text-slate-800">
                          {selectedRap.assessment.mobility_score}/5
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          ({selectedRap.assessment.assistive_device})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Fall Risk</span>
                        <StatusBadge status={selectedRap.assessment.balance_risk} size="sm" />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Assessor Notes</span>
                      <p className="text-slate-600 italic">
                        "{selectedRap.assessment.clinical_summary}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">No assessment linked.</div>
                )}
              </div>

              {/* Associated Goals */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-600" />
                  Associated Goals ({selectedRap.goals.length})
                </h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedRap.goals.map((g) => (
                    <div key={g.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-900">{g.description}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {g.category_display || g.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <span className="text-slate-400">Target:</span> {g.target}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Preserved Version History Timeline */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-sky-600" />
                  Preserved Version History & Audit Trail ({selectedRap.versions.length})
                </h4>
                <span className="text-xs text-slate-400">
                  Every transition snapshot is permanently stored
                </span>
              </div>

              <VersionTimeline versions={selectedRap.versions} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

