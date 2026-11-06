import React from 'react';
import { RehabilitationGoal } from '../types';
import { Target, Calendar, Activity, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface GoalCardProps {
  goal: RehabilitationGoal;
  onSelect?: () => void;
  isSelected?: boolean;
  selectable?: boolean;
  onStatusChange?: (newStatus: any) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onSelect,
  isSelected,
  selectable,
  onStatusChange,
}) => {
  return (
    <div
      onClick={selectable && onSelect ? onSelect : undefined}
      className={`relative rounded-xl border p-4 transition-all duration-150 ${
        selectable ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-500/80 shadow-xs'
          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          {selectable && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}} // handled by parent div click
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
            />
          )}
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/80">
            {goal.category_display || goal.category}
          </span>
        </div>
        <StatusBadge status={goal.status} size="sm" />
      </div>

      <h4 className="font-semibold text-slate-900 text-sm mb-2">{goal.description}</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/90 p-2.5 rounded-lg border border-slate-100 mb-3">
        <div>
          <span className="text-slate-400 font-medium block">Baseline:</span>
          <span className="text-slate-700">{goal.baseline}</span>
        </div>
        <div>
          <span className="text-emerald-600 font-medium block flex items-center gap-1">
            <Target className="w-3 h-3" /> Target:
          </span>
          <span className="text-slate-700 font-medium">{goal.target}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Target Date: {goal.expected_completion_date}
        </span>

        {onStatusChange && (
          <select
            value={goal.status}
            onChange={(e) => onStatusChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="text-xs py-1 px-2 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          >
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ACHIEVED">Achieved</option>
          </select>
        )}
      </div>
    </div>
  );
};

