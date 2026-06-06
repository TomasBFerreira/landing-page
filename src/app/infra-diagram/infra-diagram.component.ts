import { Component }          from '@angular/core';
import { CommonModule }        from '@angular/common';
import { HealthCheckService }  from '../health-check.service';
import { ServiceStatus }       from '../models/service.model';

interface TopoNode {
  name: string;
  icon: string;
  /** Matches a SERVICES id so we can show a live status dot; omit for structural nodes. */
  serviceId?: string;
  note?: string;
}

interface TopoLayer {
  label: string;
  nodes: TopoNode[];
}

/**
 * A curated, clean topology map of the platform underneath the apps. Unlike the
 * old CMDB-snapshot dump, this is hand-shaped for legibility on the public page:
 * a few labelled layers from the edge down to compute. Where a node maps to a
 * probed service we surface its live status dot from HealthCheckService; purely
 * structural nodes (Cloudflare, Proxmox, k3s) render without a dot.
 */
@Component({
  selector: 'app-infra-diagram',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './infra-diagram.component.html',
  styleUrl: './infra-diagram.component.scss',
})
export class InfraDiagramComponent {
  readonly layers: TopoLayer[] = [
    {
      label: 'Edge',
      nodes: [
        { name: 'Cloudflare', icon: '🌐', note: 'tunnel + DNS' },
        { name: 'Traefik', icon: '⇆', serviceId: 'traefik', note: 'reverse proxy' },
      ],
    },
    {
      label: 'Identity & secrets',
      nodes: [
        { name: 'Authentik', icon: '🪪', serviceId: 'authentik', note: 'SSO / OIDC' },
        { name: 'Vault', icon: '🔐', serviceId: 'vault-prod', note: 'secrets' },
      ],
    },
    {
      label: 'Cluster & compute',
      nodes: [
        { name: 'Rancher', icon: '☸', serviceId: 'rancher', note: 'k3s mgmt' },
        { name: 'k3s', icon: '⬡', note: 'kubernetes' },
        { name: 'Proxmox', icon: '🖧', note: 'hypervisor' },
      ],
    },
    {
      label: 'Observability & automation',
      nodes: [
        { name: 'Grafana', icon: '◷', serviceId: 'grafana', note: 'metrics & logs' },
        { name: 'Semaphore', icon: '⚙', serviceId: 'semaphore', note: 'ansible' },
      ],
    },
  ];

  constructor(private health: HealthCheckService) {}

  statusFor(node: TopoNode): ServiceStatus | null {
    if (!node.serviceId) return null;
    const match = this.health.states().find(s => s.service.id === node.serviceId);
    return match?.status ?? 'unknown';
  }
}
