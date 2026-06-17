import { useState } from 'react';

const SAMPLES = [
  { label: 'Payment capture refactor', url: 'https://gitlab.com/commerce/payment-service/-/merge_requests/1893', risk: 'Critical-path' },
  { label: 'JWT validation hardening', url: 'https://gitlab.com/commerce/auth-service/-/merge_requests/871', risk: 'Security' },
  { label: 'Storefront promo banner', url: 'https://gitlab.com/commerce/platform-web/-/merge_requests/443', risk: 'Low-risk' },
];

export function MrInputForm({
  onAnalyze,
  loading,
}: {
  onAnalyze: (input: { mrUrl: string; branch: string; commitSha: string }) => void;
  loading: boolean;
}) {
  const [mrUrl, setMrUrl] = useState(SAMPLES[0].url);
  const [branch, setBranch] = useState('feature/async-settlement');
  const [commitSha, setCommitSha] = useState('a3f8c21d');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mrUrl.trim()) onAnalyze({ mrUrl: mrUrl.trim(), branch: branch.trim(), commitSha: commitSha.trim() });
  };

  return (
    <form onSubmit={submit} className="card p-5">
      <div className="grid gap-3 md:grid-cols-[1fr_220px_180px_auto]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-300">Merge Request URL</span>
          <input
            value={mrUrl}
            onChange={(e) => setMrUrl(e.target.value)}
            placeholder="https://gitlab.com/group/project/-/merge_requests/42"
            className="w-full rounded-lg border border-ink-600 bg-ink-850 px-3 py-2.5 font-mono text-sm text-ink-100 placeholder-ink-400 outline-none transition focus:border-ember-500 focus:ring-2 focus:ring-ember-500/20"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-300">Branch</span>
          <input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="feature/my-change"
            className="w-full rounded-lg border border-ink-600 bg-ink-850 px-3 py-2.5 font-mono text-sm text-ink-100 placeholder-ink-400 outline-none transition focus:border-ember-500 focus:ring-2 focus:ring-ember-500/20"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-300">Commit SHA</span>
          <input
            value={commitSha}
            onChange={(e) => setCommitSha(e.target.value)}
            placeholder="a3f8c21d"
            className="w-full rounded-lg border border-ink-600 bg-ink-850 px-3 py-2.5 font-mono text-sm text-ink-100 placeholder-ink-400 outline-none transition focus:border-ember-500 focus:ring-2 focus:ring-ember-500/20"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="h-[42px] whitespace-nowrap rounded-lg bg-gradient-to-r from-ember-600 to-ember-500 px-6 text-sm font-semibold text-white shadow-glow transition hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? 'Analyzing…' : 'Analyze impact'}
          </button>
        </div>
      </div>
      <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs text-ink-400">
        <span className="uppercase tracking-wider">Try a scenario:</span>
        {SAMPLES.map((s) => (
          <button
            key={s.url}
            type="button"
            onClick={() => setMrUrl(s.url)}
            className={`chip border transition hover:border-ember-500/60 hover:text-ink-100 ${
              mrUrl === s.url ? 'border-ember-500/60 bg-ember-500/10 text-ember-400' : 'border-ink-600 text-ink-300'
            }`}
          >
            {s.label}
            <span className="text-ink-400">· {s.risk}</span>
          </button>
        ))}
      </div>
    </form>
  );
}
