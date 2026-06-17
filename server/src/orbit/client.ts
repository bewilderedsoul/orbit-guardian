import type {
  AnalyzeRequest,
  ChangedFile,
  MrContext,
  OrbitEntity,
  OrbitGraph,
  OrbitRelation,
} from '../types.js';
import { demoGraph, demoScenarios, type DemoScenario } from './mockGraph.js';

const GITLAB_BASE = process.env.GITLAB_BASE_URL ?? 'https://gitlab.com';
const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
const ORBIT_GRAPHQL_URL = process.env.ORBIT_GRAPHQL_URL; // e.g. https://gitlab.com/api/orbit/graphql

export function isLiveMode(): boolean {
  return Boolean(GITLAB_TOKEN && ORBIT_GRAPHQL_URL);
}

export function parseMrUrl(mrUrl: string): { project: string; iid: number } {
  // https://gitlab.com/group/project/-/merge_requests/42
  const m = mrUrl.match(/^https?:\/\/[^/]+\/(.+?)\/-\/merge_requests\/(\d+)/);
  if (m) return { project: m[1], iid: Number(m[2]) };
  const tail = mrUrl.match(/(\d+)\s*$/);
  return { project: 'commerce/payment-service', iid: tail ? Number(tail[1]) : 1 };
}

// ---------------------------------------------------------------------------
// Live mode — GitLab REST for MR diffs + Orbit GraphQL for the knowledge graph
// ---------------------------------------------------------------------------

async function fetchLiveMrContext(req: AnalyzeRequest): Promise<MrContext> {
  const { project, iid } = parseMrUrl(req.mrUrl);
  const enc = encodeURIComponent(project);
  const headers = { 'PRIVATE-TOKEN': GITLAB_TOKEN! };

  const [mrRes, diffRes] = await Promise.all([
    fetch(`${GITLAB_BASE}/api/v4/projects/${enc}/merge_requests/${iid}`, { headers }),
    fetch(`${GITLAB_BASE}/api/v4/projects/${enc}/merge_requests/${iid}/diffs?per_page=100`, { headers }),
  ]);
  if (!mrRes.ok || !diffRes.ok) {
    throw new Error(`GitLab API error: MR=${mrRes.status} diffs=${diffRes.status}`);
  }
  const mr = (await mrRes.json()) as any;
  const diffs = (await diffRes.json()) as any[];

  const securityPatterns = /(auth|token|secret|crypto|payment|password|jwt|oauth|cert|key)/i;
  const changedFiles: ChangedFile[] = diffs.map((d) => {
    const added = (d.diff?.match(/^\+[^+]/gm) ?? []).length;
    const removed = (d.diff?.match(/^-[^-]/gm) ?? []).length;
    const sensitive = securityPatterns.test(d.new_path);
    return {
      path: d.new_path,
      additions: added,
      deletions: removed,
      securitySensitive: sensitive,
      criticality: sensitive ? 'high' : 'medium',
    };
  });

  return {
    mrUrl: req.mrUrl,
    mrIid: iid,
    project,
    title: mr.title,
    author: mr.author?.username ?? 'unknown',
    branch: req.branch || mr.source_branch,
    commitSha: req.commitSha || mr.sha,
    changedFiles,
    dataSource: 'orbit-live',
  };
}

