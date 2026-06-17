import type { TestRecommendation } from '../types';
import { priorityChip } from '../lib/ui';
import { SectionCard } from './SectionCard';

const categoryIcon: Record<TestRecommendation['category'], string> = {
  Unit: '⚙',
  Integration: '⇄',
  Security: '🛡',
  Regression: '↺',
  Performance: '⚡',
};

export function TestPlanPanel({ tests }: { tests: TestRecommendation[] }) {
  return (
    <SectionCard icon="✎" title="Smart Test Plan" badge={<span className="chip bg-ink-800 text-ink-200">{tests.length} recommended</span>}>
      <ul className="space-y-3">
        {tests.map((t, i) => (
          <li key={i} className="rounded-xl border border-ink-700/60 bg-ink-850/60 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-base">{categoryIcon[t.category]}</span>
                <div>
                  <p className="text-sm font-semibold text-ink-100">{t.name}</p>
                  <p className="text-xs uppercase tracking-wider text-ink-400">{t.category} test</p>
                </div>
              </div>
              <span className={`chip shrink-0 font-mono ${priorityChip[t.priority]}`}>{t.priority}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-200">{t.rationale}</p>
            {t.targets.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {t.targets.map((target) => (
                  <span key={target} className="chip bg-ink-800 font-mono text-[11px] text-ink-300">{target}</span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
