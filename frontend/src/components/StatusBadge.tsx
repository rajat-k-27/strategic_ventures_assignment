import React from 'react';
import { RAPStatus, GoalStatus, BalanceRisk } from '../types';

interface StatusBadgeProps {
  status: RAPStatus | GoalStatus | BalanceRisk | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  let config = {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    label: status,
    dot: 'bg-slate-400',
  };

  switch (status) {
    case 'DRAFT':
      config = {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-300',
        label: 'Draft',
        dot: 'bg-slate-400',
      };
      break;
    case 'SUBMITTED':
      config = {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-300',
        label: 'Pending Review',
        dot: 'bg-amber-500 animate-pulse',
      };
      break;
    case 'APPROVED':
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-300',
        label: 'Approved',
        dot: 'bg-emerald-500',
      };
      break;
    case 'RETURNED':
      config = {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-300',
        label: 'Returned for Revision',
        dot: 'bg-rose-500',
      };
      break;
    case 'REVISED':
      config = {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-300',
        label: 'Revised (Ready to Submit)',
        dot: 'bg-purple-500',
      };
      break;

    // Goals
    case 'NOT_STARTED':
      config = {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        label: 'Not Started',
        dot: 'bg-slate-400',
      };
      break;
    case 'IN_PROGRESS':
      config = {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        label: 'In Progress',
        dot: 'bg-blue-500',
      };
      break;
    case 'ACHIEVED':
      config = {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        label: 'Goal Achieved',
        dot: 'bg-teal-500',
      };
      break;

    // Balance Risks
    case 'LOW':
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        label: 'Low Fall Risk',
        dot: 'bg-emerald-500',
      };
      break;
    case 'MODERATE':
      config = {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: 'Moderate Fall Risk',
        dot: 'bg-amber-500',
      };
      break;
    case 'HIGH':
      config = {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        label: 'High Fall Risk',
        dot: 'bg-rose-500',
      };
      break;
    default:
      config.label = status;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

