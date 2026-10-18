import { HOSTS, HOST_GAP, HOST_W, HOST_Y, PathKind, TopoHost, TopoItem, VIEW_W } from './topology.data';
import { AppDef, INVENTORY, LxcDef, Svc, inventoryCounts } from './inventory.data';

export interface Rect { x: number; y: number; w: number; h: number; }
export interface PillView { label: string; icon?: string; x: number; y: number; w: number; }

export interface BoxView {
  /** `<hostId>:<name>`; also the key into TopologyLayout.items. */
  id: string;
  name: string;
  icon?: string;
  rect: Rect;
  pills: PillView[];
  paths: PathKind[];
  stopped: boolean;
  serviceId?: string;
  noLink?: boolean;
}

export interface VmView {
  id: string;
  title: string;
  icons: string[];
  rect: Rect;
  apps: BoxView[];
}

export interface HostLayout {
  host: TopoHost;
  rect: Rect;
  summary: string;
  lxcLabelY: number;
  lxcs: BoxView[];
  vm: VmView;
}

export interface TopologyLayout {
  width: number;
  height: number;
  hosts: HostLayout[];
  /** Every clickable thing in the diagram (hosts, boxes, VMs) as a TopoItem, keyed by id. */
  items: Map<string, TopoItem>;
  hostRect(id: string): Rect;
}

// Geometry, in SVG units.
const MARGIN = 20;
const PAD = 14;
const COL_GAP = 12;
const ROW_GAP = 12;
const HOST_HEAD_H = 46;
const LABEL_H = 24;
const VM_HEAD_H = 46;
const BOX_HEAD_H = 46;
const BOX_PAD = 10;
const PILL_H = 20;
const PILL_GAP_X = 6;
const PILL_GAP_Y = 6;
const CHAR_W = 5.9;     // ~11px Inter
const PILL_ICON_W = 24; // icon + gap
const PILL_TEXT_PAD = 14;

export const BOTTOM_MARGIN = 20;

function pillWidth(s: Svc, max: number): number {
  const w = (s.icon ? PILL_ICON_W : 8) + s.label.length * CHAR_W + PILL_TEXT_PAD - 6;
  return Math.min(Math.ceil(w), max);
}

/** Flows pills left to right, wrapping at `inner`; positions are relative to the box's top-left. */
function flowPills(svcs: Svc[], inner: number): { pills: PillView[]; height: number } {
  const pills: PillView[] = [];
  let x = 0;
  let y = 0;
  for (const s of svcs) {
    const w = pillWidth(s, inner);
    if (x > 0 && x + w > inner) { x = 0; y += PILL_H + PILL_GAP_Y; }
    pills.push({ label: s.label, icon: s.icon, x, y, w });
    x += w + PILL_GAP_X;
  }
  return { pills, height: svcs.length ? y + PILL_H : 0 };
}

interface BoxSpec {
  id: string; name: string; icon?: string; svcs: Svc[]; paths: PathKind[];
  stopped: boolean; serviceId?: string; noLink?: boolean;
}

/** Places boxes into `cols` columns, each box into the currently shortest column. */
function masonry(specs: BoxSpec[], x0: number, y0: number, colW: number, cols: number): { boxes: BoxView[]; bottom: number } {
  const heights = new Array<number>(cols).fill(y0);
  const boxes: BoxView[] = [];
  for (const s of specs) {
    const c = heights.indexOf(Math.min(...heights));
    const bx = x0 + c * (colW + COL_GAP);
    const flow = flowPills(s.svcs, colW - 2 * BOX_PAD);
    const h = BOX_HEAD_H + (flow.height ? flow.height + BOX_PAD : 0) + (flow.height ? 0 : 4);
    boxes.push({
      id: s.id, name: s.name, icon: s.icon, paths: s.paths, stopped: s.stopped,
      serviceId: s.serviceId, noLink: s.noLink,
      rect: { x: bx, y: heights[c], w: colW, h },
      pills: flow.pills.map(p => ({ ...p, x: bx + BOX_PAD + p.x, y: heights[c] + BOX_HEAD_H + p.y })),
    });
    heights[c] += h + ROW_GAP;
  }
  return { boxes, bottom: Math.max(...heights) - ROW_GAP };
}

