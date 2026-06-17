import type { OrbitInsights } from '../types';
import { SectionCard } from './SectionCard';

export function OrbitInsightsPanel({ insights }: { insights: OrbitInsights }) {
  const metrics = [
    { label: 'Nodes traversed', value: insights.nodesTraversed, icon: '◉' },
    { label: 'Services impacted', value: insights.servicesImpacted, icon: '▦' },
    { label: 'Dependencies analyzed', value: insights.dependenciesAnalyzed, icon: '⇄' },
    { label: 'Historical MRs compared', value: insights.historicalMrsCompared, icon: '◷' },
    { label: 'Max traversal depth', value: insights.maxTraversalDepth, icon: '↳' },
    { label: 'Relation types used', value: insights.relationPathsUsed.length, icon: '⌥' },
  ];

  const maxCount = Math.max(1, ...insights.relationPathsUsed.map((r) => r.count));

  return (
    <SectionCard
      icon="🛰"
      title="Orbit Insights"
      badge={<span className="chip bg-violet-glow/15 text-violet-glow">knowledge-graph telemetry</span>}
      className="border-violet-glow/20"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-ink-700/60 bg-ink-850/60 p-3 text-center">
            <p className="text-sm text-ink-400">{m.icon}</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-violet-glow">{m.value}</p>
            <p className="mt-1 text-[11px] leading-tight text-ink-300">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-400">Orbit relationship paths used</p>
        <ul className="space-y-1.5">
          {insights.relationPathsUsed.map((r) => (
            <li key={r.relation} className="flex items-center gap-3 text-xs">
              <code className="w-32 shrink-0 truncate font-mono text-ink-200">{r.relation}</code>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-glow to-ember-500"
                  style={{ width: `${(r.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right font-mono text-ink-300">{r.count}</span>
              <span className="hidden flex-1 text-ink-400 md:block">{r.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}
