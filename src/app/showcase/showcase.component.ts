import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmsService, IntegrationPoint, ShowcaseStep, ShowcaseChoice } from '../cms.service';

@Component({
  selector: 'app-showcase',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './showcase.component.html',
  styleUrl: './showcase.component.scss',
})
export class ShowcaseComponent implements OnInit {
  /** Fallbacks mirror directus/seed/seed-items.json. Rendered on load and
   *  kept if the CMS fetch fails. */
  readonly integrationPoints = signal<IntegrationPoint[]>([
    { id: 0, sort: 1, kind: 'host',  heading: 'Where it runs',
      body: 'A single Go service (ops-portal-incidents) calls the Claude API. No standing agent, no background loops — the model is invoked synchronously when an incident opens and again after a remediation attempt.' },
    { id: 0, sort: 2, kind: 'read',  heading: 'What it reads',
      body: 'The opened incident record, the affected CI\'s recent logs from Loki, the last few Prometheus samples for the violated SLO, and any prior incidents on the same CI. Context window budget is capped; older trails get summarised, not dropped.' },
    { id: 0, sort: 3, kind: 'write', heading: 'What it writes',
      body: 'A diagnosis comment on the incident, a proposed remediation payload, and — if the payload passes the gate — a change record in the CMDB that the infrastructure service then executes. Every field is audited.' },
  ]);

  readonly steps = signal<ShowcaseStep[]>([
    { id: 0, sort: 1, step_id: 'signal',    label: 'Signal',          detail: 'Health check, log pattern, or user report arrives on the NATS bus. No AI involvement yet.' },
    { id: 0, sort: 2, step_id: 'incident',  label: 'Incident opened', detail: 'Third consecutive failure trips the threshold. A record lands in the CMDB — this is what the model will see.' },
    { id: 0, sort: 3, step_id: 'triage',    label: 'AI triage',       detail: 'Claude is handed the incident + recent logs + SLO context and returns a fault-class guess. Low-confidence returns flow straight to a human, not to step 4.' },
    { id: 0, sort: 4, step_id: 'diagnosis', label: 'Diagnosis',       detail: 'Proposed root cause + the specific remediation payload (Ansible play or k8s patch). Written to the incident before any execution is considered.' },
    { id: 0, sort: 5, step_id: 'gate',      label: 'Human gate',      detail: 'Anything destructive, prod-scoped, or novel pauses here. Routine, narrow, well-known faults pass through automatically.', gate: 'human' },
    { id: 0, sort: 6, step_id: 'execute',   label: 'Execute',         detail: 'Remediation fires via the infrastructure service. The exact command is captured in the audit trail — not the AI\'s description of it, the actual payload.', gate: 'auto' },
    { id: 0, sort: 7, step_id: 'verify',    label: 'Verify + close',  detail: 'Post-remediation measurement re-checks the SLO. If it recovered, the incident closes. If not, the loop opens a fresh incident rather than re-prompting.' },
  ]);

  readonly choices = signal<ShowcaseChoice[]>([
    { id: 0, sort: 1, icon: '🎯', heading: 'SLO-anchored',
      body: 'The model doesn\'t decide whether a remediation worked. The SLO does. This keeps the conversation grounded in signals the rest of the stack also believes in.' },
    { id: 0, sort: 2, icon: '🪟', heading: 'Glass-box',
      body: 'Prompt, response, proposed payload, actual payload, and outcome are all in the audit trail. Replay is how we debug the model, not tracing frameworks wrapped around the SDK.' },
    { id: 0, sort: 3, icon: '🧍', heading: 'Narrow auto-execute',
      body: 'Auto-execute is scoped to a short allow-list of class-1 fault patterns (stuck deployments, leaked PIDs, orphan PVCs). Everything else pauses for approval by default.' },
    { id: 0, sort: 4, icon: '🔬', heading: 'Benchmarked, not trusted',
      body: 'The Gremlin control room replays known-answer scenarios on every deploy. Quality regressions get caught on the bench, before a real incident meets a worse model.' },
  ]);

  constructor(private cms: CmsService) {}

  ngOnInit(): void {
    this.cms.showcaseIntegrationPoints().subscribe(rows => {
      if (rows && rows.length) this.integrationPoints.set(rows);
    });
    this.cms.showcaseSteps().subscribe(rows => {
      if (rows && rows.length) this.steps.set(rows);
    });
    this.cms.showcaseChoices().subscribe(rows => {
      if (rows && rows.length) this.choices.set(rows);
    });
  }
}
