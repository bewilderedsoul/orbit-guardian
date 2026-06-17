import type { ExecutiveSummary } from '../types';
import { SectionCard } from './SectionCard';

export function ExecSummary({ summary }: { summary: ExecutiveSummary }) {
  return (
    <SectionCard
      icon="◈"
      title="Executive Summary"
      badge={<span className="chip bg-violet-glow/15 text-violet-glow">for engineering leadership</span>}
      className="border-violet-glow/20"
    >
      <div className="space-y-4">
        <p className="text-base leading-relaxed text-ink-100">{summary.overview}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-ink-700/60 bg-ink-850/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-400">Business impact</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-100">{summary.businessImpact}</p>
          </div>
          <div className="rounded-xl border border-ink-700/60 bg-ink-850/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-400">Deployment risk</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-100">{summary.deploymentRisk}</p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-400">Recommended actions</p>
          <ol className="space-y-1.5">
            {summary.recommendedActions.map((a, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-100">
                <span className="font-mono text-violet-glow">{String(i + 1).padStart(2, '0')}</span>
                {a}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </SectionCard>
  );
}
