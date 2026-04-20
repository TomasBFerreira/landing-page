import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ServiceDef, ServiceStatus } from './models/service.model';
import { SERVICES } from './services.config';
import { AppConfigService } from './app-config.service';

export interface ServiceState {
  service: ServiceDef;
  status:  ServiceStatus;
  latency: number | null;
}

/**
 * PromInstantResponse is the shape returned by the Prometheus HTTP API
 * instant-query endpoint, proxied through Grafana at
 *   /api/datasources/proxy/uid/<ds>/api/v1/query?query=...
 */
interface PromInstantResponse {
  status: 'success' | 'error';
  data: {
    resultType: 'vector' | 'matrix' | 'scalar' | 'string';
    result: Array<{
      metric: Record<string, string>;
      value: [number, string]; // [unix_ts, value-as-string]
    }>;
  };
}

/**
 * Legacy status-api shape. Kept as a fallback for the "apiBaseUrl" path when
 * Grafana is unreachable or not configured (prod → Grafana; dev env without
 * tailscale routing to monitoring → status-api poll).
 */
interface ServicesApiResponse {
  id:       string;
  status:   ServiceStatus;
  latency:  number | null;
}

@Injectable({ providedIn: 'root' })
export class HealthCheckService {
  private readonly POLL_INTERVAL_MS = 30_000;

  readonly states = signal<ServiceState[]>(this.pendingFromConfig());
  readonly sourceLabel = signal<'grafana' | 'status-api' | 'none'>('none');

  constructor(private http: HttpClient, private config: AppConfigService) {}

  init(): void {
    this.fetch();
    setInterval(() => this.fetch(), this.POLL_INTERVAL_MS);
  }

  /** Seed states from the static config so the UI has rows before the first poll lands. */
  private pendingFromConfig(): ServiceState[] {
    return SERVICES.map(s => ({ service: s, status: 'pending', latency: null }));
  }

  private fetch(): void {
    if (this.config.grafanaUsable) {
      this.fetchFromGrafana();
    } else if (this.config.apiBaseUrl) {
      this.fetchFromStatusApi();
    } else {
      // Nothing configured — leave states as pending.
      this.sourceLabel.set('none');
    }
  }

  // ── Grafana → Prometheus query path ────────────────────────────────────────

  private fetchFromGrafana(): void {
    const up  = this.promQuery('probe_success');
    const dur = this.promQuery('probe_duration_seconds{phase="transfer"}');

    Promise.all([up, dur])
      .then(([upResp, durResp]) => {
        this.states.set(this.reconcileGrafana(upResp, durResp));
        this.sourceLabel.set('grafana');
      })
      .catch(() => {
        // Preserve existing service list, mark everything unknown on failure.
        this.states.set(this.states().map(s => ({ ...s, status: 'unknown', latency: null })));
        this.sourceLabel.set('none');
      });
  }

  private promQuery(query: string): Promise<PromInstantResponse> {
    const url = `${this.config.grafanaBaseUrl}/api/datasources/proxy/uid/${this.config.prometheusDsUid}/api/v1/query?query=${encodeURIComponent(query)}`;
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.config.grafanaToken}` });
    return new Promise((resolve, reject) => {
      this.http.get<PromInstantResponse>(url, { headers }).subscribe({
        next: resolve,
        error: reject,
      });
    });
  }

  /**
   * Merges probe_success + probe_duration_seconds vectors (keyed by `instance`
   * label = the blackbox target URL) onto the static SERVICES list. URLs are
   * normalised by trailing-slash stripping; services with no probe row show
   * `unknown`.
   */
  private reconcileGrafana(up: PromInstantResponse, dur: PromInstantResponse): ServiceState[] {
    const norm = (u: string) => u.replace(/\/$/, '');
    const upByInstance  = new Map<string, number>();
    const durByInstance = new Map<string, number>();
    for (const r of up.data.result)  upByInstance.set(norm(r.metric['instance'] ?? ''),  Number(r.value[1]));
    for (const r of dur.data.result) durByInstance.set(norm(r.metric['instance'] ?? ''), Number(r.value[1]));

    return SERVICES.map(service => {
      const key = norm(service.url);
      const upVal  = upByInstance.get(key);
      const durVal = durByInstance.get(key);

      let status: ServiceStatus = 'unknown';
      if      (upVal === 1) status = 'up';
      else if (upVal === 0) status = 'down';

      const latency = durVal != null && isFinite(durVal) ? Math.round(durVal * 1000) : null;
      return { service, status, latency };
    });
  }

  // ── Legacy status-api fallback ─────────────────────────────────────────────

  private fetchFromStatusApi(): void {
    this.http.get<ServicesApiResponse[]>(`${this.config.apiBaseUrl}/api/status`).subscribe({
      next: (results) => {
        const byId = new Map(results.map(r => [r.id, r]));
        this.states.set(
          SERVICES.map(service => {
            const r = byId.get(service.id);
            return {
              service,
              status:  r?.status  ?? 'unknown',
              latency: r?.latency ?? null,
            };
          }),
        );
        this.sourceLabel.set('status-api');
      },
      error: () => {
        this.states.set(this.states().map(s => ({ ...s, status: 'unknown', latency: null })));
        this.sourceLabel.set('none');
      },
    });
  }
}
