import { Component } from '@angular/core';

interface FlowStep {
  id: string;
  label: string;
  detail: string;
  gate?: 'human' | 'auto';
}

interface Stat {
  value: string;
  label: string;
  note: string;
}

@Component({
  selector: 'app-ai',
  standalone: true,
  templateUrl: './ai.component.html',
  styleUrl: './ai.component.scss',
})
export class AiComponent {
  readonly steps: FlowStep[] = [
    { id: 'signal',    label: 'Signal',             detail: 'Health check, log pattern, or user report arrives on the NATS bus.' },
    { id: 'incident',  label: 'Incident opened',    detail: 'Third consecutive failure trips the threshold. Auto-opens an incident in the CMDB.' },
    { id: 'triage',    label: 'AI triage',          detail: 'Claude reads recent logs + affected-CI metadata, picks the likely fault class.' },
    { id: 'diagnosis', label: 'Diagnosis',          detail: 'Proposed root cause + SLO-impact estimate + remediation action (Ansible / k8s).' },
    { id: 'gate',      label: 'Human gate',         detail: 'Anything destructive, prod-scoped, or novel pauses for approval. Routine cases flow through.', gate: 'human' },
    { id: 'execute',   label: 'Execute',            detail: 'Remediation fires via the infrastructure service. Trail captured in audit.', gate: 'auto' },
    { id: 'verify',    label: 'Verify + close',     detail: 'Post-remediation measurement confirms the SLO recovered. Incident closed automatically.' },
  ];

  readonly pillars = [
    {
      icon: '🎯',
      heading: 'SLO-anchored',
      body: 'Every incident carries the SLO it violated. The AI has to claim (and the system has to verify) that the remediation restored it — "looks better" is not a resolution.',
    },
    {
      icon: '🪟',
      heading: 'Glass-box by default',
      body: 'Diagnosis, proposed action, and actual commands run are all captured in the CMDB audit trail. Every AI decision can be replayed after the fact.',
    },
    {
      icon: '🧍',
      heading: 'Human-in-the-loop',
      body: 'Routine class-1 faults can auto-execute. Anything unusual — novel fault, prod blast radius, low confidence — pauses on a human gate.',
    },
    {
      icon: '🔬',
      heading: 'Continuously benchmarked',
      body: 'The Gremlin control room replays known-answer scenarios on every deploy. Regressions in AI quality get caught before they touch real incidents.',
    },
  ];

  readonly stats: Stat[] = [
    { value: '3×',     label: 'consecutive failures',  note: 'threshold before an incident opens — deflates transient blips' },
    { value: '<30 s',  label: 'median time-to-triage', note: 'signal → AI diagnosis posted to the incident' },
    { value: 'class-1', label: 'scope of auto-execute', note: 'narrow, known-pattern faults only; everything else pauses for a human' },
  ];
}
