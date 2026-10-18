/**
 * The homelab topology, as data. Hand-maintained: verified read-only against the
 * three Proxmox hosts on 2026-10-18. No IPs or VMIDs on purpose — this page is
 * public. Layout coordinates are in the SVG viewBox used by TopologyMapComponent.
 */

export type PathKind = 'public' | 'private';
export type Access = 'public' | 'sso' | 'private';
export type ChipGroup = 'network';
export type HostEnv = 'prod' | 'dev' | 'qa';

export interface TopoItem {
  id: string;
  label: string;
  desc: string;
  /** Which traffic paths run through this item; items on neither stay in the background. */
  paths: PathKind[];
  /** Matches a SERVICES id to show a live status dot and an open link. */
  serviceId?: string;
  /** Keep the status dot but don't offer an "Open" link. */
  noLink?: boolean;
  access?: Access;
}

export interface TopoNode extends TopoItem {
  x: number; y: number; w: number; h: number;
}

export interface TopoChip extends TopoItem {
  group: ChipGroup;
}

export interface TopoHost {
  id: string;
  name: string;
  env: HostEnv;
  desc: string;
  paths: PathKind[];
  x: number; y: number;
  chips: TopoChip[];
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

export const VIEW = { w: 1000, h: 650 };
export const HOST_W = 300;
export const HOST_H = 190;

// Host-box layout constants. The component lays chips out with these and the
// spec checks the same numbers, so they can't drift apart.
export const CHIP_W = 135;
export const CHIP_H = 30;
export const CHIP_GAP = 8;
export const GROUP_LABEL_H = 18;
export const GROUP_PAD = 6;
export const HOST_HEAD_H = 44;
/** Room under the chips for the "16 LXC · 1 VM · 15 apps" line. */
export const HOST_FOOT_H = 28;
export const GROUP_ORDER: ChipGroup[] = ['network'];

/** Vertical space a host's chips need, in the same units as HOST_H. */
export function hostContentHeight(chips: TopoChip[]): number {
  let h = HOST_HEAD_H + HOST_FOOT_H;
  for (const g of GROUP_ORDER) {
    const n = chips.filter(c => c.group === g).length;
    if (!n) continue;
    h += GROUP_LABEL_H + Math.ceil(n / 2) * (CHIP_H + CHIP_GAP) + GROUP_PAD;
  }
  return h;
}

export const NODES: TopoNode[] = [
  { id: 'internet', label: 'Internet', x: 250, y: 20, w: 200, h: 54, paths: ['public'],
    desc: 'Anyone on the public web. Public hostnames resolve to Cloudflare, never to my home IP.' },
  { id: 'cloudflare', label: 'Cloudflare', x: 250, y: 120, w: 200, h: 54, paths: ['public'],
    desc: 'DNS, TLS termination and DDoS protection. Forwards requests into a Cloudflare Tunnel.' },
  { id: 'isp', label: 'ISP router', x: 250, y: 220, w: 200, h: 54, paths: ['public'],
    desc: 'The ISP box. No ports are forwarded to the lab: the tunnel is dialled out from inside, so nothing listens on the public side.' },
  { id: 'router', label: 'Homelab router', x: 250, y: 320, w: 200, h: 54, paths: ['public', 'private'],
    desc: 'Physical router for the lab network. Joins the three Proxmox hosts and sits between them and the ISP router.' },
  { id: 'tailnet', label: 'Tailscale devices', x: 640, y: 220, w: 200, h: 54, paths: ['private'],
    desc: 'My laptop and phone on the tailnet. They reach dev, QA and prod directly, bypassing Cloudflare. AdGuard answers *.databaes.net with private addresses.' },
];

const net = (env: HostEnv): TopoChip[] => {
  const prod = env === 'prod';
  return [
    { id: `${env}-cloudflared`, group: 'network', label: 'Cloudflared',
      paths: prod ? ['public'] : [],
      desc: prod
        ? 'Holds the outbound Cloudflare Tunnel and hands requests to Traefik.'
        : 'Tunnel daemon for this environment. The public tunnel is opt-in for dev and QA and is off by default.' },
    { id: `${env}-traefik`, group: 'network', label: 'Traefik', serviceId: prod ? 'traefik' : undefined, noLink: true,
      paths: prod ? ['public', 'private'] : ['private'],
      desc: 'Reverse proxy. Routes by hostname to k3s NodePorts and LXC services, asking Authentik first for apps that need a sign-in. Config is GitOps-managed.' },
    { id: `${env}-adguard`, group: 'network', label: 'AdGuard', paths: ['private'],
      desc: 'DNS for the tailnet. Gives dev and QA hostnames a private answer so they never need a public record.' },
    { id: `${env}-gateway`, group: 'network', label: 'Gateway', paths: ['private'],
      desc: 'Tailscale subnet router, firewall and (prod) WireGuard. Outbound traffic from this subnet is NATed by the Proxmox host.' },
  ];
};

export const HOSTS: TopoHost[] = [
  {
    id: 'betsy', name: 'betsy', env: 'prod', x: 10, y: 450, paths: ['public', 'private'],
    desc: 'Proxmox host for production. The only environment reachable from the public internet.',
    chips: net('prod'),
  },
  {
    id: 'benedict', name: 'benedict', env: 'dev', x: 350, y: 450, paths: ['private'],
    desc: 'Proxmox host for development. Reached over Tailscale; its public tunnel is opt-in.',
    chips: net('dev'),
  },
  {
    id: 'heaton', name: 'heaton', env: 'qa', x: 690, y: 450, paths: ['private'],
    desc: 'Proxmox host for QA. Tailscale only.',
    chips: net('qa'),
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

/** Ordered steps for the mobile stepper, one list per path. */
export const STEPS: Record<PathKind, string[]> = {
  public: ['internet', 'cloudflare', 'isp', 'router', 'prod-cloudflared', 'prod-traefik', 'prod-k3s'],
  private: ['tailnet', 'router', 'prod-adguard', 'prod-gateway', 'prod-traefik', 'prod-k3s'],
};

/** Steps in the mobile stepper that aren't chips in the host boxes. */
export const STEP_ITEMS: TopoItem[] = [
  { id: 'prod-k3s', label: 'Apps on k3s', paths: ['public', 'private'],
    desc: 'The Kubernetes worker VM that runs the apps. Open the betsy inspector below to see each one.' },
];
