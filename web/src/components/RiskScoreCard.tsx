import type { RiskAssessment } from '../types';
import { riskColor } from '../lib/ui';
import { SectionCard } from './SectionCard';

function Gauge({ score, hex }: { score: number; hex: string }) {
  const r = 64;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c * 0.75; // 270° arc
  return (
    <svg viewBox="0 0 160 160" className="h-44 w-44 -rotate-[135deg]">
      <circle cx="80" cy="80" r={r} fill="none" stroke="#222736" strokeWidth="12" strokeDasharray={`${c * 0.75} ${c}`} strokeLinecap="round" />
      <circle
        cx="80" cy="80" r={r} fill="none" stroke={hex} strokeWidth="12"
        strokeDasharray={`${filled} ${c}`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 10px ${hex}66)`, transition: 'stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)' }}
      />
    </svg>
  );
}

export function RiskScoreCard({ risk }: { risk: RiskAssessment }) {
  const color = riskColor[risk.level];
  return (
    <SectionCard
      icon="⚠"
      title="AI Risk Score"
      badge={<span className={`chip ${color.bg} ${color.text} ring-1 ${color.ring}`}>{risk.level} risk</span>}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="relative mx-auto shrink-0">
          <Gauge score={risk.score} hex={color.hex} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-mono text-5xl font-semibold ${color.text}`}>{risk.score}</span>
            <span className="text-xs uppercase tracking-widest text-ink-400">/ 100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <ul className="space-y-2">
            {risk.reasoning.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-200">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${color.bg.replace('/15', '')}`} style={{ background: color.hex }} />
                {r}
              </li>
            ))}
          </ul>

          <div className="space-y-1.5 border-t border-ink-700/60 pt-3.5">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-400">Score composition</p>
            {risk.factors.map((f) => (
              <div key={f.label} className="flex items-center gap-3 text-xs" title={f.detail}>
                <span className="w-44 shrink-0 truncate text-ink-300">{f.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-700/70">
                  <div className="h-full rounded-full" style={{ width: `${(f.contribution / 30) * 100}%`, background: color.hex, opacity: 0.85 }} />
                </div>
                <span className="w-8 text-right font-mono text-ink-300">+{f.contribution}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
