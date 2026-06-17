import type { ImpactPath, OrbitRelation, PathHop } from '../types.js';
import type { TraversalResult } from '../orbit/client.js';

const FORWARD = new Set(['part_of', 'belongs_to', 'exposes', 'built_by', 'contained_in']);

/**
 * Reconstructs the exact shortest path from a changed file to each impacted
 * service using the `cameFrom` predecessor map recorded during traversal.
 * This is the evidence behind "Why Orbit?": every service in the blast radius
 * gets a literal File → Component → Service → Dependency chain.
 */
export function buildImpactPaths(t: TraversalResult): ImpactPath[] {
  const paths: ImpactPath[] = [];

  for (const [id, dist] of t.distances) {
    const entity = t.entityById.get(id);
    if (!entity || entity.type !== 'service') continue;

    // walk predecessors back to a changed file (distance 0)
    const nodesRev: string[] = [id];
    const relsRev: OrbitRelation[] = [];
    let cur = id;
    let guard = 0;
    while (t.cameFrom.has(cur) && guard++ < 16) {
      const r = t.cameFrom.get(cur)!;
      const pred = FORWARD.has(r.type) ? r.from : r.to; // reverse-dep edges reach r.from from r.to
      relsRev.push(r);
      nodesRev.push(pred);
      cur = pred;
    }

    const nodeIds = nodesRev.reverse();
    const rels = relsRev.reverse();
    const hops: PathHop[] = nodeIds.map((nid, i) => {
      const e = t.entityById.get(nid)!;
      return { id: nid, name: e.name, type: e.type, relation: rels[i]?.type };
    });

    paths.push({
      serviceId: id,
      serviceName: entity.name,
      impact: dist <= 2 ? 'direct' : 'transitive',
      hops,
    });
  }

  return paths.sort((a, b) => a.hops.length - b.hops.length || a.serviceName.localeCompare(b.serviceName));
}
