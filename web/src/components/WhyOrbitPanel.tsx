import type { EntityType, ImpactPath, RelationType } from '../types';
import { SectionCard } from './SectionCard';

const typeColor: Partial<Record<EntityType, string>> = {
  file: '#8b93ab',
  component: '#a989f5',
  service: '#fc6d26',
  api: '#38bdf8',
  pipeline: '#34d399',
  repository: '#b6bccf',
};

const typeLabel: Partial<Record<EntityType, string>> = {
  file: 'File changed',
  component: 'Component',
  service: 'Service',
  api: 'API',
  pipeline: 'Pipeline',
  repository: 'Repository',
};

// reverse-dependency edges propagate impact backwards, so phrase them as "depended on by"
const relationLabel: Record<RelationType, string> = {
  part_of: 'part of',
  belongs_to: 'belongs to',
  depends_on: 'depended on by',
  consumes: 'API consumed by',
  exposes: 'exposes',
  built_by: 'built by',
  contained_in: 'contained in',
  owns: 'owned by',
  contributed_to: 'contributed by',
  affects: 'affects',
  modified: 'modified by',
  caused: 'caused',
  impacted: 'impacted',
};

function Hop({ name, type }: { name: string; type: EntityType }) {
  const color = typeColor[type] ?? '#8b93ab';
  return (
    <div
      className="flex shrink-0 flex-col rounded-lg border bg-ink-850/80 px-3 py-1.5"
      style={{ borderColor: `${color}66` }}
    >
      <span className="text-[10px] uppercase tracking-wider" style={{ color }}>
        {typeLabel[type] ?? type}
      </span>
      <span className="font-mono text-xs text-ink-100">{name}</span>
    </div>
  );
}

export function WhyOrbitPanel({ paths }: { paths: ImpactPath[] }) {
  return (
    <SectionCard
      icon="❓"
      title="Why Orbit?"
      badge={<span className="chip bg-ember-500/15 text-ember-400">exact graph traversal paths</span>}
    >
      <p className="mb-4 text-sm leading-relaxed text-ink-300">
        Every impacted service below was discovered by walking the Orbit knowledge graph — not by string-matching file
        paths. Here is the literal path that placed each service in the blast radius.
      </p>
      <ul className="space-y-4">
        {paths.map((p) => (
          <li key={p.serviceId}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className={`chip ${p.impact === 'direct' ? 'bg-ember-500/15 text-ember-400' : 'bg-violet-glow/15 text-violet-glow'}`}>
                {p.impact}
              </span>
              <span className="font-mono text-sm text-ink-100">{p.serviceName}</span>
              <span className="text-xs text-ink-400">· {p.hops.length} hop{p.hops.length === 1 ? '' : 's'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-ink-700/60 bg-ink-950/40 p-2.5">
              {p.hops.map((hop, i) => (
                <div key={`${hop.id}-${i}`} className="flex items-center gap-1.5">
                  <Hop name={hop.name} type={hop.type} />
                  {hop.relation && (
                    <span className="flex flex-col items-center px-0.5 text-ember-500">
                      <span className="text-[9px] uppercase tracking-wide text-ink-400">{relationLabel[hop.relation]}</span>
                      <span className="text-sm leading-none">→</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
