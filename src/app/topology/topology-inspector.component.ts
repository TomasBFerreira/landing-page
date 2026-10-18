import { Component, computed, input, output } from '@angular/core';
import { HOSTS, Linkable, PathKind } from './topology.data';
import { INVENTORY, inventoryCounts } from './inventory.data';
import { TopologyLookupService } from './topology-lookup.service';

/** Lists what runs inside one Proxmox host: LXC containers, then the k3s worker VM and its apps. */
@Component({
  selector: 'app-topology-inspector',
  standalone: true,
  imports: [],
  host: { '[class.private]': "mode() === 'private'" },
  templateUrl: './topology-inspector.component.html',
  styleUrl: './topology-inspector.component.scss',
})
export class TopologyInspectorComponent {
  readonly mode = input.required<PathKind>();
  readonly hostId = input.required<string>();
  readonly hostChange = output<string>();

  readonly hosts = HOSTS;

  readonly current = computed(() => {
    const host = HOSTS.find(h => h.id === this.hostId()) ?? HOSTS[0];
    const inv = INVENTORY[host.id];
    return { host, inv, counts: inventoryCounts(inv) };
  });

  constructor(private lookup: TopologyLookupService) {}

  /** Narrow screens (same 860px switch as the map) start with the sections collapsed so it isn't a wall of cards. */
  readonly startOpen = typeof matchMedia === 'function' ? !matchMedia('(max-width: 860px)').matches : true;

  /** Live status and links come from prod probes, so only the prod host gets them. */
  private isProd(): boolean { return this.current().host.env === 'prod'; }
  statusFor(item: Linkable) { return this.isProd() ? this.lookup.statusFor(item) : null; }
  urlFor(item: Linkable) { return this.isProd() ? this.lookup.urlFor(item) : null; }

  /**
   * Lit when on the active path, dimmed when on the other path only, neutral when on neither.
   * Dev and QA are Tailscale-only (their public tunnel is opt-in), so they never sit on the public path.
   */
  cardState(paths: PathKind[]): 'lit' | 'dim' | 'plain' {
    const effective = this.isProd() ? paths : paths.filter(p => p === 'private');
    if (!effective.length) return 'plain';
    return effective.includes(this.mode()) ? 'lit' : 'dim';
  }

  iconUrl(key: string): string { return `icons/${key}.svg`; }
  initial(name: string): string { return name.trim().charAt(0).toUpperCase(); }
}
