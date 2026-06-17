import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import type {
  AffectedService,
  AnalysisReport,
  MrContext,
  ReviewerRecommendation,
  RiskAssessment,
  SimilarIncident,
  TestRecommendation,
} from '../types.js';
import { levelFor } from '../analysis/riskScore.js';

const MODEL = 'claude-opus-4-8';

export const AiEnrichment = z.object({
  riskScore: z.number().describe('Final risk score 0-100, anchored on the baseline but adjusted by your reasoning'),
  riskReasoning: z
    .array(z.string())
    .describe('4-6 crisp sentences explaining the risk, most important first. Reference concrete services, files and history.'),
  executiveSummary: z.object({
    overview: z.string().describe('2 sentences, plain language, no jargon'),
    businessImpact: z.string().describe('What this means for revenue/customers, 1-2 sentences for a manager'),
    deploymentRisk: z.string().describe('1-2 sentences on deployment risk for a manager'),
    recommendedActions: z.array(z.string()).describe('3-5 imperative actions'),
  }),
  testPlan: z.array(
    z.object({
      category: z.enum(['Unit', 'Integration', 'Security', 'Regression', 'Performance']),
      name: z.string(),
      rationale: z.string().describe('Why this test matters for THIS change, referencing the graph context'),
      priority: z.enum(['P0', 'P1', 'P2']),
      targets: z.array(z.string()).describe('Files or services this test targets'),
    }),
  ),
  deployment: z.object({
    safeWindow: z.string(),
    canary: z.string(),
    featureFlag: z.string(),
    rollback: z.string().describe('Concrete rollback strategy; cite lessons from similar past MRs when relevant'),
    monitoring: z.array(z.string()).describe('4-6 specific metrics/alerts to watch'),
  }),
  reviewerNotes: z.array(
    z.object({
      username: z.string(),
      explanation: z.string().describe('1-2 sentences on why this person should review, citing their graph relationship'),
    }),
  ),
});
export type AiEnrichmentT = z.infer<typeof AiEnrichment>;

export function isAiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface EnrichmentInput {
  ctx: MrContext;
  risk: RiskAssessment;
  services: AffectedService[];
  reviewers: ReviewerRecommendation[];
  incidents: SimilarIncident[];
  baselineTests: TestRecommendation[];
}

export type EnrichmentResult = Pick<AnalysisReport, 'risk' | 'executiveSummary' | 'testPlan' | 'deployment'> & {
  reviewers: ReviewerRecommendation[];
};

export const SYSTEM = `You are Orbit Change Guardian, an expert release engineer and SRE embedded in GitLab.
You receive (1) a merge request summary, (2) the blast radius extracted from GitLab Orbit's knowledge graph,
(3) a deterministic baseline risk model, and (4) similar historical merge requests with outcomes.

Your job is to reason about deployment impact like a principal engineer who has seen these systems fail before:
- Anchor your risk score on the baseline, adjusting at most ±12 points, and justify any adjustment.
- Be specific. Name services, files, endpoints, and past incidents. Never write generic advice that could apply to any MR.
- Lessons from similar past MRs are your strongest signal — weave them into rollback and canary strategy.
- The executive summary is for a non-technical engineering manager: no acronyms without expansion, no file paths.
- Recommend 4-6 tests total across categories; only include categories that genuinely apply.`;

// Shared between every LLM provider: the exact context we hand the model.
export function buildContext(input: EnrichmentInput) {
  return {
    mergeRequest: {
      title: input.ctx.title,
      project: input.ctx.project,
      branch: input.ctx.branch,
      author: input.ctx.author,
      changedFiles: input.ctx.changedFiles,
    },
    baselineRisk: input.risk,
    affectedServices: input.services,
    candidateReviewers: input.reviewers.map(({ username, name, role, score, signals }) => ({ username, name, role, score, signals })),
    similarHistoricalMRs: input.incidents,
    baselineTestPlan: input.baselineTests,
  };
}

// Shared between every LLM provider: turn validated Ai output into a report slice.
export function applyEnrichment(input: EnrichmentInput, ai: AiEnrichmentT): EnrichmentResult {
  const score = Math.round(Math.max(0, Math.min(100, ai.riskScore)));
  const reviewerNoteByUser = new Map(ai.reviewerNotes.map((n) => [n.username, n.explanation]));

  return {
    risk: {
      ...input.risk,
      score,
      level: levelFor(score),
      reasoning: ai.riskReasoning,
    },
    executiveSummary: ai.executiveSummary,
    testPlan: ai.testPlan,
    deployment: ai.deployment,
    reviewers: input.reviewers.map((r) => ({
      ...r,
      explanation: reviewerNoteByUser.get(r.username) ?? `${r.name}: ${r.signals.join('; ')}.`,
    })),
  };
}

export async function enrichWithClaude(input: EnrichmentInput): Promise<EnrichmentResult> {
  const client = new Anthropic();

  const context = buildContext(input);

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Analyze this merge request and produce the enriched assessment.\n\n${JSON.stringify(context, null, 2)}`,
      },
    ],
    output_config: { format: zodOutputFormat(AiEnrichment) },
  });

  const ai = response.parsed_output as AiEnrichmentT | null;
  if (!ai) throw new Error('Claude returned unparseable output');

  return applyEnrichment(input, ai);
}
