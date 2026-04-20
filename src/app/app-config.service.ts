import { Injectable } from '@angular/core';

interface AppConfig {
  /**
   * Legacy databaes-status-api base URL. Kept as a fallback: if Grafana is
   * unreachable we can still show dots sourced from status-api's polling.
   * Leave empty string to disable the fallback.
   */
  apiBaseUrl?: string;

  /**
   * Grafana root URL (e.g. https://grafana.databaes.net). Queried via
   * /api/datasources/proxy/uid/<prometheusDsUid>/api/v1/query to source
   * probe_success + probe_duration_seconds from the homelab blackbox job.
   */
  grafanaBaseUrl?: string;

  /** UID of the Prometheus datasource inside Grafana. Typically "prometheus". */
  prometheusDsUid?: string;

  /**
   * Read-only Grafana service account token (Viewer role, datasource-query
   * scope). Stored in Vault at secret/databaes-landing-page/grafana-reader-token,
   * injected into environment.json at deploy time.
   */
  grafanaToken?: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  apiBaseUrl       = '';
  grafanaBaseUrl   = '';
  prometheusDsUid  = 'prometheus';
  grafanaToken     = '';

  load(): Promise<void> {
    return fetch('/environment.json')
      .then(r => r.json() as Promise<AppConfig>)
      .then(cfg => {
        this.apiBaseUrl      = (cfg.apiBaseUrl      ?? '').replace(/\/$/, '');
        this.grafanaBaseUrl  = (cfg.grafanaBaseUrl  ?? '').replace(/\/$/, '');
        this.prometheusDsUid =  cfg.prometheusDsUid ?? 'prometheus';
        this.grafanaToken    =  cfg.grafanaToken    ?? '';
      })
      .catch(() => console.error('Failed to load /environment.json — health sources not configured'));
  }

  /** Grafana is usable iff base URL + datasource UID + token are all set. */
  get grafanaUsable(): boolean {
    return !!this.grafanaBaseUrl && !!this.prometheusDsUid && !!this.grafanaToken;
  }
}
