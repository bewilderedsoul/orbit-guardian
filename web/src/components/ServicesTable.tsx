import type { AffectedService } from '../types';
import { criticalityChip } from '../lib/ui';
import { SectionCard } from './SectionCard';

export function ServicesTable({ services }: { services: AffectedService[] }) {
  return (
    <SectionCard icon="▦" title="Affected Services" badge={<span className="chip bg-ink-800 text-ink-200">{services.length} services</span>}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-700/60 text-xs uppercase tracking-wider text-ink-400">
              <th className="pb-2.5 pr-4 font-medium">Service</th>
              <th className="pb-2.5 pr-4 font-medium">Impact</th>
              <th className="pb-2.5 pr-4 font-medium">Tier</th>
              <th className="pb-2.5 pr-4 font-medium">Criticality</th>
              <th className="pb-2.5 pr-4 font-medium">Owner</th>
              <th className="pb-2.5 pr-4 font-medium">SLO</th>
              <th className="pb-2.5 font-medium">Why</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-b border-ink-800/80 last:border-0">
                <td className="py-2.5 pr-4 font-mono text-ink-100">{s.name}</td>
                <td className="py-2.5 pr-4">
                  <span className={`chip ${s.impact === 'direct' ? 'bg-ember-500/15 text-ember-400' : 'bg-violet-glow/15 text-violet-glow'}`}>
                    {s.impact === 'direct' ? 'Direct' : `Transitive · ${s.distance} hops`}
                  </span>
                </td>
                <td className="py-2.5 pr-4 font-mono text-ink-200">{s.tier}</td>
                <td className="py-2.5 pr-4">
                  <span className={`chip ${criticalityChip[s.criticality]}`}>{s.criticality}</span>
                </td>
                <td className="py-2.5 pr-4 text-ink-200">{s.owner}</td>
                <td className="py-2.5 pr-4 font-mono text-ink-200">{s.slo}</td>
                <td className="py-2.5 text-ink-300">{s.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
