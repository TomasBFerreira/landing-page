import { Component, ElementRef, HostListener, ViewChild, computed, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { TopologyLookupService } from './topology-lookup.service';
import { TopologyInspectorComponent } from './topology-inspector.component';
import { DiagramBoxComponent } from './diagram-box.component';
import { Rect, layoutDiagram } from './diagram-layout';
import { iconUrl } from './icons';
import { ServiceStatus } from '../models/service.model';
import { EDGES, HOSTS, NODES, STEPS, STEP_ITEMS, Linkable, PathKind, TopoEdge, TopoItem } from './topology.data';

interface EdgeView { edge: TopoEdge; d: string; lx: number; ly: number; }

const MAX_ZOOM_IN = 10;   // smallest viewBox is 1/10th of the canvas width
const WHEEL_SPEED = 0.0015;
const DRAG_THRESHOLD = 5; // px before a press becomes a pan, so clicks on boxes still select

/**
 * Interactive topology diagram. The whole homelab is one SVG: the network path
 * on top, then each Proxmox host with its LXC containers and the k3s VM and
 * apps inside. It is dense, so a fullscreen view adds pan and zoom. On phones
 * the SVG is hidden in favour of the stepper and the inspector list.
 */
@Component({
  selector: 'app-topology-map',
  standalone: true,
  imports: [NgTemplateOutlet, TopologyInspectorComponent, DiagramBoxComponent],
  templateUrl: './topology-map.component.html',
  styleUrl: './topology-map.component.scss',
})
export class TopologyMapComponent {
  readonly layout = layoutDiagram();
  readonly view = { w: this.layout.width, h: this.layout.height };
  readonly nodes = NODES;
  readonly modes: { id: PathKind; label: string; hint: string }[] = [
    { id: 'public',  label: 'Public path',        hint: 'Internet → Cloudflare → tunnel' },
    { id: 'private', label: 'Private (Tailscale)', hint: 'Tailnet → AdGuard DNS → Traefik' },
  ];

  readonly mode = signal<PathKind>('public');
  readonly selectedId = signal<string | null>(null);
  readonly inspectId = signal<string>('betsy');
  readonly fullscreen = signal(false);
  readonly vb = signal<Rect>({ x: 0, y: 0, w: this.layout.width, h: this.layout.height });

  readonly edgeViews: EdgeView[] = EDGES.map(e => this.layoutEdge(e));
  readonly iconUrl = iconUrl;

  private readonly itemsById = new Map<string, TopoItem>([
    ...NODES.map(n => [n.id, n] as [string, TopoItem]),
    ...STEP_ITEMS.map(i => [i.id, i] as [string, TopoItem]),
    ...this.layout.items,
  ]);

  readonly selected = computed(() => {
    const id = this.selectedId();
    return id ? this.itemsById.get(id) ?? null : null;
  });

  readonly steps = computed(() =>
    STEPS[this.mode()].map(id => this.itemsById.get(id)).filter((i): i is TopoItem => !!i));

  @ViewChild('fsRoot') private fsRoot?: ElementRef<HTMLElement>;
  @ViewChild('expandBtn') private expandBtn?: ElementRef<HTMLButtonElement>;

  private opener: HTMLElement | null = null;
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private pressStart: { x: number; y: number } | null = null;
  private dragged = false;
  private suppressClick = false;

  constructor(private lookup: TopologyLookupService) {}

  // ── selection ────────────────────────────────────────────────────────────
  setMode(m: PathKind): void { this.mode.set(m); }
  select(id: string): void {
    if (this.suppressClick) { this.suppressClick = false; return; }
    this.selectedId.set(this.selectedId() === id ? null : id);
  }
  closeDetail(): void { this.selectedId.set(null); }
  inspect(id: string): void { this.inspectId.set(id); }

  lit(item: { paths: PathKind[] }): boolean { return item.paths.includes(this.mode()); }
  edgeLit(e: TopoEdge): boolean { return e.kind === 'shared' || e.kind === this.mode(); }

  /** Lit when on the active path, dimmed when on the other path only, neutral when on neither. */
  boxState(paths: PathKind[]): 'lit' | 'dim' | 'plain' {
    if (!paths.length) return 'plain';
    return paths.includes(this.mode()) ? 'lit' : 'dim';
  }

  isProd(hostId: string): boolean { return HOSTS.find(h => h.id === hostId)?.env === 'prod'; }

  /** Live status and links come from prod probes, so only prod gets them. */
  statusFor(item: Linkable, hostId?: string): ServiceStatus | null {
    if (hostId && !this.isProd(hostId)) return null;
    return this.lookup.statusFor(item);
  }
  urlFor(item: Linkable): string | null {
    const id = (item as TopoItem).id;
    const host = id?.includes(':') ? id.split(':')[0] : undefined;
    if (host && !this.isProd(host)) return null;
    return this.lookup.urlFor(item);
  }

  accessLabel(item: TopoItem): string | null {
    switch (item.access) {
      case 'sso':     return 'Sign-in required';
      case 'private': return 'Tailscale only';
      case 'public':  return 'Public';
      default:        return null;
    }
  }

  // ── fullscreen + pan/zoom ───────────────────────────────────────────────
  open(): void {
    this.opener = document.activeElement as HTMLElement | null;
    this.resetView();
    this.fullscreen.set(true);
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.fsRoot?.nativeElement.querySelector<HTMLElement>('.fs__close')?.focus());
  }

  close(): void {
    this.fullscreen.set(false);
    document.body.style.overflow = '';
    (this.opener ?? this.expandBtn?.nativeElement)?.focus();
    this.opener = null;
  }

  resetView(): void { this.vb.set({ x: 0, y: 0, w: this.view.w, h: this.view.h }); }

  zoomBy(factor: number): void {
    const v = this.vb();
    this.zoomAt(factor, { x: v.x + v.w / 2, y: v.y + v.h / 2 });
  }

  private zoomAt(factor: number, p: { x: number; y: number }): void {
    const v = this.vb();
    const w = Math.min(Math.max(v.w * factor, this.view.w / MAX_ZOOM_IN), this.view.w * 1.1);
    const k = w / v.w;
    this.vb.set(this.clampView({ x: p.x - (p.x - v.x) * k, y: p.y - (p.y - v.y) * k, w, h: v.h * k }));
  }

  private pan(dx: number, dy: number): void {
    const v = this.vb();
    this.vb.set(this.clampView({ ...v, x: v.x + dx, y: v.y + dy }));
  }

  /** Keeps at least a third of the canvas on screen so you can't lose the diagram. */
  private clampView(v: Rect): Rect {
    const mx = v.w * 0.66;
    const my = v.h * 0.66;
    return {
      ...v,
      x: Math.min(Math.max(v.x, -mx), this.view.w - v.w + mx),
      y: Math.min(Math.max(v.y, -my), this.view.h - v.h + my),
    };
  }

  private toSvg(svg: SVGSVGElement, cx: number, cy: number): { x: number; y: number } {
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    const r = pt.matrixTransform(m.inverse());
    return { x: r.x, y: r.y };
  }

  onWheel(e: WheelEvent): void {
    e.preventDefault();
    const svg = e.currentTarget as SVGSVGElement;
    this.zoomAt(Math.exp(e.deltaY * WHEEL_SPEED), this.toSvg(svg, e.clientX, e.clientY));
  }

  onPointerDown(e: PointerEvent): void {
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (this.pointers.size === 1) { this.pressStart = { x: e.clientX, y: e.clientY }; this.dragged = false; }
  }

  onPointerMove(e: PointerEvent): void {
    const prev = this.pointers.get(e.pointerId);
    if (!prev) return;
    const svg = e.currentTarget as SVGSVGElement;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size >= 2) {
      const other = [...this.pointers.entries()].find(([id]) => id !== e.pointerId)![1];
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const now = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      if (before > 0 && now > 0) {
        this.dragged = true;
        this.zoomAt(before / now, this.toSvg(svg, (e.clientX + other.x) / 2, (e.clientY + other.y) / 2));
      }
      return;
    }

    if (!this.dragged && this.pressStart &&
        Math.hypot(e.clientX - this.pressStart.x, e.clientY - this.pressStart.y) < DRAG_THRESHOLD) return;
    if (!this.dragged) { this.dragged = true; svg.setPointerCapture(e.pointerId); }
    const m = svg.getScreenCTM();
    if (m) this.pan(-(e.clientX - prev.x) / m.a, -(e.clientY - prev.y) / m.d);
  }

  onPointerUp(e: PointerEvent): void {
    this.pointers.delete(e.pointerId);
    if (this.dragged) this.suppressClick = true;   // a pan must not also click the box under the cursor
    if (this.pointers.size === 0) { this.pressStart = null; this.dragged = false; }
  }

  onFsKey(e: KeyboardEvent): void {
    const step = this.vb().w * 0.08;
    switch (e.key) {
      case '+': case '=': this.zoomBy(0.8); break;
      case '-': case '_': this.zoomBy(1.25); break;
      case '0': this.resetView(); break;
      case 'ArrowLeft':  if (this.isBackground(e)) this.pan(-step, 0); break;
      case 'ArrowRight': if (this.isBackground(e)) this.pan(step, 0); break;
      case 'ArrowUp':    if (this.isBackground(e)) this.pan(0, -step); break;
      case 'ArrowDown':  if (this.isBackground(e)) this.pan(0, step); break;
      case 'Tab': this.trapFocus(e); return;
      default: return;
    }
    e.preventDefault();
  }

  /** Arrow keys pan only when no control has focus. */
  private isBackground(e: KeyboardEvent): boolean {
    return !(e.target as HTMLElement).closest?.('button, [role="button"]');
  }

  private trapFocus(e: KeyboardEvent): void {
    const root = this.fsRoot?.nativeElement;
    if (!root) return;
    const f = Array.from(root.querySelectorAll<HTMLElement>('button, [role="button"], a[href]'));
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.fullscreen()) this.close();
    else if (this.selectedId()) this.closeDetail();
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

  private rectOf(id: string): Rect {
    const n = NODES.find(x => x.id === id);
    if (n) return n;
    if (HOSTS.some(h => h.id === id)) return this.layout.hostRect(id);
    throw new Error(`topology: unknown edge endpoint ${id}`);
  }
}
