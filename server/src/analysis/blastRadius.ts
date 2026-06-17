import type { AffectedService, BlastRadius, GraphEdge, GraphNode, MrContext } from '../types.js';
import type { TraversalResult } from '../orbit/client.js';

export function buildBlastRadius(ctx: MrContext, t: TraversalResult): BlastRadius {
  const nodes: GraphNode[] = [];
  const includedIds = new Set<string>();

  for (const [id, dist] of t.distances) {
    const e = t.entityById.get(id);
    if (!e) continue;
    includedIds.add(id);
    nodes.push({
      id,
      label: e.name,
      type: e.type,
      impact: dist === 0 ? 'direct' : dist <= 2 ? 'direct' : 'transitive',
      criticality: (e.metadata?.criticality as string) ?? undefined,
    });
  }

  // contextual nodes referenced by path relations (people, findings, history)
  for (const r of t.pathRelations) {
    for (const id of [r.from, r.to]) {
      if (includedIds.has(id)) continue;
      const e = t.entityById.get(id);
      if (!e) continue;
      includedIds.add(id);
      nodes.push({ id, label: e.name, type: e.type, impact: 'context' });
    }
  }

  const edges: GraphEdge[] = t.pathRelations
    .filter((r) => includedIds.has(r.from) && includedIds.has(r.to))
    .map((r, i) => ({ id: `e${i}`, source: r.from, target: r.to, relation: r.type }));

  const services = nodes.filter((n) => n.type === 'service');
  return {
    nodes,
    edges,
    stats: {
      changedFiles: ctx.changedFiles.length,
      directServices: services.filter((s) => s.impact === 'direct').length,
      transitiveServices: services.filter((s) => s.impact === 'transitive').length,
      apis: nodes.filter((n) => n.type === 'api').length,
      pipelines: nodes.filter((n) => n.type === 'pipeline').length,
      repositories: nodes.filter((n) => n.type === 'repository').length,
    },
  };
}

export function buildAffectedServices(t: TraversalResult): AffectedService[] {
  const out: AffectedService[] = [];
  for (const [id, dist] of t.distances) {
    const e = t.entityById.get(id);
    if (!e || e.type !== 'service') continue;
    const md = e.metadata as Record<string, string>;
    out.push({
      id,
      name: e.name,
      tier: md.tier ?? 'tier-2',
      impact: dist <= 2 ? 'direct' : 'transitive',
      distance: dist,
      criticality: (md.criticality as AffectedService['criticality']) ?? 'medium',
      owner: md.owner ?? '—',
      slo: md.slo ?? '—',
      reason:
        dist <= 2
          ? 'Contains components modified by this MR'
          : 'Depends on a modified service via the Orbit dependency graph',
    });
  }
  return out.sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name));
}
