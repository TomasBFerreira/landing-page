import { ServiceDef } from './models/service.model';

/**
 * Prod-only tiles. Every URL is a public *.databaes.net FQDN behind the
 * Cloudflare tunnel and is probed by otel-monitoring's blackbox job, so
 * `probe_success` drives the status chip. Dev/QA services intentionally
 * aren't listed — they're Tailscale-only and not landing-page surfaces.
 */
export const SERVICES: ServiceDef[] = [

  // ── Infrastructure ──────────────────────────────────────────────────────────
  {
    id: 'vault-prod',
    name: 'Vault',
    description: 'HashiCorp Vault HA — production secrets cluster',
    env: 'infra',
    url: 'https://vault.databaes.net',
    icon: '🔐',
    tags: ['ha', 'secrets'],
  },
  {
    id: 'authentik',
    name: 'Authentik',
    description: 'SSO identity provider, OIDC & LDAP — HA cluster',
    env: 'infra',
    url: 'https://auth.databaes.net',
    icon: '🪪',
    tags: ['ha', 'sso', 'oidc'],
  },
  {
    id: 'rancher',
    name: 'Rancher',
    description: 'Kubernetes cluster management for the k3s worker node',
    env: 'infra',
    url: 'https://rancher.databaes.net',
    icon: '☸',
    tags: ['k8s', 'k3s'],
  },
  {
    id: 'grafana',
    name: 'Grafana',
    description: 'Metrics, logs and dashboards — observability stack',
    env: 'infra',
    url: 'https://grafana.databaes.net',
    icon: '◷',
    tags: ['observability'],
  },
  {
    id: 'traefik',
    name: 'Traefik',
    description: 'Edge proxy + Authentik-gated dashboard on the network VM',
    env: 'infra',
    url: 'https://traefik.databaes.net',
    icon: '⇆',
    tags: ['edge', 'proxy'],
  },

  // ── Applications ────────────────────────────────────────────────────────────
  {
    id: 'ops-portal',
    name: 'Ops Portal',
    description: 'CMDB, incidents, changes, deployments, infrastructure actions',
    env: 'prod',
    url: 'https://ops.databaes.net',
    icon: '☰',
    tags: ['cmdb', 'ops'],
  },
  {
    id: 'wikijs',
    name: 'Wiki.js',
    description: 'Internal knowledge base — runbooks, architecture, docs',
    env: 'prod',
    url: 'https://wikijs.databaes.net',
    icon: '📖',
    tags: ['docs'],
  },
  {
    id: 'directus-cms',
    name: 'Directus CMS',
    description: 'Headless CMS backing the landing-page copy (hero, about, showcase)',
    env: 'prod',
    url: 'https://cms.databaes.net',
    icon: '✎',
    tags: ['cms', 'content'],
  },
  {
    id: 'nextcloud',
    name: 'Nextcloud',
    description: 'Self-hosted file storage & collaboration',
    env: 'prod',
    url: 'https://cloud.databaes.net',
    icon: '☁',
    tags: ['storage', 'files'],
  },
  {
    id: 'qbittorrent',
    name: 'qBittorrent',
    description: 'Torrent download client with web UI',
    env: 'prod',
    url: 'https://torrent.databaes.net',
    icon: '⬇',
    tags: ['download'],
  },
];
