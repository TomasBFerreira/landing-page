# Landing Page — Backlog

**Last updated:** 2026-04-21

## Features

| ID    | Title                                      | Status      | Notes |
|-------|--------------------------------------------|-------------|-------|
| LP-F1 | Showcase page for flagship projects        | superseded  | Merged (#2) then reverted (#6) — Tomas chose to foreground AI integration instead of a grid of every project. `/showcase` now hosts LP-F2's AI integration story. |
| LP-F2 | AI integration showcase                    | done        | `/showcase` reframed around host/read/write surface area + "shape of the integration" pipeline + "design decisions, not slogans". |
| LP-F3 | About page — Tomas Ferreira origin story   | done        | `/about` with a grounded "What runs here" card grid + stack summary. Fabricated timeline + principles from an early draft were removed (#12). |
| LP-F4 | CMS for databaes.net content management    | done        | Directus live at `cms.databaes.net` (phase 1 #18 + fixes #19/#20/#21), 6 collections seeded and public-read (phase 2 #22), Angular consumes via `CmsService` with hard-coded fallback (phase 3 #23). Admin at `secret/databaes-directus/prod/credentials` in Vault. Optional follow-up: Authentik OIDC for admin login. |
| LP-F5 | Professional redesign                      | done        | Light-default theme with dark high-contrast toggle + cleaner-SaaS proportions while preserving retro console hints (mono labels, `//` section markers, scanline, orange accent, terminal grid in hero). Sun/moon toggle in the header. Persists to localStorage. `[data-theme]` bootstrap in index.html prevents flash on first paint. Two palettes + shared tint-channel CSS vars so component SCSS doesn't hard-code per-theme colours. Landing-page #27. |
| LP-F6 | Blind / low-vision accessibility improvements | done (primary pass) | WCAG AA contrast bumps (#5, #7, #8) + ARIA + live regions + focus ring + skip-link + prefers-reduced-motion (#11). Follow-ups: axe / Lighthouse sweep; SVG-internal a11y (deferred to LP-F8). |
| LP-F7 | Grafana-backed status page                 | done        | Browser → Grafana `/api/datasources/proxy/uid/prometheus/api/v1/query` path shipped prod 2026-04-20. Blackbox targets expanded (otel-monitoring #8), Traefik CORS middleware (traefik-gitops #30), read-only Grafana SA + token in Vault, landing-page rewrite (#13). Dev retains status-api fallback until monitoring-LXC Tailscale routing lands. |
| LP-F8 | Dynamic infrastructure diagrams            | done        | CMDB-driven tier grid (#15) replaces the hand-carved SVG. Endpoint in `ops-portal-cmdb` #8; snapshot baked at deploy time and served same-origin at `/topology.json`. CMDB change #417. Live-fetch path (traefik-gitops #31/#32/#33) didn't work due to an Authentik-outpost routing mystery — tracked as CMDB incident #356 for later. |
| LP-F9 | databaes.net admin console                 | done (MVP)  | `/admin` route with a surfaces grid (Directus, Ops Portal, Wiki.js, Grafana, Rancher, Authentik) + snapshot feed of recent CMDB changes + open incidents from `/api/cmdb/recent-activity` (ops-portal-cmdb #9). Deploy-baked same-origin JSON, landing-page #25. Phase-2 follow-ups: Directus→CMDB webhook on CMS edits; Traefik forwardAuth on `/admin` if we want it private. |

## Operational follow-ups (not features)

- Five blackbox probes currently return `probe_success=0` on prod and will show as **down** on the landing page: `wiki.databaes.net`, `nextcloud.databaes.net`, `ops-portal.databaes.net`, `traefik.databaes.net`, `databaes-status-api.databaes.net`. Some may be legit outages / some prod-routing gaps. Sanity-check one by one before assuming the new red dots are false positives.
- **CMDB incident #354** (dev runner drops): resolved 2026-04-20 via aggressive TCP keepalive tune + LXC reboot. First full post-fix deploy on the dev runner completed clean. Watch for recurrence over the next few days.
- **CMDB change #416** (draft): stale Cloudflare DNS for lower-env `*-dev.databaes.net` hostnames — resolve to CF edge but tunnel doesn't publish, so every public hit → 502. Either publish in the tunnel, move to an internal subzone, or delete.
- **CMDB incident #356** (open, info): Traefik routers on `ops.databaes.net` with explicit `priority: 1000` + `Path()` still get bypassed by Authentik's proxy outpost. LP-F8 worked around it via a deploy-time snapshot; investigate when an engineer has time to tcpdump the request path inside the network-vm.
