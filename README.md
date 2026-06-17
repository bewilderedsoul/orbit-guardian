# 🛡 Orbit Change Guardian — AI Merge Request Copilot

**Predict the blast radius before you merge.** Orbit Change Guardian is a GitLab Orbit application that analyzes any Merge Request and — using Orbit's knowledge graph — predicts affected services, deployment risk, recommended reviewers, test plans, similar past incidents, and a complete deployment safety strategy. All before a single line is merged.

![stack](https://img.shields.io/badge/React%2018-TypeScript-blue) ![backend](https://img.shields.io/badge/Node-Express-green) ![ai](https://img.shields.io/badge/AI-Claude%20Opus%204.8-orange) ![data](https://img.shields.io/badge/Data-GitLab%20Orbit-purple)

---

## What it does

Give it a **Merge Request URL + branch + commit SHA** and it:

1. **Retrieves changed files** from the GitLab API.
2. **Queries GitLab Orbit** for every entity connected to those files — components, services, APIs, pipelines, repositories, owners, security findings, historical MRs, incidents.
3. **Traverses dependency relationships** — structural edges forward (`file → component → service → API/pipeline`) and `depends_on`/`consumes` edges in *reverse*, so downstream consumers of a changed service land in the blast radius.
4. **Reasons with Claude** (structured outputs, adaptive thinking) over the assembled graph context, anchored on a deterministic baseline risk model.
5. **Renders a full risk report**: score gauge, interactive dependency graph, services table, ranked reviewers, prioritized test plan, incident similarity search with lessons learned, deployment advisor, and a non-technical executive summary.

## Feature map

| Feature | How Orbit powers it |
|---|---|
| **Blast Radius Analysis** | BFS over Orbit entity graph; reverse-traversal of `depends_on` edges finds transitive impact |
| **AI Risk Scoring (0–100)** | Explainable 6-factor baseline (criticality, fan-out, security surface, incident history, pipeline health, churn) refined ±12 pts by Claude with cited reasoning |
| **Reviewer Recommendations** | `owns` / `contributed_to` edges into the blast radius, ranked + boosted for security engineers on sensitive diffs |
| **Smart Test Planner** | Test categories derived from what the graph shows is actually at risk, each with rationale + priority |
| **Incident Similarity Search** | Past MRs sharing components, scored by component/service overlap, with incident outcomes and lessons |
| **Deployment Safety Advisor** | Window, canary plan, feature-flag guidance, rollback strategy citing past rollback lessons, monitoring checklist |
| **Executive Summary** | Plain-language business impact for engineering leadership |
| **Orbit Insights** | Live telemetry of the traversal: nodes traversed, services impacted, dependencies analyzed, historical MRs compared, and a breakdown of every Orbit relation type used — proof the analysis is graph-driven |
| **Why Orbit?** | For each impacted service, the *exact* reconstructed shortest path `file → component → service → dependency` that placed it in the blast radius |
| **Generate Mitigation Tasks** | One click turns the analysis into four GitLab Work Items (security review, integration testing, deployment approval, monitoring) with markdown bodies, labels, assignees, blocking flags, and the `workItemCreate` GraphQL mutation ready to copy |

## Architecture

```
┌────────────┐   POST /api/analyze    ┌──────────────────────────────────┐
│  React 18  │ ─────────────────────▶ │  Express (TypeScript)            │
│  Tailwind  │                        │                                  │
│  React Flow│ ◀───── report JSON ─── │  1 Orbit client ──▶ GitLab Orbit │
└────────────┘                        │    (GraphQL + REST, demo mode)   │
                                      │  2 Graph traversal (BFS+reverse) │
                                      │  3 Deterministic risk engine     │
                                      │  4 Claude reasoning layer        │
                                      │    (claude-opus-4-8, structured  │
                                      │     outputs, adaptive thinking)  │
                                      └──────────────────────────────────┘
```

**Graceful degradation, by design:**

- No `GITLAB_TOKEN` / `ORBIT_GRAPHQL_URL`? → A rich built-in **demo knowledge graph** (9 services, owners, security findings, 6 historical MRs, 2 incidents) powers the full experience.
- No `ANTHROPIC_API_KEY`? → A deterministic **heuristic engine** produces the same report shape. The dashboard header shows which engines are live.

## Quick start

```bash
npm install
npm run dev        # server on :4000, dashboard on :5173
```

Open http://localhost:5173 and click **Analyze impact**. Three demo scenarios (selected by MR number) show Critical, High, and Low risk profiles:

- `…/payment-service/-/merge_requests/1893` → async payment-capture refactor (critical path)
- `…/auth-service/-/merge_requests/871` → JWT validation hardening (security)
- `…/platform-web/-/merge_requests/443` → storefront promo banner (low risk)

### Enable Claude reasoning

```bash
cp .env.example .env   # then set ANTHROPIC_API_KEY
```

### Connect a live GitLab Orbit instance

Set `GITLAB_TOKEN` (read_api scope) and `ORBIT_GRAPHQL_URL` in `.env`. The client pulls MR diffs from the GitLab REST API and the impact graph from Orbit GraphQL, falling back to demo mode on any failure.

### Production build

```bash
npm run build && npm start   # Express serves the built dashboard on :4000
```

## Demo script (3 minutes)

1. **Open the dashboard** — point out live engine badges (Orbit source + AI engine).
2. **Analyze the payment MR** — watch the staged analysis sequence, then walk the risk gauge: *every point of the score is attributed to a graph-derived factor*.
3. **Blast radius graph** — drag nodes; changed files flow into components, services light up, and `checkout-service`/`order-service` appear *even though the MR never touched them* — that's reverse dependency traversal over Orbit.
4. **Incident similarity** — `!1841 Refactor provider retry logic` caused a 41-minute payment outage; note how the rollback strategy in the Deployment Advisor cites that exact lesson.
5. **Switch to the promo-banner MR** — risk collapses to Low, the test plan shrinks, deployment advice relaxes. Same engine, graph-driven judgment.
6. **Executive summary** — close on the manager-readable view: business impact, deployment risk, actions.

## Project layout

```
server/src/
  orbit/client.ts        # Orbit GraphQL + GitLab REST client, demo fallback, graph traversal
  orbit/mockGraph.ts     # demo knowledge graph + 3 MR scenarios
  analysis/blastRadius.ts# graph → blast radius + affected services
  analysis/riskScore.ts  # explainable 6-factor risk model
  analysis/reviewers.ts  # ownership/contribution ranking
  analysis/incidents.ts  # MR similarity search
  analysis/insights.ts   # Orbit traversal telemetry (Orbit Insights panel)
  analysis/impactPaths.ts# shortest-path reconstruction (Why Orbit? panel)
  analysis/mitigation.ts # GitLab Work Item generation
  analysis/heuristics.ts # no-API-key fallback narratives
  ai/llm.ts              # Claude structured-output reasoning layer
  routes/analyze.ts      # the analysis pipeline
web/src/
  components/            # dashboard sections (risk card, React Flow graph, panels)
```
