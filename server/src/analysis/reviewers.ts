import type { MrContext, ReviewerRecommendation } from '../types.js';
import type { TraversalResult } from '../orbit/client.js';

/**
 * Ranks reviewers from Orbit ownership and contribution edges into the blast
 * radius. Ownership of a directly-changed component scores highest, then
 * recent contribution, then ownership of impacted (downstream) entities.
 * Security engineers get a boost when the MR touches sensitive files.
 */
export function recommendReviewers(ctx: MrContext, t: TraversalResult): ReviewerRecommendation[] {
  const scores = new Map<string, { score: number; signals: Set<string> }>();
  const bump = (person: string, points: number, signal: string) => {
    const cur = scores.get(person) ?? { score: 0, signals: new Set<string>() };
    cur.score += points;
    cur.signals.add(signal);
    scores.set(person, cur);
  };

  const sensitive = ctx.changedFiles.some((f) => f.securitySensitive);

  for (const r of t.pathRelations) {
    const dist = t.distances.get(r.to);
    if (r.type === 'owns' && dist !== undefined) {
      const target = t.entityById.get(r.to);
      if (dist <= 1) bump(r.from, 40, `Owns ${target?.name} (directly modified)`);
      else if (dist <= 2) bump(r.from, 25, `Owns ${target?.name} (in direct blast radius)`);
      else bump(r.from, 10, `Owns downstream ${target?.name}`);
    }
    if (r.type === 'contributed_to' && dist !== undefined && dist <= 2) {
      const target = t.entityById.get(r.to);
      bump(r.from, Math.round(15 * (r.weight ?? 0.5)), `Frequent contributor to ${target?.name}`);
    }
  }

  // security boost
  if (sensitive) {
    for (const [id, e] of t.entityById) {
      if (e.type === 'person' && String(e.metadata?.role ?? '').toLowerCase().includes('security')) {
        bump(id, 22, 'Security engineer — MR touches security-sensitive files');
      }
    }
  }

  // never recommend the author as their own reviewer
  const out: ReviewerRecommendation[] = [];
  for (const [id, { score, signals }] of scores) {
    const e = t.entityById.get(id);
    if (!e) continue;
    const username = String(e.metadata?.username ?? id.replace('person:', ''));
    if (username === ctx.author) continue;
    out.push({
      username,
      name: e.name,
      role: String(e.metadata?.role ?? 'Engineer'),
      score: Math.min(99, score),
      signals: [...signals],
      explanation: '',
    });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 5);
}
