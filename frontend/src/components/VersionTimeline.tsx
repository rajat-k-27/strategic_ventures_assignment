import React, { useState } from 'react';
import { RAPVersionSnapshot } from '../types';
import { History, CheckCircle2, AlertCircle, ArrowRightCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface VersionTimelineProps {
  versions: RAPVersionSnapshot[];
}

export const VersionTimeline: React.FC<VersionTimelineProps> = ({ versions }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!versions || versions.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400 text-sm">
        No version history recorded yet.
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'RETURNED':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      case 'REVISED':
        return <ArrowRightCircle className="w-5 h-5 text-purple-600" />;
      case 'SUBMITTED':
        return <ArrowRightCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'RETURNED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'REVISED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'SUBMITTED':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
      {versions.map((v) => {
        const isExpanded = expandedId === v.id;
        const formattedDate = new Date(v.created_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div key={v.id} className="relative group">
            {/* Timeline icon node */}
            <div className="absolute -left-6 top-1.5 flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-slate-300 shadow-sm">
              {getActionIcon(v.action)}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm transition-all hover:border-slate-300">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-white">
                    v{v.version_number}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded border ${getActionBadgeColor(
                      v.action
                    )}`}
                  >
                    {v.action.replace('_', ' ')}
                  </span>
                  <StatusBadge status={v.status} size="sm" />
                </div>
                <span className="text-xs text-slate-400">{formattedDate}</span>
              </div>

              {/* Performed by */}
              <div className="mt-1 text-xs text-slate-500">
                Action by: <span className="font-medium text-slate-700">{v.performed_by_name}</span>
              </div>

              {/* Comments / Feedback */}
              {v.comments && (
                <div className="mt-2.5 p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900 block mb-0.5">
                    {v.action === 'RETURNED' ? 'Supervisor Revision Requirements:' : 'Audit Note:'}
                  </span>
                  {v.comments}
                </div>
              )}

              {/* Snapshot toggle */}
              {v.snapshot && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : v.id)}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" /> Hide Version Snapshot
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" /> View Preserved Snapshot ({v.snapshot.goals?.length || 0} goals)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Expanded snapshot details */}
              {isExpanded && v.snapshot && (
                <div className="mt-3 p-3 bg-slate-900 text-slate-100 rounded-lg text-xs overflow-x-auto">
                  <div className="font-semibold text-sky-400 mb-1">
                    Plan Snapshot: {v.snapshot.title}
                  </div>
                  <div className="text-slate-300 mb-2">
                    <span className="text-slate-400">Duration:</span> {v.snapshot.duration_weeks} weeks |{' '}
                    <span className="text-slate-400">Target Review:</span> {v.snapshot.target_review_date}
                  </div>
                  <div className="font-medium text-slate-200 mb-1">Associated Goals:</div>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                    {v.snapshot.goals?.map((g: any, idx: number) => (
                      <li key={idx}>
                        <span className="text-sky-300">[{g.category_display || g.category}]</span> {g.description} —{' '}
                        <span className="text-slate-400">Target: {g.target}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

