import type { DeploymentPlan } from '../types';
import { SectionCard } from './SectionCard';

const rows: { key: keyof Omit<DeploymentPlan, 'monitoring'>; icon: string; label: string }[] = [
  { key: 'safeWindow', icon: '🗓', label: 'Safe deployment window' },
  { key: 'canary', icon: '🐤', label: 'Canary strategy' },
  { key: 'featureFlag', icon: '⚑', label: 'Feature flag' },
  { key: 'rollback', icon: '⏮', label: 'Rollback strategy' },
];

export function DeploymentPanel({ plan }: { plan: DeploymentPlan }) {
  return (
    <SectionCard icon="🚀" title="Deployment Safety Advisor">
      <div className="space-y-3.5">
        {rows.map((r) => (
          <div key={r.key} className="flex gap-3">
            <span className="mt-0.5 text-base">{r.icon}</span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ink-400">{r.label}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-100">{plan[r.key]}</p>
            </div>
          </div>
        ))}
        <div className="flex gap-3">
          <span className="mt-0.5 text-base">📈</span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink-400">Monitoring checklist</p>
            <ul className="mt-1.5 space-y-1.5">
              {plan.monitoring.map((m, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-ink-100">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-ember-500/50 text-[10px] text-ember-400">✓</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
