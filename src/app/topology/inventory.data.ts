import { Access, Linkable, PathKind } from './topology.data';

/**
 * What actually runs inside each Proxmox host: LXC containers and their
 * services, then the k3s worker VM and its apps. Hand-maintained. Betsy was
 * checked container by container and workload by workload read-only on
 * 2026-10-18; benedict and heaton were checked by container list and k3s
 * namespace only. Names are role names, not
 * Proxmox names: no VMIDs, and no blue/green slot suffix.
 *
 * `icon` is a file under public/icons (without .svg).
 */

export interface Svc { label: string; icon?: string; }

export interface LxcDef extends Linkable {
  name: string;
  desc: string;
  icon: string;
  services: Svc[];
  /** Traffic paths this container sits on; [] = background support. */
  paths: PathKind[];
  state?: 'running' | 'stopped';
}

export interface AppDef extends Linkable {
  name: string;
  desc: string;
  /** Omit when there's no honest brand icon; a letter tile is drawn instead. */
  icon?: string;
  workloads: Svc[];
  paths: PathKind[];
  access?: Access;
}

export interface VmDef {
  name: string;
  desc: string;
  icons: string[];
  apps: AppDef[];
}

export interface HostInventory { lxcs: LxcDef[]; vm: VmDef; }

const both: PathKind[] = ['public', 'private'];
const pg: Svc = { label: 'PostgreSQL', icon: 'postgresql' };
const go = (label: string): Svc => ({ label, icon: 'golang' });

// ── LXC catalogue ────────────────────────────────────────────────────────────
const L = {
  cloudflared: (state?: 'stopped'): LxcDef => ({
    name: 'cloudflared', icon: 'cloudflare', paths: ['public'],
    desc: 'Dials the outbound Cloudflare Tunnel, so nothing needs to be exposed on the ISP router.',
    services: [{ label: 'Cloudflare Tunnel', icon: 'cloudflare' }], state }),
  traefik: (): LxcDef => ({
    name: 'traefik', icon: 'traefik', paths: both, serviceId: 'traefik', noLink: true,
    desc: 'Edge reverse proxy. Routes by hostname; config is pulled from Git.',
    services: [{ label: 'Traefik', icon: 'traefik' }, { label: 'OpenTelemetry Collector', icon: 'opentelemetry' }] }),
  adguard: (): LxcDef => ({
    name: 'adguard', icon: 'adguard-home', paths: ['private'],
    desc: 'DNS for the tailnet. Gives dev and QA hostnames a private answer.',
    services: [{ label: 'AdGuard Home', icon: 'adguard-home' }] }),
  gateway: (wireguard: boolean): LxcDef => ({
    name: 'gateway', icon: 'tailscale', paths: ['private'],
    desc: 'Tailscale subnet router and exit node, plus the firewall for the subnet.',
    services: [{ label: 'Tailscale', icon: 'tailscale' }, ...(wireguard ? [{ label: 'WireGuard', icon: 'wireguard' }] : [])] }),
  sso: (): LxcDef => ({
    name: 'sso', icon: 'authentik', paths: both, serviceId: 'authentik', noLink: true,
    desc: 'Single sign-on for every gated app. Traefik asks it before letting a request through.',
    services: [{ label: 'Authentik server', icon: 'authentik' }, { label: 'Authentik worker', icon: 'authentik' }, pg, { label: 'Redis', icon: 'redis' }] }),
  vault: (serviceId?: string): LxcDef => ({
    name: 'vault', icon: 'vault', paths: [], serviceId,
    desc: 'Secrets for this environment.',
    services: [{ label: 'HashiCorp Vault', icon: 'vault' }] }),
  monitoring: (serviceId?: string): LxcDef => ({
    name: 'monitoring', icon: 'grafana', paths: [], serviceId,
    desc: 'Metrics, logs, traces and profiles. Also runs the probes behind the status dots.',
    services: [
      { label: 'Grafana', icon: 'grafana' }, { label: 'Prometheus', icon: 'prometheus' },
      { label: 'Loki', icon: 'loki' }, { label: 'Tempo', icon: 'tempo' },
      { label: 'SigNoz', icon: 'signoz' }, { label: 'ClickHouse', icon: 'clickhouse' },
      { label: 'Pyroscope', icon: 'grafana' }, { label: 'OTel Collector', icon: 'opentelemetry' },
      { label: 'Blackbox exporter', icon: 'prometheus' }, { label: 'Node exporter', icon: 'prometheus' },
    ] }),
  semaphore: (serviceId?: string): LxcDef => ({
    name: 'semaphore', icon: 'semaphore', paths: [], serviceId,
    desc: 'Runs Ansible playbooks from a web UI.',
    services: [{ label: 'Semaphore', icon: 'semaphore' }, { label: 'Ansible', icon: 'ansible' }] }),
  rancher: (serviceId?: string, state?: 'stopped'): LxcDef => ({
    name: 'rancher', icon: 'rancher', paths: [], serviceId, state,
    desc: 'Kubernetes management UI for the k3s cluster.',
    services: [{ label: 'Rancher', icon: 'rancher' }] }),
  runner: (desc: string): LxcDef => ({
    name: 'github-runner', icon: 'github', paths: [],
    desc, services: [{ label: 'GitHub Actions runners', icon: 'github' }] }),
};

