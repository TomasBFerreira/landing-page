import { Component, HostListener, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthCheckService } from '../health-check.service';
import { SERVICES } from '../services.config';
import { ServiceStatus } from '../models/service.model';
import {
  CHIP_GAP, CHIP_H, CHIP_W, EDGES, GROUP_LABEL_H, GROUP_PAD, GROUP_ORDER, HOSTS, HOST_H, HOST_HEAD_H, HOST_W,
  NODES, STEPS, VIEW,
  ChipGroup, PathKind, TopoChip, TopoEdge, TopoHost, TopoItem,
} from './topology.data';

const GROUP_LABEL: Record<ChipGroup, string> = { network: 'Network', platform: 'Platform', workloads: 'Workloads' };

interface Rect { x: number; y: number; w: number; h: number; }
interface ChipView { chip: TopoChip; rect: Rect; }
interface GroupView { label: string; x: number; y: number; chips: ChipView[]; }
interface HostView { host: TopoHost; rect: Rect; groups: GroupView[]; }
interface EdgeView { edge: TopoEdge; d: string; lx: number; ly: number; }

/**
 * Interactive topology map. One data file (topology.data.ts) drives two layouts:
 * an SVG on wide screens and a stepper + accordions on narrow ones. CSS picks
 * which is visible, so there are no resize listeners.
 */
@Component({
  selector: 'app-topology-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topology-map.component.html',
  styleUrl: './topology-map.component.scss',
})
export class TopologyMapComponent {
  readonly view = VIEW;
  readonly nodes = NODES;
  readonly modes: { id: PathKind; label: string; hint: string }[] = [
    { id: 'public',  label: 'Public path',        hint: 'Internet → Cloudflare → tunnel' },
    { id: 'private', label: 'Private (Tailscale)', hint: 'Tailnet → AdGuard DNS → Traefik' },
  ];

  readonly mode = signal<PathKind>('public');
  readonly selectedId = signal<string | null>(null);

  readonly hostViews: HostView[] = HOSTS.map(h => this.layoutHost(h));
  readonly edgeViews: EdgeView[] = EDGES.map(e => this.layoutEdge(e));

  private readonly itemsById = new Map<string, TopoItem>([
    ...NODES.map(n => [n.id, n] as [string, TopoItem]),
    ...HOSTS.flatMap(h => [
      [h.id, { id: h.id, label: h.name, desc: h.desc, paths: h.paths } as TopoItem] as [string, TopoItem],
      ...h.chips.map(c => [c.id, c] as [string, TopoItem]),
    ]),
  ]);

  readonly selected = computed(() => {
    const id = this.selectedId();
    return id ? this.itemsById.get(id) ?? null : null;
  });

  readonly steps = computed(() =>
    STEPS[this.mode()].map(id => this.itemsById.get(id)).filter((i): i is TopoItem => !!i));

  constructor(private health: HealthCheckService) {}

  setMode(m: PathKind): void { this.mode.set(m); }
  select(id: string): void { this.selectedId.set(this.selectedId() === id ? null : id); }
  close(): void { this.selectedId.set(null); }

  lit(item: { paths: PathKind[] }): boolean { return item.paths.includes(this.mode()); }
  edgeLit(e: TopoEdge): boolean { return e.kind === 'shared' || e.kind === this.mode(); }

  private readonly statusById = computed(() =>
    new Map(this.health.states().map(s => [s.service.id, s.status] as [string, ServiceStatus])));

  private readonly urlById = new Map(SERVICES.map(s => [s.id, s.url] as [string, string]));

  statusFor(item: TopoItem): ServiceStatus | null {
    if (!item.serviceId) return null;
    return this.statusById().get(item.serviceId) ?? 'unknown';
  }

  urlFor(item: TopoItem): string | null {
    return item.serviceId ? this.urlById.get(item.serviceId) ?? null : null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.selectedId()) this.close(); }

  accessLabel(item: TopoItem): string | null {
    switch (item.access) {
      case 'sso':     return 'Sign-in required';
      case 'private': return 'Tailscale only';
      case 'public':  return 'Public';
      default:        return null;
    }
  }

  /** Total chips on the host, shown in the mobile accordion header. */
  chipCount(h: HostView): number { return h.host.chips.length; }

  private layoutHost(host: TopoHost): HostView {
    const rect: Rect = { x: host.x, y: host.y, w: HOST_W, h: HOST_H };
    let cursor = host.y + HOST_HEAD_H;
    const groups: GroupView[] = [];
    for (const g of GROUP_ORDER) {
      const members = host.chips.filter(c => c.group === g);
      if (!members.length) continue;
      const gy = cursor;
      cursor += GROUP_LABEL_H;
      const chips = members.map((chip, i): ChipView => ({
        chip,
        rect: {
          x: host.x + 12 + (i % 2) * (CHIP_W + CHIP_GAP),
          y: cursor + Math.floor(i / 2) * (CHIP_H + CHIP_GAP),
          w: CHIP_W, h: CHIP_H,
        },
      }));
      cursor += Math.ceil(members.length / 2) * (CHIP_H + CHIP_GAP) + GROUP_PAD;
      groups.push({ label: GROUP_LABEL[g], x: host.x + 12, y: gy + 10, chips });
    }
    return { host, rect, groups };
  }

  private rectOf(id: string): Rect {
    const n = NODES.find(x => x.id === id);
    if (n) return n;
    const h = HOSTS.find(x => x.id === id);
    if (h) return { x: h.x, y: h.y, w: HOST_W, h: HOST_H };
    throw new Error(`topology: unknown edge endpoint ${id}`);
  }

  private layoutEdge(e: TopoEdge): EdgeView {
    const a = this.rectOf(e.from);
    const b = this.rectOf(e.to);
    const x1 = a.x + a.w / 2;
    const y1 = a.y + a.h;
    if (e.route === 'left') {
      const x2 = b.x + b.w;
      const y2 = b.y + b.h / 2;
      return { edge: e, d: `M${x1},${y1} V${y2} H${x2}`, lx: (x1 + x2) / 2, ly: y2 - 8 };
    }
    const x2 = b.x + b.w / 2;
    const y2 = b.y;
    const mid = y1 + (y2 - y1) / 2;
    return { edge: e, d: `M${x1},${y1} V${mid} H${x2} V${y2}`, lx: x1 + 10, ly: y1 + (y2 - y1) / 2 - 6 };
  }
}
