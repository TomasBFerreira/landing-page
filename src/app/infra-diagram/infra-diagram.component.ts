import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { HealthCheckService } from '../health-check.service';
import { TopologyService, TopologyNode } from '../topology.service';
import { ServiceStatus }       from '../models/service.model';

type Env = 'PROD' | 'QA' | 'DEV';

interface TierGroup {
  tier:   string;
  label:  string;
  nodes:  TopologyNode[];
}

@Component({
  selector: 'app-infra-diagram',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './infra-diagram.component.html',
  styleUrl: './infra-diagram.component.scss',
})
export class InfraDiagramComponent implements OnInit {
  activeEnv = signal<Env>('PROD');

  /** Tier metadata, in the render order we want (0 first, unlabelled last). */
  private readonly TIER_LABELS: Array<{ tier: string; label: string }> = [
    { tier: '0',   label: 'Tier 0 · foundation' },
    { tier: '0.5', label: 'Tier 0.5 · shared platform' },
    { tier: '1',   label: 'Tier 1 · runtime' },
    { tier: '2',   label: 'Tier 2 · applications' },
    { tier: '',    label: 'Unclassified' },
  ];

  readonly tierGroups = computed<TierGroup[]>(() => {
    const envNodes = this.topology.nodes().filter(n => n.env === this.activeEnv());
    return this.TIER_LABELS
      .map(({ tier, label }) => ({
        tier,
        label,
        nodes: envNodes
          .filter(n => (n.tier || '') === tier)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter(g => g.nodes.length > 0);
  });

  readonly totalForEnv = computed(() =>
    this.topology.nodes().filter(n => n.env === this.activeEnv()).length);

  constructor(private health: HealthCheckService, readonly topology: TopologyService) {}

  ngOnInit(): void {
    // Snapshot carries all envs; fetch once, filter client-side.
    this.topology.load();
  }

  setEnv(env: Env) {
    this.activeEnv.set(env);
  }

  /**
   * Map a CI's name to a ServiceStatus using the already-live HealthCheckService
   * (which sources from Grafana probes). We match by name OR by URL → name.
   * For CIs without a matching probe target we return 'unknown' — expected for
   * infrastructure items like "vault-blue-prod" that aren't HTTP probed.
   */
  statusFor(node: TopologyNode): ServiceStatus {
    // Normalise CI name against HealthCheckService states (which key by service.id).
    const match = this.health.states().find(s =>
      s.service.id === node.name || s.service.name === node.name,
    );
    return match?.status ?? 'unknown';
  }

  /** Visual glyph per type. Kept small and ASCII-friendly. */
  iconFor(node: TopologyNode): string {
    switch (node.type) {
      case 'application':     return '▣';
      case 'service':         return '◆';
      case 'infrastructure':  return '⬢';
      case 'network':         return '⇄';
      case 'database':        return '⛁';
      default:                return '•';
    }
  }

  dotClass(node: TopologyNode): string {
    return `status-dot status-dot--${this.statusFor(node)}`;
  }
}