/** Dev and QA are Tailscale-only (their public tunnel is opt-in), so they never sit on the public path. */
function effectivePaths(host: TopoHost, paths: PathKind[]): PathKind[] {
  return host.env === 'prod' ? paths : paths.filter(p => p === 'private');
}

const lxcSpec = (host: TopoHost, l: LxcDef): BoxSpec => ({
  id: `${host.id}:${l.name}`, name: l.name, icon: l.icon, svcs: l.services,
  paths: effectivePaths(host, l.paths), stopped: l.state === 'stopped', serviceId: l.serviceId, noLink: l.noLink,
});

const appSpec = (host: TopoHost, a: AppDef): BoxSpec => ({
  id: `${host.id}:${a.name}`, name: a.name, icon: a.icon, svcs: a.workloads,
  paths: effectivePaths(host, a.paths), stopped: false, serviceId: a.serviceId, noLink: a.noLink,
});

function layoutHost(host: TopoHost, index: number): HostLayout {
  const inv = INVENTORY[host.id];
  const hx = MARGIN + index * (HOST_W + HOST_GAP);
  const inner = HOST_W - 2 * PAD;
  const lxcColW = (inner - COL_GAP) / 2;

  const lxcLabelY = HOST_Y + HOST_HEAD_H;
  const lxc = masonry(inv.lxcs.map(l => lxcSpec(host, l)), hx + PAD, lxcLabelY + LABEL_H, lxcColW, 2);

  const vmY = lxc.bottom + 22;
  const vmInner = inner - 2 * BOX_PAD;
  const appColW = (vmInner - COL_GAP) / 2;
  const apps = masonry(inv.vm.apps.map(a => appSpec(host, a)), hx + PAD + BOX_PAD, vmY + VM_HEAD_H, appColW, 2);
  const vmH = apps.bottom + BOX_PAD - vmY;

  const counts = inventoryCounts(inv);
  return {
    host,
    rect: { x: hx, y: HOST_Y, w: HOST_W, h: 0 }, // height set once every host is laid out
    summary: `${counts.lxcs} LXC · 1 VM · ${counts.apps} apps`,
    lxcLabelY,
    lxcs: lxc.boxes,
    vm: {
      id: `${host.id}:vm`, title: inv.vm.name, icons: inv.vm.icons,
      rect: { x: hx + PAD, y: vmY, w: inner, h: vmH },
      apps: apps.boxes,
    },
  };
}

export function layoutDiagram(): TopologyLayout {
  const hosts = HOSTS.map((h, i) => layoutHost(h, i));
  // Uniform host height so the three columns line up.
  const bottom = Math.max(...hosts.map(h => h.vm.rect.y + h.vm.rect.h)) + PAD;
  for (const h of hosts) h.rect.h = bottom - HOST_Y;

  const items = new Map<string, TopoItem>();
  for (const hl of hosts) {
    const inv = INVENTORY[hl.host.id];
    items.set(hl.host.id, { id: hl.host.id, label: hl.host.name, desc: hl.host.desc, paths: hl.host.paths });
    items.set(hl.vm.id, { id: hl.vm.id, label: hl.vm.title, desc: inv.vm.desc, paths: [] });
    for (const b of hl.lxcs) {
      const def = inv.lxcs.find(l => `${hl.host.id}:${l.name}` === b.id)!;
      items.set(b.id, { id: b.id, label: b.name, desc: def.desc, paths: b.paths, serviceId: b.serviceId, noLink: b.noLink });
    }
    for (const b of hl.vm.apps) {
      const def = inv.vm.apps.find(a => `${hl.host.id}:${a.name}` === b.id)!;
      items.set(b.id, { id: b.id, label: b.name, desc: def.desc, paths: b.paths, serviceId: b.serviceId, noLink: b.noLink, access: def.access });
    }
  }

  return {
    width: VIEW_W,
    height: bottom + BOTTOM_MARGIN,
    hosts,
    items,
    hostRect: id => hosts.find(h => h.host.id === id)!.rect,
  };
}
