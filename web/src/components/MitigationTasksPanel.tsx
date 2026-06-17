import { useState } from 'react';
import type { MitigationTask } from '../types';
import { SectionCard } from './SectionCard';

const kindMeta: Record<MitigationTask['kind'], { icon: string; accent: string }> = {
  'security-review': { icon: '🛡', accent: '#f87171' },
  'integration-testing': { icon: '⇄', accent: '#38bdf8' },
  'deployment-approval': { icon: '🚀', accent: '#fc6d26' },
  monitoring: { icon: '📈', accent: '#34d399' },
};

function TaskCard({ task, project, mrIid }: { task: MitigationTask; project: string; mrIid: number }) {
  const [created, setCreated] = useState(false);
  const [copied, setCopied] = useState(false);
  const meta = kindMeta[task.kind];

  // The GraphQL mutation GitLab Orbit would run to create this work item.
  const mutation = `mutation {
  workItemCreate(input: {
    namespacePath: "${project}"
    workItemTypeId: "gid://gitlab/WorkItems::Type/Task"
    title: ${JSON.stringify(task.title)}
    descriptionWidget: { description: ${JSON.stringify(task.description)} }
  }) { workItem { id iid webUrl } errors }
}`;

  const copyMutation = async () => {
    try {
      await navigator.clipboard.writeText(mutation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <div className="rounded-xl border border-ink-700/60 bg-ink-850/60 p-4" style={{ borderLeftColor: meta.accent, borderLeftWidth: 3 }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="text-lg">{meta.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="chip bg-ink-700 font-mono text-[10px] text-ink-200">{task.workItemType}</span>
              {task.blocking && <span className="chip bg-red-500/15 text-[10px] text-red-400">blocks merge</span>}
            </div>
            <p className="mt-1 text-sm font-semibold leading-snug text-ink-100">{task.title}</p>
          </div>
        </div>
      </div>

      <pre className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap rounded-lg border border-ink-700/50 bg-ink-950/60 p-3 text-[11px] leading-relaxed text-ink-200">
        {task.description}
      </pre>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {task.labels.map((l) => (
          <span key={l} className="chip bg-ink-700 font-mono text-[10px] text-ink-200">~{l}</span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400">
        <span>assignee <span className="font-mono text-ink-200">{task.suggestedAssignee}</span></span>
        <span>due in <span className="font-mono text-ink-200">{task.dueInDays}d</span></span>
        <span>on <span className="font-mono text-ink-200">!{mrIid}</span></span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setCreated(true)}
          disabled={created}
          className="rounded-lg bg-gradient-to-r from-ember-600 to-ember-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:from-emerald-600 disabled:to-emerald-500 disabled:opacity-90"
        >
          {created ? '✓ Work item created' : 'Create work item'}
        </button>
        <button
          onClick={copyMutation}
          className="rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-medium text-ink-200 transition hover:border-ember-500/60 hover:text-ink-100"
        >
          {copied ? 'Copied!' : 'Copy GraphQL'}
        </button>
      </div>
    </div>
  );
}

export function MitigationTasksPanel({
  tasks,
  project,
  mrIid,
}: {
  tasks: MitigationTask[];
  project: string;
  mrIid: number;
}) {
  const [generated, setGenerated] = useState(false);
  const blocking = tasks.filter((t) => t.blocking).length;

  return (
    <SectionCard
      icon="✦"
      title="Mitigation Tasks"
      badge={
        generated ? (
          <span className="chip bg-ink-800 text-ink-200">
            {tasks.length} GitLab Work Items{blocking ? ` · ${blocking} blocking` : ''}
          </span>
        ) : undefined
      }
    >
      {!generated ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="max-w-md text-sm text-ink-300">
            Turn this analysis into actionable GitLab Work Items — a security review, integration testing, deployment
            approval, and monitoring task — each pre-filled and ready to create on the MR.
          </p>
          <button
            onClick={() => setGenerated(true)}
            className="rounded-lg bg-gradient-to-r from-ember-600 to-violet-glow px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110"
          >
            ✦ Generate Mitigation Tasks
          </button>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {tasks.map((t) => (
            <TaskCard key={t.kind} task={t} project={project} mrIid={mrIid} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