// ── App catalogue ────────────────────────────────────────────────────────────
const A = {
  opsPortal: (extra: Svc[] = [], dbs = 5): AppDef => ({
    name: 'Ops Portal', icon: 'databaes', paths: both, access: 'sso', serviceId: 'ops-portal',
    desc: 'The operations portal: a mesh of small Go services behind an Angular shell, each with its own database.',
    workloads: [
      { label: 'Shell', icon: 'angular' }, go('Identity'), go('CMDB'), go('Audit'), go('Infrastructure'),
      go('Incidents'), go('Deployments'), go('Domain'), ...extra, { label: `PostgreSQL ×${dbs}`, icon: 'postgresql' },
    ] }),
  tomajflix: (): AppDef => ({
    name: 'Tomaj Flix', icon: 'tomajflix', paths: both, serviceId: 'tomajflix',
    desc: 'Private streaming platform.',
    workloads: [go('Go API'), { label: 'SvelteKit UI', icon: 'svelte' }] }),
  media: (): AppDef => ({
    name: 'Media stack', icon: 'sonarr', paths: both, access: 'sso',
    desc: 'Automated TV and movie management and requests.',
    workloads: [{ label: 'Sonarr', icon: 'sonarr' }, { label: 'Radarr', icon: 'radarr' },
      { label: 'Prowlarr', icon: 'prowlarr' }, { label: 'Jellyseerr', icon: 'jellyseerr' }] }),
  nextcloud: (): AppDef => ({
    name: 'Nextcloud', icon: 'nextcloud', paths: both, serviceId: 'nextcloud',
    desc: 'File sync and sharing.', workloads: [{ label: 'Nextcloud', icon: 'nextcloud' }, pg] }),
  wiki: (): AppDef => ({
    name: 'Wiki.js', icon: 'wikijs', paths: both, serviceId: 'wikijs', access: 'sso',
    desc: 'Long-form knowledge base.', workloads: [{ label: 'Wiki.js', icon: 'wikijs' }, pg] }),
  directus: (): AppDef => ({
    name: 'Directus CMS', icon: 'directus', paths: both, serviceId: 'directus-cms',
    desc: 'Headless CMS behind the landing page copy.', workloads: [{ label: 'Directus', icon: 'directus' }, pg] }),
  investing: (): AppDef => ({
    name: 'Investing', icon: 'investing', paths: both, serviceId: 'investing', access: 'sso',
    desc: 'Trading 212 pie tracker driven by US politician trades.',
    workloads: [{ label: 'API' }, { label: 'Web' }, pg] }),
  chess: (): AppDef => ({
    name: 'My Chess Coach', icon: 'mcc', paths: both, serviceId: 'mcc', access: 'sso',
    desc: 'Openings, puzzles and game review.', workloads: [{ label: 'App' }, pg] }),
  wedding: (): AppDef => ({
    name: 'Wedding', icon: 'wedding', paths: both, serviceId: 'wedding',
    desc: 'Guest registration, meal and hotel choices.', workloads: [go('Go app'), pg] }),
  landing: (): AppDef => ({
    name: 'Landing page', icon: 'databaes', paths: both,
    desc: 'This site: Angular on nginx.', workloads: [{ label: 'nginx', icon: 'nginx' }, { label: 'Angular', icon: 'angular' }] }),
  signup: (): AppDef => ({
    name: 'Sign up', icon: 'databaes', paths: both, serviceId: 'signup',
    desc: 'Self-service account sign-up.', workloads: [{ label: 'nginx', icon: 'nginx' }] }),
  statusApi: (): AppDef => ({
    name: 'Status API', icon: 'golang', paths: both,
    desc: 'Polls service health for the page.', workloads: [go('Go service')] }),
  minecraft: (): AppDef => ({
    name: 'Minecraft', icon: 'minecraft', paths: ['private'], access: 'private',
    desc: 'Private Java Edition server. Tailnet-only: no public route and no hostname.',
    workloads: [{ label: 'Minecraft server', icon: 'minecraft' }] }),
  minecraftConsole: (): AppDef => ({
    name: 'Minecraft Console', icon: 'databaes', paths: both, serviceId: 'mc-console', access: 'sso',
    desc: 'Start, stop and configure the Minecraft servers.', workloads: [go('Go service')] }),
  telemetry: (): AppDef => ({
    name: 'Telemetry agents', icon: 'opentelemetry', paths: [],
    desc: 'One per node: collects metrics, traces and profiles.',
    workloads: [{ label: 'OTel Collector', icon: 'opentelemetry' }, { label: 'Beyla' }, { label: 'eBPF profiler', icon: 'alloy' }] }),
  arc: (): AppDef => ({
    name: 'CI runners (ARC)', icon: 'github', paths: [],
    desc: 'Ephemeral GitHub Actions runners that scale with the queue.',
    workloads: [{ label: 'Runner controller', icon: 'github' }] }),
};

