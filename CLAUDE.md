# databaes-landing-page

> Shared conventions: `/app/.claude/rules/angular.md`, `/app/.claude/rules/kubernetes.md`. Workspace map: `/app/CLAUDE.md`.

Angular 18 landing / infrastructure-status page for `databaes.net`. Static nginx container on a k3s worker node, routed through Traefik. Pulls live service health from `databaes-status-api`.

## Stack

| Component | Image | Port | Purpose |
|-----------|-------|------|---------|
| nginx | `ghcr.io/tomasbferreira/databaes-landing-page` | 80 | Serves pre-built Angular static files |

## Storage

Stateless static site — no PVCs.

## Hostnames

| Env | Hostname |
|-----|---------|
| dev | `databaes-landing-page-dev.databaes.net` |
| prod | `databaes-landing-page.databaes.net` |

## Project quirks

- No application secrets. Repo secrets needed: `VAULT_BOOTSTRAP_ADDR`, `VAULT_BOOTSTRAP_ROOT_TOKEN`, `GH_PAT`. Vault paths used by the deploy pipeline:
  - `secret/worker-node/<env>/active-slot` (worker node IP)
  - `secret/ssh_keys/worker_node_worker` (SSH key into the worker)
  - `secret/databaes-landing-page/<env>/active-deployment` (decom detection — written by the pipeline)
- The `kustomize edit set image` call in the pipeline is transient — it does **not** modify committed files.
- To change resource limits, edit `manifests/base/deployment.yaml` and commit.
