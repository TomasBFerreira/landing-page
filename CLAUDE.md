# databaes-landing-page

Angular 18 landing / infrastructure-status page for `databaes.net`. Deployed as a static nginx container on a k3s worker node, routed through Traefik.

---

## Stack

| Component | Image | Port | Purpose |
|-----------|-------|------|---------|
| nginx | `ghcr.io/tomasbferreira/databaes-landing-page` | 80 | Serves pre-built Angular static files |

---

## Deployment

The pipeline builds the Docker image, pushes it to GHCR, then deploys to the target k3s worker node via SSH + kubectl.

| Trigger | Target env |
|---------|-----------|
| Push to `main` | dev |
| `workflow_dispatch` → env=dev | dev |
| `workflow_dispatch` → env=prod | prod |

**How to trigger manually:**
```bash
gh workflow run deploy.yml --repo TomasBFerreira/databaes-landing-page \
  --field env=dev
```

**First-time setup — register the GitHub Actions runner before the first deploy:**
```bash
gh workflow run register-runner.yml \
  --repo TomasBFerreira/infra-platform \
  --field repo=TomasBFerreira/databaes-landing-page \
  --field env=dev
```

---

## Storage

This is a stateless static site — **no PVCs required**.

---

## Secrets

No application secrets. The pipeline reads infrastructure secrets from bootstrap Vault:

| Vault path | Field | Used for |
|------------|-------|---------|
| `secret/worker-node/<env>/active-slot` | `ip` | Resolve worker node IP |
| `secret/ssh_keys/worker_node_worker` | `private_key` | SSH into worker node |
| `secret/databaes-landing-page/<env>/active-deployment` | `worker_node_ip` | Decom detection (written by pipeline) |

**Required repo secrets:**

| Secret | Value |
|--------|-------|
| `VAULT_BOOTSTRAP_ADDR` | `http://192.168.50.200:8200` |
| `VAULT_BOOTSTRAP_ROOT_TOKEN` | Bootstrap Vault root token |
| `GH_PAT` | GitHub PAT with `repo` scope (for pushing to traefik-gitops) |

**To set them:**
```bash
ROOT_TOKEN=$(ssh root@192.168.50.4 "pct exec 200 -- python3 -c \"import json; print(json.load(open('/root/vault-init.json'))['root_token'])\"")
echo "$ROOT_TOKEN" | gh secret set VAULT_BOOTSTRAP_ROOT_TOKEN --repo TomasBFerreira/databaes-landing-page
gh secret set VAULT_BOOTSTRAP_ADDR --body "http://192.168.50.200:8200" --repo TomasBFerreira/databaes-landing-page
gh auth token | gh secret set GH_PAT --repo TomasBFerreira/databaes-landing-page
```

---

## Traefik routing

Routes are declared in `TomasBFerreira/traefik-gitops`. This repo does not manage DNS or ingress directly — the `register-dns` job in `deploy.yml` upserts the route into `traefik-gitops/config/dynamic/services.yml` and pushes, which triggers Traefik hot-reload and Cloudflare DNS sync automatically.

| Env | Hostname |
|-----|---------|
| dev | `databaes-landing-page-dev.databaes.net` |
| prod | `databaes-landing-page.databaes.net` |

---

## Rules

- **Never commit secrets** — all credentials live in Vault or GitHub repo secrets
- `manifests/` is the source of truth for Kubernetes resources
- The `kustomize edit set image` call in the pipeline is transient — it does **not** modify committed files
- To change resource limits, edit `manifests/base/deployment.yaml` and commit