const k3sVm = (name: string, desc: string, apps: AppDef[], gpu = false): VmDef => ({
  name, desc, icons: gpu ? ['k3s', 'nvidia'] : ['k3s'], apps });

export const INVENTORY: Record<string, HostInventory> = {
  betsy: {
    lxcs: [
      L.cloudflared(), L.traefik(), L.adguard(), L.gateway(true), L.sso(),
      L.vault('vault-prod'), L.monitoring('grafana'), L.semaphore('semaphore'), L.rancher('rancher'),
      L.runner('Self-hosted runners for deploys, one per repo.'),
      { name: 'pbs', icon: 'proxmox-backup-server', paths: [],
        desc: 'Proxmox Backup Server. Backs up every container and VM nightly.',
        services: [{ label: 'Proxmox Backup Server', icon: 'proxmox-backup-server' }] },
      { name: 'pi-hole', icon: 'pi-hole', paths: [],
        desc: 'Network-wide ad blocking for the home LAN.', services: [{ label: 'Pi-hole', icon: 'pi-hole' }] },
      { name: 'torrent', icon: 'qbittorrent', paths: ['public'], serviceId: 'qbittorrent',
        desc: 'Download client behind the media stack.', services: [{ label: 'qBittorrent', icon: 'qbittorrent' }] },
      { name: 'zigbee-iot', icon: 'zigbee2mqtt', paths: [],
        desc: 'Zigbee power monitoring over a USB dongle.',
        services: [{ label: 'Zigbee2MQTT', icon: 'zigbee2mqtt' }, { label: 'Mosquitto', icon: 'mosquitto' }, { label: 'Telegraf', icon: 'telegraf' }] },
    ],
    vm: k3sVm('worker-node-gpu-01',
      'Single-node k3s cluster with an NVIDIA GTX 970 passed through. Everything user-facing runs here.',
      [A.opsPortal(), A.tomajflix(), A.media(), A.nextcloud(), A.wiki(), A.directus(), A.investing(), A.chess(),
       A.wedding(), A.landing(), A.signup(), A.minecraft(), A.minecraftConsole(), A.telemetry(), A.arc()], true),
  },
  benedict: {
    lxcs: [
      L.cloudflared(), L.traefik(), L.adguard(), L.gateway(false), L.sso(), L.vault(), L.monitoring(), L.semaphore(),
      { name: 'bootstrap-vault', icon: 'vault', paths: [],
        desc: 'Root vault for the lab.', services: [{ label: 'HashiCorp Vault', icon: 'vault' }] },
      L.runner('Self-hosted runner for dev deploys.'),
      L.rancher(undefined, 'stopped'),
      { name: 'torrent', icon: 'qbittorrent', paths: [], state: 'stopped',
        desc: 'Download client (standby).', services: [{ label: 'qBittorrent', icon: 'qbittorrent' }] },
    ],
    vm: k3sVm('worker-node-01', 'Single-node k3s cluster for development builds.',
      [A.opsPortal([{ label: 'Updates', icon: 'golang' }, { label: 'NATS' }], 6), A.tomajflix(), A.media(), A.nextcloud(), A.wiki(),
       A.investing(), A.chess(), A.wedding(), A.landing(), A.statusApi(), A.signup(), A.telemetry(), A.arc()]),
  },
  heaton: {
    lxcs: [
      L.cloudflared(), L.traefik(), L.adguard(), L.gateway(false), L.sso(), L.vault(), L.monitoring(),
      L.runner('Self-hosted runner for QA deploys.'),
      L.rancher(undefined, 'stopped'),
    ],
    vm: k3sVm('worker-node-01', 'Single-node k3s cluster for QA.',
      [A.opsPortal([{ label: 'NATS' }], 6), A.tomajflix(), A.media(), A.wiki(), A.investing(), A.wedding(), A.landing(), A.telemetry(), A.arc()]),
  },
};

export function inventoryCounts(inv: HostInventory): { lxcs: number; apps: number } {
  return { lxcs: inv.lxcs.filter(l => l.state !== 'stopped').length, apps: inv.vm.apps.length };
}

/** Every icon key referenced by the inventory, for the spec. */
export function inventoryIcons(): string[] {
  const keys = new Set<string>();
  for (const inv of Object.values(INVENTORY)) {
    for (const l of inv.lxcs) { keys.add(l.icon); l.services.forEach(s => s.icon && keys.add(s.icon)); }
    inv.vm.icons.forEach(i => keys.add(i));
    for (const a of inv.vm.apps) { if (a.icon) keys.add(a.icon); a.workloads.forEach(s => s.icon && keys.add(s.icon)); }
  }
  return [...keys].sort();
}
