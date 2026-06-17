import type {
  AffectedService,
  DeploymentPlan,
  ExecutiveSummary,
  MrContext,
  ReviewerRecommendation,
  RiskAssessment,
  SimilarIncident,
  TestRecommendation,
} from '../types.js';

/**
 * Deterministic fallback generators. Used when no ANTHROPIC_API_KEY is set
 * (or the LLM call fails) so the product always produces a complete report.
 * The LLM path replaces these with model-written narrative.
 */

export function heuristicTestPlan(ctx: MrContext, services: AffectedService[]): TestRecommendation[] {
  const plan: TestRecommendation[] = [];
  const srcFiles = ctx.changedFiles.filter((f) => !f.path.startsWith('tests/'));
  const sensitive = srcFiles.filter((f) => f.securitySensitive);
  const critical = srcFiles.filter((f) => f.criticality === 'critical');
  const direct = services.filter((s) => s.impact === 'direct');
  const transitive = services.filter((s) => s.impact === 'transitive');

  plan.push({
    category: 'Unit',
    name: `Unit coverage for ${srcFiles.length} modified source files`,
    rationale: 'Every changed function should have isolated coverage before integration risk is considered.',
    priority: critical.length ? 'P0' : 'P1',
    targets: srcFiles.slice(0, 4).map((f) => f.path),
  });

  if (direct.length || transitive.length) {
    plan.push({
      category: 'Integration',
      name: `Contract tests across ${direct.length + transitive.length} affected services`,
      rationale: 'Orbit shows downstream consumers of the modified service; verify API contracts before they discover breakage in production.',
      priority: transitive.some((s) => s.tier === 'tier-0') ? 'P0' : 'P1',
      targets: [...direct, ...transitive].slice(0, 4).map((s) => s.name),
    });
  }

  if (sensitive.length) {
    plan.push({
      category: 'Security',
      name: 'Security regression suite on sensitive paths',
      rationale: `${sensitive.length} security-sensitive files changed; run SAST delta scan and authz/authn test packs.`,
      priority: 'P0',
      targets: sensitive.map((f) => f.path),
    });
  }

  plan.push({
    category: 'Regression',
    name: 'Golden-path regression on critical user journeys',
    rationale: 'Blast radius includes user-facing flows; re-run the recorded golden paths to catch behavioral drift.',
    priority: critical.length ? 'P0' : 'P2',
    targets: direct.map((s) => s.name).slice(0, 3),
  });

  const churn = ctx.changedFiles.reduce((s, f) => s + f.additions + f.deletions, 0);
  if (churn > 300 || services.some((s) => s.tier === 'tier-0')) {
    plan.push({
      category: 'Performance',
      name: 'Load test at 1.5× peak on affected endpoints',
      rationale: 'Tier-0 services in the blast radius; verify p99 latency budgets hold under the new code path.',
      priority: 'P1',
      targets: direct.map((s) => s.name).slice(0, 2),
    });
  }

  return plan;
}

export function heuristicDeployment(risk: RiskAssessment, services: AffectedService[], incidents: SimilarIncident[]): DeploymentPlan {
  const tier0 = services.filter((s) => s.tier === 'tier-0').map((s) => s.name);
  const badHistory = incidents.find((i) => i.outcome === 'caused-incident' || i.outcome === 'rolled-back');

  if (risk.level === 'Low') {
    return {
      safeWindow: 'Any business-hours window; no freeze constraints apply.',
      canary: 'Standard 10% canary for 15 minutes is sufficient.',
      featureFlag: 'Optional — change is low-risk and easily revertible.',
      rollback: 'Single-step revert via pipeline rollback job.',
      monitoring: ['Error rate on affected service', 'Frontend Core Web Vitals (if UI change)'],
    };
  }

  return {
    safeWindow:
      risk.level === 'Critical'
        ? 'Tuesday–Thursday 09:00–11:00 UTC only, outside payment-volume peaks, with payments on-call paged in advance.'
        : 'Avoid Friday and peak-traffic hours; deploy early in the day with the owning squad online.',
    canary: `Progressive rollout: 1% → 5% → 25% → 100% with 20-minute soak per step, auto-halt on error-budget burn${tier0.length ? ` for ${tier0.join(', ')}` : ''}.`,
    featureFlag: 'Required — gate the new code path behind a kill-switch flag so rollback does not need a redeploy.',
    rollback: badHistory
      ? `Pre-stage the rollback pipeline before merge. Note ${badHistory.mrId}: ${badHistory.lesson}`
      : 'Pre-stage rollback pipeline; verify the previous artifact is still deployable before starting.',
    monitoring: [
      'p99 latency and error rate on every blast-radius service',
      'Business KPI: payment success / auth success rate by region',
      'Dead-letter queue depth and retry counts',
      'Error-budget burn alerts wired to auto-halt the canary',
    ],
  };
}

export function heuristicSummary(
  ctx: MrContext,
  risk: RiskAssessment,
  services: AffectedService[],
  incidents: SimilarIncident[],
): ExecutiveSummary {
  const tier0 = services.filter((s) => s.tier === 'tier-0');
  const badHistory = incidents.filter((i) => i.outcome !== 'deployed-clean');
  return {
    overview: `"${ctx.title}" modifies ${ctx.changedFiles.length} files in ${ctx.project} and reaches ${services.length} services through the dependency graph. Overall risk is ${risk.level} (${risk.score}/100).`,
    businessImpact: tier0.length
      ? `${tier0.length} tier-0 (revenue-critical) services are in the blast radius: ${tier0.map((s) => s.name).join(', ')}. A regression here directly affects customer transactions.`
      : 'No revenue-critical services are in the blast radius; customer impact of a regression would be limited and recoverable.',
    deploymentRisk:
      risk.level === 'Low'
        ? 'Safe to deploy through the standard pipeline with routine monitoring.'
        : `Elevated deployment risk: ${risk.reasoning[0] ?? ''} ${badHistory.length ? `${badHistory.length} similar past changes caused incidents or rollbacks.` : ''}`,
    recommendedActions:
      risk.level === 'Low'
        ? ['Proceed with standard review and merge.', 'No special deployment controls required.']
        : [
            'Require review from the recommended component owners and security before merge.',
            'Deploy behind a feature flag with progressive canary and auto-halt.',
            'Run the P0 test plan (security + integration) before approving.',
            'Schedule the deploy in the recommended low-traffic window with on-call coverage.',
          ],
  };
}

export function heuristicReviewerNotes(reviewers: ReviewerRecommendation[]): ReviewerRecommendation[] {
  return reviewers.map((r) => ({
    ...r,
    explanation: r.explanation || `${r.name} is recommended because: ${r.signals.join('; ')}.`,
  }));
}
