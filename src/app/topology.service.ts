import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

/**
 * TopologyNode mirrors ops-portal-cmdb's scrubbed public view of a CI
 * (see internal/httpapi/topology.go). The frontend never sees owner /
 * created_by / artifact_path / manifest_path.
 */
export interface TopologyNode {
  id:            number;
  name:          string;
  type:          'application' | 'service' | 'infrastructure' | 'network' | 'database' | string;
  tier:          '' | '0' | '0.5' | '1' | '2' | string;
  env:           'DEV' | 'QA' | 'STAGING' | 'PROD' | string;
  description?:  string;
  status?:       string;
  primary_node?: string;
  sso_enabled?:  boolean;
  archetype?:    string;
  tags?:         string[];
}

export interface TopologyResponse {
  env?:         string;
  generated_at: string;
  nodes:        TopologyNode[];
  tiers:        Record<string, number>;
}

/**
 * TopologyService loads the CMDB topology snapshot for the landing-page's
 * infra diagram (LP-F8). The snapshot is baked into the container at deploy
 * time from CMDB (see .github/workflows/deploy.yml → "Snapshot CMDB
 * topology into configmap"), then served by the landing-page's own nginx
 * at `/topology.json`. Same origin = no CORS, no auth, no browser token.
 *
 * Tradeoff vs hitting CMDB live from the browser: the diagram refreshes
 * only on landing-page redeploy. Acceptable — CIs don't change minute-to-
 * minute, and any sufficiently important change already goes through
 * GitOps which lands a new deploy anyway. Revisit if that stops being true.
 *
 * The snapshot carries ALL envs (deploy fetches with no filter); client
 * filters by active env.
 */
@Injectable({ providedIn: 'root' })
export class TopologyService {
  readonly nodes = signal<TopologyNode[]>([]);
  readonly loaded = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly generatedAt = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  load(_env?: string): void {
    this.http.get<TopologyResponse>('/topology.json').subscribe({
      next: (resp) => {
        this.nodes.set(resp.nodes ?? []);
        this.generatedAt.set(resp.generated_at ?? null);
        this.loaded.set(true);
        this.error.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.nodes.set([]);
        this.loaded.set(false);
        this.error.set(`topology snapshot missing (HTTP ${err.status})`);
      },
    });
  }
}
