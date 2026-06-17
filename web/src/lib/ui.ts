import type { RiskLevel } from '../types';

export const riskColor: Record<RiskLevel, { text: string; bg: string; ring: string; hex: string }> = {
  Low: { text: 'text-emerald-400', bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/40', hex: '#34d399' },
  Medium: { text: 'text-amber-400', bg: 'bg-amber-500/15', ring: 'ring-amber-500/40', hex: '#fbbf24' },
  High: { text: 'text-ember-500', bg: 'bg-ember-500/15', ring: 'ring-ember-500/40', hex: '#fc6d26' },
  Critical: { text: 'text-red-400', bg: 'bg-red-500/15', ring: 'ring-red-500/40', hex: '#f87171' },
};

export const criticalityChip: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400',
  high: 'bg-ember-500/15 text-ember-400',
  medium: 'bg-amber-500/15 text-amber-300',
  low: 'bg-emerald-500/15 text-emerald-400',
};

export const priorityChip: Record<string, string> = {
  P0: 'bg-red-500/15 text-red-400',
  P1: 'bg-amber-500/15 text-amber-300',
  P2: 'bg-ink-700 text-ink-200',
};

export const outcomeMeta: Record<string, { label: string; cls: string }> = {
  'deployed-clean': { label: 'Deployed clean', cls: 'bg-emerald-500/15 text-emerald-400' },
  'caused-incident': { label: 'Caused incident', cls: 'bg-red-500/15 text-red-400' },
  'rolled-back': { label: 'Rolled back', cls: 'bg-ember-500/15 text-ember-400' },
  'pipeline-failed': { label: 'Pipeline failed', cls: 'bg-amber-500/15 text-amber-300' },
};
