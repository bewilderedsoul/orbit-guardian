import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { analyzeRouter } from './routes/analyze.js';
import { isLiveMode } from './orbit/client.js';
import { isAiEnabled } from './ai/llm.js';
import { isGeminiEnabled } from './ai/gemini.js';

function aiEngineLabel(): string {
  if (isGeminiEnabled()) return `Gemini (${process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'})`;
  if (isAiEnabled()) return 'Claude (claude-opus-4-8)';
  return 'heuristic fallback (set GEMINI_API_KEY or ANTHROPIC_API_KEY to enable an LLM)';
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    orbit: isLiveMode() ? 'live' : 'demo',
    ai: isGeminiEnabled() ? 'gemini' : isAiEnabled() ? 'claude' : 'heuristic',
  });
});

app.use('/api', analyzeRouter);

// Serve the built dashboard when present (single-process demo deploy)
const webDist = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(webDist, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`⛨  Orbit Change Guardian API on http://localhost:${PORT}`);
  console.log(`   Orbit data source : ${isLiveMode() ? 'LIVE (GitLab Orbit GraphQL)' : 'DEMO knowledge graph'}`);
  console.log(`   AI engine         : ${aiEngineLabel()}`);
});
