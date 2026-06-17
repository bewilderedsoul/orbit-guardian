import type { AnalysisReport } from '../types';

export async function analyzeMr(input: {
  mrUrl: string;
  branch: string;
  commitSha: string;
}): Promise<AnalysisReport> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Analysis failed (HTTP ${res.status})`);
  }
  return res.json();
}
