import type { ReviewerRecommendation } from '../types';
import { SectionCard } from './SectionCard';

export function ReviewersPanel({ reviewers }: { reviewers: ReviewerRecommendation[] }) {
  return (
    <SectionCard icon="✓" title="Recommended Reviewers" badge={<span className="chip bg-ink-800 text-ink-200">ranked by Orbit signals</span>}>
      <ul className="space-y-3">
        {reviewers.map((r, i) => (
          <li key={r.username} className="rounded-xl border border-ink-700/60 bg-ink-850/60 p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ember-500/30 to-violet-glow/30 font-mono text-sm font-semibold text-ink-100">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-100">
                  {r.name} <span className="font-mono font-normal text-ink-400">@{r.username}</span>
                </p>
                <p className="truncate text-xs text-ink-300">{r.role}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-lg font-semibold text-ember-400">{r.score}</p>
                <p className="text-[10px] uppercase tracking-wider text-ink-400">relevance</p>
              </div>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-200">{r.explanation}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {r.signals.map((s) => (
                <span key={s} className="chip bg-ink-800 text-[11px] text-ink-300">{s}</span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
