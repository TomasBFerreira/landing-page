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

  /**
   * Authentik base URL for the self-service account hub (/account), e.g.
   * https://auth.databaes.net (prod) or https://auth-dev.databaes.net (dev).
   * The hub deep-links into Authentik's native user-settings + recovery flows.
   * Defaults to the prod Authentik if unset.
   */
  authBaseUrl?: string;

  /**
   * Same-origin path gated by Authentik forwardAuth, probed to detect whether
   * the visitor is signed in (see AuthService). Defaults to the gated
   * `/investing/account` route that exists on every env.
   */
  authProbeUrl?: string;

  /**
   * Where the nav "Login" button sends the user. `{next}` is replaced with the
   * URL-encoded current location so Authentik returns here after sign-in.
   */
  loginUrl?: string;

  /** Authentik sign-out URL. `{next}` is replaced with the encoded origin. */
  logoutUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  apiBaseUrl       = '';
  grafanaBaseUrl   = '';
  prometheusDsUid  = 'prometheus';
  grafanaToken     = '';
  authBaseUrl      = 'https://auth.databaes.net';
  authProbeUrl     = '/investing/account';
  loginUrl         = '/investing/account?next={next}';
  logoutUrl        = 'https://auth.databaes.net/if/flow/default-invalidation-flow/?next={next}';

  load(): Promise<void> {
    return fetch('/environment.json')
      .then(r => r.json() as Promise<AppConfig>)
      .then(cfg => {
        this.apiBaseUrl      = (cfg.apiBaseUrl      ?? '').replace(/\/$/, '');
        this.grafanaBaseUrl  = (cfg.grafanaBaseUrl  ?? '').replace(/\/$/, '');
        this.prometheusDsUid =  cfg.prometheusDsUid ?? 'prometheus';
        this.grafanaToken    =  cfg.grafanaToken    ?? '';
        this.authBaseUrl     = (cfg.authBaseUrl     ?? 'https://auth.databaes.net').replace(/\/$/, '');
        this.authProbeUrl    =  cfg.authProbeUrl    ?? '/investing/account';
        this.loginUrl        =  cfg.loginUrl        ?? '/investing/account?next={next}';
        this.logoutUrl       =  cfg.logoutUrl       ?? `${this.authBaseUrl}/if/flow/default-invalidation-flow/?next={next}`;
      })
      .catch(() => console.error('Failed to load /environment.json — health sources not configured'));
  }

  /** Grafana is usable iff base URL + datasource UID + token are all set. */
  get grafanaUsable(): boolean {
    return !!this.grafanaBaseUrl && !!this.prometheusDsUid && !!this.grafanaToken;
  }
}
