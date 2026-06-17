import {
  AiEnrichment,
  SYSTEM,
  buildContext,
  applyEnrichment,
  type EnrichmentInput,
  type EnrichmentResult,
} from './llm.js';

// Free tier: get a key at https://aistudio.google.com/apikey
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

export function isGeminiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

// Hard schema enforced by Gemini server-side (guarantees enum/required compliance).
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    riskScore: { type: 'NUMBER' },
    riskReasoning: { type: 'ARRAY', items: { type: 'STRING' } },
    executiveSummary: {
      type: 'OBJECT',
      properties: {
        overview: { type: 'STRING' },
        businessImpact: { type: 'STRING' },
        deploymentRisk: { type: 'STRING' },
        recommendedActions: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: ['overview', 'businessImpact', 'deploymentRisk', 'recommendedActions'],
    },
    testPlan: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          category: { type: 'STRING', enum: ['Unit', 'Integration', 'Security', 'Regression', 'Performance'] },
          name: { type: 'STRING' },
          rationale: { type: 'STRING' },
          priority: { type: 'STRING', enum: ['P0', 'P1', 'P2'] },
          targets: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['category', 'name', 'rationale', 'priority', 'targets'],
      },
    },
    deployment: {
      type: 'OBJECT',
      properties: {
        safeWindow: { type: 'STRING' },
        canary: { type: 'STRING' },
        featureFlag: { type: 'STRING' },
        rollback: { type: 'STRING' },
        monitoring: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: ['safeWindow', 'canary', 'featureFlag', 'rollback', 'monitoring'],
    },
    reviewerNotes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { username: { type: 'STRING' }, explanation: { type: 'STRING' } },
        required: ['username', 'explanation'],
      },
    },
  },
  required: ['riskScore', 'riskReasoning', 'executiveSummary', 'testPlan', 'deployment', 'reviewerNotes'],
};

// The JSON shape we require back, spelled out for the model. Mirrors AiEnrichment.
const OUTPUT_SHAPE = `Return ONLY a JSON object (no markdown fences) with exactly this shape:
{
  "riskScore": number (0-100, anchored on baselineRisk, adjust at most ±12),
  "riskReasoning": string[] (4-6 sentences, most important first, cite concrete services/files/incidents),
  "executiveSummary": {
    "overview": string (2 sentences, plain language, no jargon),
    "businessImpact": string (1-2 sentences for a manager, revenue/customer impact),
    "deploymentRisk": string (1-2 sentences for a manager),
    "recommendedActions": string[] (3-5 imperative actions)
  },
  "testPlan": [ { "category": "Unit"|"Integration"|"Security"|"Regression"|"Performance", "name": string, "rationale": string, "priority": "P0"|"P1"|"P2", "targets": string[] } ],
  "deployment": {
    "safeWindow": string, "canary": string, "featureFlag": string,
    "rollback": string (cite lessons from similar past MRs when relevant),
    "monitoring": string[] (4-6 specific metrics/alerts)
  },
  "reviewerNotes": [ { "username": string, "explanation": string } ]
}`;

export async function enrichWithGemini(input: EnrichmentInput): Promise<EnrichmentResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const context = buildContext(input);
  const prompt = `Analyze this merge request and produce the enriched assessment.\n\n${OUTPUT_SHAPE}\n\nContext:\n${JSON.stringify(context, null, 2)}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.4,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text.trim()) throw new Error('Gemini returned empty output');

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Gemini returned unparseable JSON');
  }

  const ai = AiEnrichment.parse(raw); // validates the shape; throws on mismatch
  return applyEnrichment(input, ai);
}
