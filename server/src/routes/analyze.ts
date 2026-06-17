import { Router } from 'express';
import { z } from 'zod';
import type { AnalysisReport } from '../types.js';
import { queryOrbit, traverse } from '../orbit/client.js';
import { buildAffectedServices, buildBlastRadius } from '../analysis/blastRadius.js';
import { computeRisk } from '../analysis/riskScore.js';
import { recommendReviewers } from '../analysis/reviewers.js';
import { findSimilarIncidents } from '../analysis/incidents.js';
import { buildOrbitInsights } from '../analysis/insights.js';
import { buildImpactPaths } from '../analysis/impactPaths.js';
import { buildMitigationTasks } from '../analysis/mitigation.js';
import {
  heuristicDeployment,
  heuristicReviewerNotes,
  heuristicSummary,
  heuristicTestPlan,
} from '../analysis/heuristics.js';
import { enrichWithClaude, isAiEnabled } from '../ai/llm.js';
import { enrichWithGemini, isGeminiEnabled } from '../ai/gemini.js';

const AnalyzeBody = z.object({
  mrUrl: z.string().min(1),
  branch: z.string().default(''),
  commitSha: z.string().default(''),
});

export const analyzeRouter = Router();

analyzeRouter.post('/analyze', async (req, res) => {
  const started = Date.now();
  const parsed = AnalyzeBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'mrUrl is required', details: parsed.error.flatten() });
  }

  try {
    // 1. Orbit knowledge graph: changed files + connected entities
    const { ctx, graph } = await queryOrbit(parsed.data);

    // 2. Traverse dependency relationships outward from the change
    const traversal = traverse(graph);

    // 3. Deterministic analysis over the graph
    const blastRadius = buildBlastRadius(ctx, traversal);
    const affectedServices = buildAffectedServices(traversal);
    const similarIncidents = findSimilarIncidents(ctx, traversal);
    const baselineRisk = computeRisk(ctx, traversal, affectedServices, similarIncidents);
    const rankedReviewers = recommendReviewers(ctx, traversal);
    const baselineTests = heuristicTestPlan(ctx, affectedServices);
    const orbitInsights = buildOrbitInsights(traversal);
    const impactPaths = buildImpactPaths(traversal);

    // 4. LLM reasoning layer (graceful heuristic fallback)
    let aiEngine: AnalysisReport['meta']['aiEngine'] = 'heuristic';
    let risk = baselineRisk;
    let reviewers = heuristicReviewerNotes(rankedReviewers);
    let testPlan = baselineTests;
    let deployment = heuristicDeployment(baselineRisk, affectedServices, similarIncidents);
    let executiveSummary = heuristicSummary(ctx, baselineRisk, affectedServices, similarIncidents);

    // Provider preference: Gemini (free tier) → Claude → heuristic fallback.
    const enrichInput = {
      ctx,
      risk: baselineRisk,
      services: affectedServices,
      reviewers: rankedReviewers,
      incidents: similarIncidents,
      baselineTests,
    };
    if (isGeminiEnabled()) {
      try {
        const ai = await enrichWithGemini(enrichInput);
        ({ risk, reviewers, testPlan, deployment, executiveSummary } = ai);
        aiEngine = 'gemini';
      } catch (err) {
        console.warn(`[ai] Gemini enrichment failed, serving heuristic report: ${(err as Error).message}`);
      }
    } else if (isAiEnabled()) {
      try {
        const ai = await enrichWithClaude(enrichInput);
        ({ risk, reviewers, testPlan, deployment, executiveSummary } = ai);
        aiEngine = 'claude';
      } catch (err) {
        console.warn(`[ai] Claude enrichment failed, serving heuristic report: ${(err as Error).message}`);
      }
    }

    // mitigation tasks use the final (possibly AI-refined) risk/deployment
    const mitigationTasks = buildMitigationTasks({
      ctx,
      risk,
      services: affectedServices,
      reviewers,
      testPlan,
      incidents: similarIncidents,
      deployment,
    });

    const report: AnalysisReport = {
      meta: {
        mrUrl: ctx.mrUrl,
        mrIid: ctx.mrIid,
        project: ctx.project,
        title: ctx.title,
        author: ctx.author,
        branch: ctx.branch,
        commitSha: ctx.commitSha,
        analyzedAt: new Date().toISOString(),
        dataSource: ctx.dataSource,
        aiEngine,
        durationMs: Date.now() - started,
      },
      risk,
      blastRadius,
      affectedServices,
      reviewers,
      testPlan,
      similarIncidents,
      deployment,
      executiveSummary,
      orbitInsights,
      impactPaths,
      mitigationTasks,
    };

    res.json(report);
  } catch (err) {
    console.error('[analyze] failed:', err);
    res.status(500).json({ error: 'Analysis failed', message: (err as Error).message });
  }
});