async function fetchLiveOrbitGraph(ctx: MrContext): Promise<OrbitGraph> {
  // Query Orbit's knowledge graph for entities connected to the changed files.
  const query = `
    query ImpactGraph($project: String!, $paths: [String!]!) {
      orbit {
        entities(project: $project, filePaths: $paths, traversalDepth: 3) {
          nodes { id type name metadata }
          relations { from to type weight }
        }
      }
    }`;
  const res = await fetch(ORBIT_GRAPHQL_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GITLAB_TOKEN}`,
    },
    body: JSON.stringify({
      query,
      variables: { project: ctx.project, paths: ctx.changedFiles.map((f) => f.path) },
    }),
  });
  if (!res.ok) throw new Error(`Orbit GraphQL error: ${res.status}`);
  const json = (await res.json()) as any;
  const data = json.data?.orbit?.entities;
  if (!data) throw new Error('Orbit GraphQL returned no entity data');
  return { entities: data.nodes, relations: data.relations };
}

// ---------------------------------------------------------------------------
// Demo mode — deterministic scenario selection from the MR iid
// ---------------------------------------------------------------------------

function pickScenario(iid: number): DemoScenario {
  return demoScenarios[iid % demoScenarios.length];
}

function buildDemoContext(req: AnalyzeRequest): { ctx: MrContext; scenario: DemoScenario } {
  const { iid } = parseMrUrl(req.mrUrl);
  const scenario = pickScenario(iid);
  return {
    scenario,
    ctx: {
      mrUrl: req.mrUrl,
      mrIid: iid,
      project: scenario.project,
      title: scenario.title,
      author: scenario.author,
      branch: req.branch || 'feature/orbit-demo',
      commitSha: req.commitSha || 'a3f8c21d',
      changedFiles: scenario.changedFiles,
      dataSource: 'orbit-demo',
    },
  };
}

function buildDemoGraph(ctx: MrContext, scenario: DemoScenario): OrbitGraph {
  // Attach the MR's changed files as first-class graph entities wired to
  // their components, then return the full topology for traversal.
  const fileEntities: OrbitEntity[] = ctx.changedFiles.map((f) => ({
    id: `file:${f.path}`,
    type: 'file',
    name: f.path,
    metadata: { criticality: f.criticality, securitySensitive: f.securitySensitive },
  }));
  const fileRelations: OrbitRelation[] = ctx.changedFiles
    .filter((f) => scenario.fileComponentMap[f.path])
    .map((f) => ({ from: `file:${f.path}`, to: scenario.fileComponentMap[f.path], type: 'part_of' as const }));

  return {
    entities: [...fileEntities, ...demoGraph.entities],
    relations: [...fileRelations, ...demoGraph.relations],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface OrbitQueryResult {
  ctx: MrContext;
  graph: OrbitGraph;
}

export async function queryOrbit(req: AnalyzeRequest): Promise<OrbitQueryResult> {
  if (isLiveMode()) {
    try {
      const ctx = await fetchLiveMrContext(req);
      const graph = await fetchLiveOrbitGraph(ctx);
      return { ctx, graph };
    } catch (err) {
      console.warn(`[orbit] live query failed, falling back to demo graph: ${(err as Error).message}`);
    }
  }
  const { ctx, scenario } = buildDemoContext(req);
  return { ctx, graph: buildDemoGraph(ctx, scenario) };
}

// ---------------------------------------------------------------------------
// Graph traversal — BFS outward from the changed files
// ---------------------------------------------------------------------------

export interface TraversalResult {
  /** entity id -> shortest distance from a changed file */
  distances: Map<string, number>;
  /** relations on any discovered path */
  pathRelations: OrbitRelation[];
  entityById: Map<string, OrbitEntity>;
  /** entity id -> the relation that first (shortest-path) reached it, for path reconstruction */
  cameFrom: Map<string, OrbitRelation>;
  /** total edges examined during the walk (telemetry) */
  edgesExamined: number;
}

/**
 * Walks the graph from changed files outward. Structural edges are followed
 * forward (file -> component -> service -> api/pipeline/repo) and dependency
 * edges are followed in REVERSE (if checkout depends_on payment and payment
 * changed, checkout is impacted). Context edges (owners, findings, history)
 * are collected for any node already in the blast radius.
 */
export function traverse(graph: OrbitGraph, maxDepth = 4): TraversalResult {
  const entityById = new Map(graph.entities.map((e) => [e.id, e]));
  const distances = new Map<string, number>();
  const pathRelations: OrbitRelation[] = [];
  const cameFrom = new Map<string, OrbitRelation>();
  const seenRel = new Set<string>();
  let edgesExamined = 0;

  const forward = new Map<string, OrbitRelation[]>();
  const reverseDeps = new Map<string, OrbitRelation[]>();
  for (const r of graph.relations) {
    if (['part_of', 'belongs_to', 'exposes', 'built_by', 'contained_in'].includes(r.type)) {
      (forward.get(r.from) ?? forward.set(r.from, []).get(r.from)!).push(r);
    }
    if (r.type === 'depends_on' || r.type === 'consumes') {
      (reverseDeps.get(r.to) ?? reverseDeps.set(r.to, []).get(r.to)!).push(r);
    }
  }

  const queue: Array<{ id: string; depth: number }> = [];
  for (const e of graph.entities) {
    if (e.type === 'file') {
      distances.set(e.id, 0);
      queue.push({ id: e.id, depth: 0 });
    }
  }

  const addRel = (r: OrbitRelation) => {
    const key = `${r.from}->${r.to}:${r.type}`;
    if (!seenRel.has(key)) {
      seenRel.add(key);
      pathRelations.push(r);
    }
  };

  while (queue.length) {
    const { id, depth } = queue.shift()!;
    if (depth >= maxDepth) continue;

    for (const r of forward.get(id) ?? []) {
      edgesExamined++;
      addRel(r);
      if (!distances.has(r.to) || distances.get(r.to)! > depth + 1) {
        distances.set(r.to, depth + 1);
        cameFrom.set(r.to, r);
        queue.push({ id: r.to, depth: depth + 1 });
      }
    }
    // who depends on me / consumes my API → impacted downstream
    for (const r of reverseDeps.get(id) ?? []) {
      edgesExamined++;
      addRel(r);
      if (!distances.has(r.from) || distances.get(r.from)! > depth + 1) {
        distances.set(r.from, depth + 1);
        cameFrom.set(r.from, r);
        queue.push({ id: r.from, depth: depth + 1 });
      }
    }
  }

  // contextual edges into the blast radius (owners, findings, historical MRs, incidents)
  for (const r of graph.relations) {
    if (['owns', 'contributed_to', 'affects', 'modified'].includes(r.type) && distances.has(r.to)) {
      addRel(r);
    }
    if (r.type === 'caused' && distances.has(r.from)) addRel(r);
    if (r.type === 'impacted' && distances.has(r.to)) addRel(r);
  }

  return { distances, pathRelations, entityById, cameFrom, edgesExamined };
}
