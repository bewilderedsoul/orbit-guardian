import type { AffectedService, MrContext, RiskAssessment, RiskLevel, SimilarIncident } from '../types.js';
import type { TraversalResult } from '../orbit/client.js';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function levelFor(score: number): RiskLevel {
  if (score >= 85) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 35) return 'Medium';
  return 'Low';
}

/**
 * Deterministic baseline risk model over the Orbit graph. The LLM layer can
 * refine the narrative, but the score itself stays explainable: every factor
 * carries its own contribution so the UI can show exactly why.
 */
export function computeRisk(
  ctx: MrContext,
  t: TraversalResult,
  services: AffectedService[],
  incidents: SimilarIncident[],
): RiskAssessment {
  const factors: RiskAssessment['factors'] = [];

  // 1. Criticality of changed components
  const critFiles = ctx.changedFiles.filter((f) => f.criticality === 'critical').length;
  const highFiles = ctx.changedFiles.filter((f) => f.criticality === 'high').length;
  const critScore = clamp(critFiles * 9 + highFiles * 5, 0, 28);
  factors.push({
    label: 'Component criticality',
    contribution: critScore,
    detail: `${critFiles} critical and ${highFiles} high-criticality files changed`,
  });

  // 2. Dependency fan-out
  const transitive = services.filter((s) => s.impact === 'transitive').length;
  const direct = services.filter((s) => s.impact === 'direct').length;
  const tier0 = services.filter((s) => s.tier === 'tier-0').length;
  const fanScore = clamp(direct * 4 + transitive * 3 + tier0 * 3, 0, 24);
  factors.push({
    label: 'Dependency blast radius',
    contribution: fanScore,
    detail: `${direct} directly affected and ${transitive} transitively affected services (${tier0} tier-0)`,
  });

  // 3. Security-sensitive surface
  const sensitive = ctx.changedFiles.filter((f) => f.securitySensitive).length;
  const findings = [...t.distances.keys()].filter((id) => id.startsWith('finding:')).length
    + t.pathRelations.filter((r) => r.type === 'affects').length;
  const secScore = clamp(sensitive * 4 + findings * 4, 0, 20);
  factors.push({
    label: 'Security exposure',
    contribution: secScore,
    detail: `${sensitive} security-sensitive files; ${findings} open findings on touched components`,
  });

  // 4. Historical incidents on similar changes
  const badHistory = incidents.filter((i) => i.outcome === 'caused-incident' || i.outcome === 'rolled-back');
  const histScore = clamp(badHistory.length * 7, 0, 16);
  factors.push({
    label: 'Incident history',
    contribution: histScore,
    detail: badHistory.length
      ? `${badHistory.length} similar past MRs caused incidents or rollbacks`
      : 'No incident-linked history on these components',
  });

  // 5. Pipeline health
  const flakyPipelines = [...t.distances.keys()]
    .map((id) => t.entityById.get(id))
    .filter((e) => e?.type === 'pipeline' && Number(e.metadata?.recentFailureRate ?? 0) > 0.15);
  const pipeScore = clamp(flakyPipelines.length * 4, 0, 8);
  factors.push({
    label: 'Pipeline stability',
    contribution: pipeScore,
    detail: flakyPipelines.length
      ? `${flakyPipelines.length} impacted pipelines with >15% recent failure rate`
      : 'Impacted pipelines are healthy',
  });

  // 6. Change size
  const churn = ctx.changedFiles.reduce((s, f) => s + f.additions + f.deletions, 0);
  const sizeScore = clamp(Math.round(churn / 200), 0, 8);
  factors.push({
    label: 'Change size',
    contribution: sizeScore,
    detail: `${churn} lines changed across ${ctx.changedFiles.length} files`,
  });

  const score = clamp(factors.reduce((s, f) => s + f.contribution, 0), 2, 98);

  return {
    score,
    level: levelFor(score),
    reasoning: factors.filter((f) => f.contribution > 0).map((f) => `${f.label}: ${f.detail}.`),
    factors,
  };
}
