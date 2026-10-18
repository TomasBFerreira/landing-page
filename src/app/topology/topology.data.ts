/**
 * The homelab's network path, as data. Hand-maintained: verified read-only
 * against the three Proxmox hosts on 2026-10-18. No IPs or VMIDs on purpose:
 * this page is public. What runs inside each host lives in inventory.data.ts;
 * positions are computed by diagram-layout.ts.
 */

export type PathKind = 'public' | 'private';
export type Access = 'public' | 'sso' | 'private';
export type HostEnv = 'prod' | 'dev' | 'qa';

/** Optional live-status link: a SERVICES id; `noLink` keeps the status dot but hides the Open link. */
export interface Linkable { serviceId?: string; noLink?: boolean; }

export interface TopoItem extends Linkable {
  id: string;
  label: string;
  desc: string;
  /** Which traffic paths run through this item; items on neither stay in the background. */
  paths: PathKind[];
  access?: Access;
}

export interface TopoNode extends TopoItem {
  x: number; y: number; w: number; h: number;
}

export interface TopoHost {
  id: string;
  name: string;
  env: HostEnv;
  desc: string;
  paths: PathKind[];
}

export interface TopoEdge {
  from: string;
  to: string;
  /** 'shared' edges are lit in both modes. */
  kind: PathKind | 'shared';
  label?: string;
  /** 'down' = bottom of `from` to top of `to`; 'left' = bottom of `from` to right side of `to`. */
  route?: 'down' | 'left';
}

/** Canvas width; the middle host column is centred on x = CENTER_X. */
export const VIEW_W = 1780;
export const CENTER_X = VIEW_W / 2;
export const HOST_W = 560;
export const HOST_GAP = 30;
export const HOST_Y = 450;

export const NODES: TopoNode[] = [
  { id: 'internet', label: 'Internet', x: CENTER_X - 110, y: 20, w: 220, h: 54, paths: ['public'],
    desc: 'Anyone on the public web. Public hostnames resolve to Cloudflare, never to my home IP.' },
  { id: 'cloudflare', label: 'Cloudflare', x: CENTER_X - 110, y: 120, w: 220, h: 54, paths: ['public'],
    desc: 'DNS, TLS termination and DDoS protection. Forwards requests into a Cloudflare Tunnel.' },
  { id: 'isp', label: 'ISP router', x: CENTER_X - 110, y: 220, w: 220, h: 54, paths: ['public'],
    desc: 'The ISP box. No ports are forwarded to the lab: the tunnel is dialled out from inside, so nothing listens on the public side.' },
  { id: 'router', label: 'Homelab router', x: CENTER_X - 110, y: 320, w: 220, h: 54, paths: ['public', 'private'],
    desc: 'Physical router for the lab network. Joins the three Proxmox hosts and sits between them and the ISP router.' },
  { id: 'tailnet', label: 'Tailscale devices', x: CENTER_X + 360, y: 220, w: 220, h: 54, paths: ['private'],
    desc: 'My laptop and phone on the tailnet. They reach dev, QA and prod directly, bypassing Cloudflare. AdGuard answers *.databaes.net with private addresses.' },
];

export const HOSTS: TopoHost[] = [
  {
    id: 'betsy', name: 'betsy', env: 'prod', paths: ['public', 'private'],
    desc: 'Proxmox host for production. The only environment reachable from the public internet.',
  },
  {
    id: 'benedict', name: 'benedict', env: 'dev', paths: ['private'],
    desc: 'Proxmox host for development. Reached over Tailscale; its public tunnel is opt-in.',
  },
  {
    id: 'heaton', name: 'heaton', env: 'qa', paths: ['private'],
    desc: 'Proxmox host for QA. Tailscale only.',
  },
];

export const EDGES: TopoEdge[] = [
  { from: 'internet', to: 'cloudflare', kind: 'public', label: 'HTTPS' },
  { from: 'cloudflare', to: 'isp', kind: 'public', label: 'tunnel, dialled outbound' },
  { from: 'isp', to: 'router', kind: 'public' },
  { from: 'tailnet', to: 'router', kind: 'private', route: 'left', label: 'WireGuard' },
  { from: 'router', to: 'betsy', kind: 'shared' },
  { from: 'router', to: 'benedict', kind: 'shared' },
  { from: 'router', to: 'heaton', kind: 'shared' },
];

/** Ordered steps for the mobile stepper. Box ids are `<hostId>:<name>`. */
export const STEPS: Record<PathKind, string[]> = {
  public: ['internet', 'cloudflare', 'isp', 'router', 'betsy:cloudflared', 'betsy:traefik', 'prod-k3s'],
  private: ['tailnet', 'router', 'betsy:adguard', 'betsy:gateway', 'betsy:traefik', 'prod-k3s'],
};

/** Steps in the mobile stepper that aren't boxes in the diagram. */
export const STEP_ITEMS: TopoItem[] = [
  { id: 'prod-k3s', label: 'Apps on k3s', paths: ['public', 'private'],
    desc: 'The Kubernetes worker VM that runs the apps, drawn as the box inside betsy.' },
];
