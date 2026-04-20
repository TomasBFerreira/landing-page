import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  standalone: true,
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  readonly milestones = [
    {
      year: '2022',
      title: 'The first server',
      body: 'A single N100 mini-PC in the corner of the office. One Proxmox install, one VM, one reason to start: stop paying for cloud storage.',
    },
    {
      year: '2023',
      title: 'From a VM to a cluster',
      body: 'Three nodes joined the Proxmox cluster. k3s landed on top, Traefik became the front door, and the first self-hosted services (Nextcloud, Sonarr + Radarr) moved in.',
    },
    {
      year: '2024',
      title: 'SSO, Vault, and a control plane',
      body: 'Authentik slotted in as the identity layer. Vault took over secrets. The first generation of the ops portal replaced a pile of ad-hoc kubectl commands.',
    },
    {
      year: '2025',
      title: 'Blue / green + GitOps everywhere',
      body: 'Blue-green worker slots, Traefik GitOps with Cloudflare DNS sync, and an AI-assisted incident workflow that turns alerts into runbook executions.',
    },
    {
      year: '2026',
      title: 'Microservices, not a monolith',
      body: 'The ops portal split into eight focused services on a shared template. Wiki.js joined as the long-form knowledge base. Observability via Prometheus / Loki / Tempo became table stakes.',
    },
  ];

  readonly principles = [
    {
      heading: 'Self-hosted by default',
      body: 'Where a self-hosted equivalent meets the need, it wins. Data lives on disks I can touch; account identity lives in Authentik, not someone else\'s auth provider.',
    },
    {
      heading: 'GitOps is the audit trail',
      body: 'Every change is a PR. Every PR is a deploy. The git log is the deployment history, the CMDB captures the business-impact layer on top.',
    },
    {
      heading: 'Automation follows a human, not the other way around',
      body: 'AI handles triage and routine remediation. Humans stay in the loop for anything with real blast radius.',
    },
    {
      heading: 'Observability is not optional',
      body: 'If a service doesn\'t emit metrics, logs, and traces, it\'s not finished. Monitoring is a first-class citizen of every deploy.',
    },
  ];
}
