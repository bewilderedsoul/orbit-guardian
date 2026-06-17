import type { MrContext, SimilarIncident } from '../types.js';
import type { TraversalResult } from '../orbit/client.js';

/**
 * Similarity search over Orbit's merge_request history: past MRs that
 * modified the same components score on component overlap, plus a bonus
 * when they impacted the same services through linked incidents.
 */
export function findSimilarIncidents(ctx: MrContext, t: TraversalResult): SimilarIncident[] {
  const changedComponents = new Set(
    t.pathRelations.filter((r) => r.type === 'part_of').map((r) => r.to),
  );

  const impactedServices = new Set(
    [...t.distances.keys()].filter((id) => id.startsWith('svc:')),
  );

  const results: SimilarIncident[] = [];
  for (const e of t.entityById.values()) {
    if (e.type !== 'merge_request') continue;

    const modified = t.pathRelations
      .filter((r) => r.type === 'modified' && r.from === e.id)
      .map((r) => r.to);
    const fileOverlap = modified.filter((c) => changedComponents.has(c)).length;
    if (fileOverlap === 0) continue;

    const causedIncidents = t.pathRelations
      .filter((r) => r.type === 'caused' && r.from === e.id)
      .map((r) => r.to);
    const serviceOverlap = t.pathRelations
      .filter((r) => r.type === 'impacted' && causedIncidents.includes(r.from) && impactedServices.has(r.to))
      .length;

    const similarity = Math.min(
      0.97,
      0.4 + 0.25 * fileOverlap + 0.15 * serviceOverlap,
    );

    const md = e.metadata as Record<string, string>;
    results.push({
      mrId: e.name.split(' ')[0],
      title: e.name.replace(/^!\d+\s*/, ''),
      similarity: Math.round(similarity * 100) / 100,
      outcome: (md.outcome as SimilarIncident['outcome']) ?? 'deployed-clean',
      date: md.date ?? '',
      overlap: { files: fileOverlap, services: serviceOverlap },
      lesson: md.lesson ?? '',
    });
  }

  return results.sort((a, b) => b.similarity - a.similarity).slice(0, 4);
}
