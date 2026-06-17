import { useEffect, useState } from 'react';
import type { AnalysisReport } from './types';
import { analyzeMr } from './lib/api';
import { MrInputForm } from './components/MrInputForm';
import { LoadingSequence } from './components/LoadingSequence';
import { RiskScoreCard } from './components/RiskScoreCard';
import { BlastRadiusGraph } from './components/BlastRadiusGraph';
import { ServicesTable } from './components/ServicesTable';
import { ReviewersPanel } from './components/ReviewersPanel';
import { TestPlanPanel } from './components/TestPlanPanel';
import { IncidentsPanel } from './components/IncidentsPanel';
import { DeploymentPanel } from './components/DeploymentPanel';
import { ExecSummary } from './components/ExecSummary';
import { OrbitInsightsPanel } from './components/OrbitInsightsPanel';
import { WhyOrbitPanel } from './components/WhyOrbitPanel';
import { MitigationTasksPanel } from './components/MitigationTasksPanel';

type Health = { orbit: 'live' | 'demo'; ai: 'claude' | 'heuristic' };

export default function App() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const run = async (input: { mrUrl: string; branch: string; commitSha: string }) => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      setReport(await analyzeMr(input));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ember-600 to-violet-glow text-2xl shadow-glow">
            🛡
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink-100">
              Orbit <span className="text-ember-500">Change Guardian</span>
            </h1>
            <p className="text-sm text-ink-300">Predict the blast radius before you merge — powered by the GitLab Orbit knowledge graph</p>
          </div>
        </div>
        {health && (
          <div className="flex gap-2">
            <span className={`chip ${health.orbit === 'live' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-violet-glow/15 text-violet-glow'}`}>
              ● Orbit: {health.orbit === 'live' ? 'live graph' : 'demo graph'}
            </span>
            <span className={`chip ${health.ai === 'claude' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-300'}`}>
              ● AI: {health.ai === 'claude' ? 'Claude reasoning' : 'heuristic engine'}
            </span>
          </div>
        )}
      </header>

      <MrInputForm onAnalyze={run} loading={loading} />

      {error && (
        <div className="card mt-6 border-red-500/40 p-5 text-sm text-red-300">
          ✗ {error}
        </div>
      )}

      {loading && (
        <div className="mt-6">
          <LoadingSequence />
        </div>
      )}

      {report && !loading && (
        <main className="mt-6 space-y-6">
          <div className="card flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3.5 text-sm">
            <span className="font-semibold text-ink-100">{report.meta.title}</span>
            <span className="font-mono text-ink-300">{report.meta.project} · !{report.meta.mrIid}</span>
            <span className="font-mono text-ink-400">{report.meta.branch} @ {report.meta.commitSha.slice(0, 8)}</span>
            <span className="text-ink-400">by @{report.meta.author}</span>
            <span className="ml-auto font-mono text-xs text-ink-400">
              analyzed in {(report.meta.durationMs / 1000).toFixed(1)}s · engine: {report.meta.aiEngine}
            </span>
          </div>

          <RiskScoreCard risk={report.risk} />
          <OrbitInsightsPanel insights={report.orbitInsights} />
          <BlastRadiusGraph blast={report.blastRadius} />
          <WhyOrbitPanel paths={report.impactPaths} />
          <ServicesTable services={report.affectedServices} />

          <div className="grid gap-6 lg:grid-cols-2">
            <ReviewersPanel reviewers={report.reviewers} />
            <TestPlanPanel tests={report.testPlan} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <IncidentsPanel incidents={report.similarIncidents} />
            <DeploymentPanel plan={report.deployment} />
          </div>

          <MitigationTasksPanel
            tasks={report.mitigationTasks}
            project={report.meta.project}
            mrIid={report.meta.mrIid}
          />

          <ExecSummary summary={report.executiveSummary} />
        </main>
      )}

      {!report && !loading && !error && (
        <div className="mt-16 text-center text-ink-400">
          <p className="text-5xl">⌬</p>
          <p className="mt-4 text-sm">
            Paste a merge request URL above to see its blast radius, risk score, reviewers, test plan and deployment strategy.
          </p>
        </div>
      )}

      <footer className="mt-12 border-t border-ink-800 pt-5 text-center text-xs text-ink-500">
        Orbit Change Guardian · GitLab Orbit hackathon · knowledge-graph-driven release intelligence
      </footer>
    </div>
  );
}
