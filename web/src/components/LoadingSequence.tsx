import { useEffect, useState } from 'react';

const STEPS = [
  'Resolving merge request and changed files…',
  'Querying GitLab Orbit knowledge graph…',
  'Traversing dependency relationships…',
  'Matching historical merge requests and incidents…',
  'AI reasoning over blast radius…',
  'Composing risk assessment…',
];

export function LoadingSequence() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="card flex flex-col items-center gap-6 p-14">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-ink-700 border-t-ember-500" style={{ animationDuration: '1.1s' }} />
        <div className="absolute inset-2 animate-spin rounded-full border-2 border-ink-700 border-b-violet-glow" style={{ animationDuration: '1.7s', animationDirection: 'reverse' }} />
      </div>
      <ul className="space-y-2">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-2.5 font-mono text-sm transition-all duration-500 ${
              i < step ? 'text-ink-400' : i === step ? 'text-ink-100' : 'text-ink-600'
            }`}
          >
            <span className={i < step ? 'text-emerald-400' : i === step ? 'animate-pulse-slow text-ember-500' : 'text-ink-600'}>
              {i < step ? '✓' : i === step ? '▸' : '·'}
            </span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
