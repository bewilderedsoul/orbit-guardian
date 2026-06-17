import type { SimilarIncident } from '../types';
import { outcomeMeta } from '../lib/ui';
import { SectionCard } from './SectionCard';

export function IncidentsPanel({ incidents }: { incidents: SimilarIncident[] }) {
  return (
    <SectionCard icon="◷" title="Similar Past Changes" badge={<span className="chip bg-ink-800 text-ink-200">Orbit MR history</span>}>
      {incidents.length === 0 ? (
        <p className="text-sm text-ink-300">No historical merge requests overlap with this change’s components.</p>
      ) : (
        <ul className="space-y-3">
          {incidents.map((inc) => {
            const meta = outcomeMeta[inc.outcome];
            return (
              <li key={inc.mrId} className="rounded-xl border border-ink-700/60 bg-ink-850/60 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-ink-100">
                    <span className="font-mono text-ember-400">{inc.mrId}</span> {inc.title}
                  </p>
                  <span className={`chip shrink-0 ${meta.cls}`}>{meta.label}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
                  <span className="font-mono">{inc.date}</span>
                  <span>
                    similarity <span className="font-mono text-ink-200">{Math.round(inc.similarity * 100)}%</span>
                  </span>
                  <span>
                    overlap: <span className="font-mono text-ink-200">{inc.overlap.files}</span> components ·{' '}
                    <span className="font-mono text-ink-200">{inc.overlap.services}</span> services
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-700/70">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-glow to-ember-500" style={{ width: `${inc.similarity * 100}%` }} />
                </div>
                {inc.lesson && (
                  <p className="mt-2.5 border-l-2 border-ember-500/50 pl-3 text-sm italic leading-relaxed text-ink-200">
                    Lesson: {inc.lesson}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
