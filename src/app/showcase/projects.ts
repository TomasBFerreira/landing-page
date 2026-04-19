export interface FlagshipProject {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  description: string;
  tech: string[];
  url?: { label: string; href: string };
  repo?: { label: string; href: string };
  highlights: string[];
}

export const FLAGSHIP_PROJECTS: FlagshipProject[] = [
  {
    id: 'ops-portal',
    name: 'Ops Portal',
    tagline: 'Control plane for the homelab',
    icon: '⚙️',
    description:
      'Unified dashboard for identity, CMDB, audit, incidents, infrastructure actions, deployments, and domain management. Eight Go microservices plus an Angular 18 shell, all behind Authentik SSO.',
    tech: ['Go', 'Angular 18', 'NATS', 'Authentik', 'k3s'],
    url: { label: 'ops.databaes.net', href: 'https://ops.databaes.net' },
    highlights: [
      'Eight microservices on a shared service template',
      'AI-assisted incident triage and remediation',
      'Real-time CMDB change + audit stream over NATS',
    ],
  },
  {
    id: 'tomaj-flix',
    name: 'Tomaj Flix',
    tagline: 'Self-hosted streaming platform',
    icon: '🎬',
    description:
      'Personal Netflix-style streaming surface over a self-hosted media library. Scans files, fetches TMDB metadata, streams to the browser with on-demand subtitle download from OpenSubtitles.',
    tech: ['Go', 'SvelteKit', 'FFmpeg', 'TMDB', 'OpenSubtitles'],
    url: { label: 'tomajflix-dev.databaes.net', href: 'https://tomajflix-dev.databaes.net' },
    highlights: [
      'Native HTML5 player with progressive transcode fallback',
      'On-demand subtitle search + inject into the player',
      'Torrent-streaming path for long-tail titles',
    ],
  },
  {
    id: 'wikijs',
    name: 'Wiki.js',
    tagline: 'Long-form knowledge base',
    icon: '📚',
    description:
      '~50-page operations wiki mirroring repo-side infra docs, runbooks, and per-service summaries. Deployed across dev, QA, and prod clusters and gated behind Authentik SSO.',
    tech: ['Node.js', 'PostgreSQL', 'Authentik'],
    url: { label: 'wikijs.databaes.net', href: 'https://wikijs.databaes.net' },
    highlights: [
      'Seeded from code-adjacent markdown',
      'OIDC group-scoped authoring',
      'Mirrored across dev / QA / prod',
    ],
  },
  {
    id: 'nextcloud',
    name: 'Nextcloud',
    tagline: 'File sync + collaboration',
    icon: '☁️',
    description:
      'Self-hosted replacement for Dropbox / Google Drive. Mobile and desktop sync clients, CalDAV + CardDAV, encrypted per-user shares. Behind Authentik SSO.',
    tech: ['PHP', 'PostgreSQL', 'Redis', 'Authentik'],
    highlights: [
      'Mobile + desktop sync over a single SSO session',
      'CalDAV and CardDAV endpoints for calendar + contacts',
      'Encrypted per-user share links',
    ],
  },
  {
    id: 'media-stack',
    name: 'Media Stack',
    tagline: 'Automated media acquisition',
    icon: '📡',
    description:
      'Sonarr, Radarr, Prowlarr, and Seerr working together to request, find, and land media. Feeds directly into the Tomaj Flix library for playback.',
    tech: ['Sonarr', 'Radarr', 'Prowlarr', 'Seerr'],
    highlights: [
      'Indexer federation via Prowlarr',
      'Request-driven acquisition via Seerr',
      'Writes straight into the Tomaj Flix library path',
    ],
  },
  {
    id: 'observability',
    name: 'Observability',
    tagline: 'Logs · metrics · traces',
    icon: '📊',
    description:
      'Full-stack observability on a dedicated compose LXC. Prometheus scraping, Loki log aggregation, Tempo traces, Grafana as the single frontend. OTel instrumentation across services.',
    tech: ['Prometheus', 'Loki', 'Tempo', 'Grafana', 'OpenTelemetry'],
    highlights: [
      'Unified Grafana frontend for every signal',
      'Per-service OTel instrumentation',
      'Alerting fans out to Slack + incidents service',
    ],
  },
];
