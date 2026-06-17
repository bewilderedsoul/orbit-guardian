import { useMemo } from 'react';
import { ReactFlow, Background, Controls, type Node, type Edge, Position, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { BlastRadius, EntityType } from '../types';
import { SectionCard } from './SectionCard';

const typeStyle: Record<EntityType, { color: string; label: string }> = {
  file: { color: '#8b93ab', label: 'Changed file' },
  component: { color: '#a989f5', label: 'Component' },
  service: { color: '#fc6d26', label: 'Service' },
  api: { color: '#38bdf8', label: 'API' },
  pipeline: { color: '#34d399', label: 'Pipeline' },
  repository: { color: '#b6bccf', label: 'Repository' },
  person: { color: '#f472b6', label: 'Owner' },
  security_finding: { color: '#f87171', label: 'Security finding' },
  merge_request: { color: '#fbbf24', label: 'Historical MR' },
  incident: { color: '#ef4444', label: 'Incident' },
};

const columnOf: Partial<Record<EntityType, number>> = {
  file: 0,
  component: 1,
  service: 2,
  api: 3,
  pipeline: 3,
  repository: 3,
  person: 4,
  security_finding: 4,
  merge_request: 4,
  incident: 4,
};

export function BlastRadiusGraph({ blast }: { blast: BlastRadius }) {
  const { nodes, edges } = useMemo(() => {
    const counters = new Map<number, number>();
    const nodes: Node[] = blast.nodes.map((n) => {
      const col = columnOf[n.type] ?? 4;
      const row = counters.get(col) ?? 0;
      counters.set(col, row + 1);
      const style = typeStyle[n.type];
      return {
        id: n.id,
        position: { x: col * 250, y: row * 64 + (col % 2) * 22 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: n.label.length > 30 ? `…${n.label.slice(-29)}` : n.label },
        style: {
          background: '#13161f',
          border: `1.5px solid ${style.color}${n.impact === 'context' ? '55' : ''}`,
          borderRadius: 10,
          color: n.impact === 'context' ? '#8b93ab' : '#e3e6ef',
          fontSize: 11,
          fontFamily: '"JetBrains Mono", monospace',
          padding: '6px 10px',
          width: 200,
          boxShadow: n.impact === 'direct' && n.type === 'service' ? `0 0 18px -4px ${style.color}88` : 'none',
        },
      };
    });

    const edges: Edge[] = blast.edges.map((e) => {
      const impactEdge = ['part_of', 'belongs_to', 'depends_on', 'consumes'].includes(e.relation);
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: impactEdge,
        label: impactEdge ? undefined : e.relation.replace('_', ' '),
        labelStyle: { fill: '#5c647d', fontSize: 9 },
        labelBgStyle: { fill: '#0e1118' },
        style: { stroke: impactEdge ? '#fc6d26' : '#2e3447', opacity: impactEdge ? 0.7 : 0.8 },
        markerEnd: { type: MarkerType.ArrowClosed, color: impactEdge ? '#fc6d26' : '#5c647d', width: 14, height: 14 },
      };
    });

    return { nodes, edges };
  }, [blast]);

  const stats = [
    { label: 'Changed files', value: blast.stats.changedFiles },
    { label: 'Direct services', value: blast.stats.directServices },
    { label: 'Transitive services', value: blast.stats.transitiveServices },
    { label: 'APIs', value: blast.stats.apis },
    { label: 'Pipelines', value: blast.stats.pipelines },
    { label: 'Repos', value: blast.stats.repositories },
  ];

  return (
    <SectionCard
      icon="◉"
      title="Blast Radius — Orbit Dependency Graph"
      badge={
        <div className="flex gap-2">
          {stats.map((s) => (
            <span key={s.label} className="chip bg-ink-800 text-ink-200" title={s.label}>
              <span className="font-mono text-ember-400">{s.value}</span> {s.label.toLowerCase()}
            </span>
          ))}
        </div>
      }
    >
      <div className="h-[460px] overflow-hidden rounded-xl border border-ink-700/60 bg-ink-950/60">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          proOptions={{ hideAttribution: true }}
          nodesDraggable
          nodesConnectable={false}
        >
          <Background color="#222736" gap={24} size={1.5} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {Object.entries(typeStyle).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-ink-300">
            <span className="h-2.5 w-2.5 rounded-sm border" style={{ borderColor: v.color, background: `${v.color}22` }} />
            {v.label}
          </span>
        ))}
      </div>
    </SectionCard>
  );
}
