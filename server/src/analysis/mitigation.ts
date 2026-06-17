import type {
  AffectedService,
  DeploymentPlan,
  MitigationTask,
  MrContext,
  ReviewerRecommendation,
  RiskAssessment,
  SimilarIncident,
  TestRecommendation,
} from '../types.js';

/**
 * Turns the analysis into four actionable GitLab Work Items (type: Task) that
 * a reviewer can create directly on the MR. Each carries a GitLab-flavored
 * markdown body, labels, a suggested assignee derived from the Orbit graph,
 * and a blocking flag. Fully deterministic so it works without an API key.
 */
export function buildMitigationTasks(input: {
  ctx: MrContext;
  risk: RiskAssessment;
  services: AffectedService[];
  reviewers: ReviewerRecommendation[];
  testPlan: TestRecommendation[];
  incidents: SimilarIncident[];
  deployment: DeploymentPlan;
}): MitigationTask[] {
  const { ctx, risk, services, reviewers, testPlan, incidents, deployment } = input;
  const elevated = risk.level !== 'Low';
  const mr = `!${ctx.mrIid}`;

  const securityReviewer = reviewers.find((r) => /security/i.test(r.role)) ?? reviewers[0];
  const ownerReviewer = reviewers[0];
  const sensitiveFiles = ctx.changedFiles.filter((f) => f.securitySensitive);
  const directServices = services.filter((s) => s.impact === 'direct');
  const transitiveServices = services.filter((s) => s.impact === 'transitive');
  const tier0 = services.filter((s) => s.tier === 'tier-0');
  const badHistory = incidents.filter((i) => i.outcome === 'caused-incident' || i.outcome === 'rolled-back');

  const list = (items: string[]) => items.map((i) => `- ${i}`).join('\n');

  // 1 — Security Review
  const securityTask: MitigationTask = {
    kind: 'security-review',
    workItemType: 'Task',
    title: `Security review: ${ctx.title} (${mr})`,
    description: [
      `**Security review required for ${mr}** — risk level **${risk.level}** (${risk.score}/100).`,
      '',
      `${sensitiveFiles.length} security-sensitive file(s) changed:`,
      list(sensitiveFiles.length ? sensitiveFiles.map((f) => `\`${f.path}\``) : ['_No files flagged as security-sensitive — confirm scope._']),
      '',
      '**Checklist**',
      list([
        'Review authn/authz changes on the touched code paths',
        'Confirm no secrets, tokens, or PII are logged',
        'Run the SAST delta scan and triage any new findings',
        'Verify input validation on changed external interfaces',
      ]),
    ].join('\n'),
    labels: ['security', 'change-guardian', elevated ? 'priority::high' : 'priority::medium'],
    suggestedAssignee: `@${securityReviewer?.username ?? 'appsec'}`,
    dueInDays: elevated ? 1 : 3,
    blocking: elevated && sensitiveFiles.length > 0,
  };

  // 2 — Integration Testing
  const integrationTask: MitigationTask = {
    kind: 'integration-testing',
    workItemType: 'Task',
    title: `Integration testing across ${services.length} affected services (${mr})`,
    description: [
      `**Integration test pass for ${mr}.** Orbit identified ${directServices.length} directly and ${transitiveServices.length} transitively affected services.`,
      '',
      '**Directly affected**',
      list(directServices.length ? directServices.map((s) => `${s.name} _(${s.tier})_`) : ['_None_']),
      '',
      '**Transitively affected (verify contracts)**',
      list(transitiveServices.length ? transitiveServices.map((s) => `${s.name} — ${s.reason}`) : ['_None_']),
      '',
      '**Recommended suites**',
      list(testPlan.filter((t) => t.category === 'Integration' || t.category === 'Regression').map((t) => `${t.name} _(${t.priority})_`)),
    ].join('\n'),
    labels: ['testing', 'integration', 'change-guardian'],
    suggestedAssignee: `@${ownerReviewer?.username ?? ctx.author}`,
    dueInDays: elevated ? 2 : 4,
    blocking: tier0.length > 0,
  };

  // 3 — Deployment Approval
  const deploymentTask: MitigationTask = {
    kind: 'deployment-approval',
    workItemType: 'Task',
    title: `Deployment approval & rollout plan (${mr})`,
    description: [
      `**Deployment sign-off for ${mr}** — ${risk.level} risk.`,
      '',
      `**Safe window:** ${deployment.safeWindow}`,
      `**Canary:** ${deployment.canary}`,
      `**Feature flag:** ${deployment.featureFlag}`,
      `**Rollback:** ${deployment.rollback}`,
      '',
      tier0.length ? `⚠️ **${tier0.length} tier-0 service(s) in blast radius:** ${tier0.map((s) => s.name).join(', ')}` : '_No tier-0 services affected._',
      badHistory.length ? `\n📛 **Heed history:** ${badHistory[0].mrId} (${badHistory[0].outcome}) — ${badHistory[0].lesson}` : '',
    ].join('\n'),
    labels: ['deployment', 'approval', 'change-guardian', `risk::${risk.level.toLowerCase()}`],
    suggestedAssignee: tier0.length ? '@release-manager' : `@${ownerReviewer?.username ?? ctx.author}`,
    dueInDays: elevated ? 1 : 5,
    blocking: elevated,
  };

  // 4 — Monitoring
  const monitoringTask: MitigationTask = {
    kind: 'monitoring',
    workItemType: 'Task',
    title: `Post-deploy monitoring & alerting (${mr})`,
    description: [
      `**Wire up monitoring before ${mr} ships.** Watch these signals during and after rollout:`,
      '',
      list(deployment.monitoring),
      '',
      directServices.length
        ? `Dashboards to pin: ${directServices.map((s) => `\`${s.name}\``).join(', ')}`
        : '_Standard service dashboard._',
    ].join('\n'),
    labels: ['observability', 'monitoring', 'change-guardian'],
    suggestedAssignee: '@sre-oncall',
    dueInDays: elevated ? 1 : 5,
    blocking: false,
  };

  return [securityTask, integrationTask, deploymentTask, monitoringTask];
}
