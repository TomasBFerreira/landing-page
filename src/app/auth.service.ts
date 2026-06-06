import { Injectable, signal } from '@angular/core';
import { AppConfigService } from './app-config.service';

export type AuthStatus = 'unknown' | 'in' | 'out';

/**
 * Lightweight Authentik session detector for the (otherwise static) landing
 * page. The page itself is public — it is NOT behind forwardAuth — so there
 * are no identity headers to read. Instead we probe a path that IS gated by
 * Authentik forwardAuth and infer the session from the response:
 *
 *   - 200 / ok            → the cookie is valid, user is signed in
 *   - opaqueredirect/0    → forwardAuth bounced us to Authentik, signed out
 *
 * The Authentik cookie is scoped to `databaes.net` (forward_domain provider,
 * cookie_domain=databaes.net), so a same-origin probe sees the shared session
 * across every *.databaes.net surface. We reuse the gated `/investing/account`
 * path that databaes-investing already exposes on every env, which keeps this
 * change to the landing-page repo only — no Traefik / Authentik edits needed.
 * All three URLs are overridable via environment.json.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** 'unknown' until the first probe resolves; templates treat it as signed-out. */
  readonly status = signal<AuthStatus>('unknown');

  /** True only when an admin-gated probe confirms membership (fail-closed). */
  readonly isAdmin = signal<boolean>(false);

  constructor(private config: AppConfigService) {}

  /** Probe the gated endpoint once. Safe to call on app init. */
  check(): void {
    this.probe(this.config.authProbeUrl).then((ok) => {
      this.status.set(ok ? 'in' : 'out');
      // Only bother with the admin probe once we know there's a session, and
      // only if an admin-gated URL is configured. Otherwise admin stays hidden.
      if (ok && this.config.adminProbeUrl) {
        this.probe(this.config.adminProbeUrl).then((isAdmin) => this.isAdmin.set(isAdmin));
      } else {
        this.isAdmin.set(false);
      }
    });
  }

  /** Resolve true iff `url` answers 2xx (authenticated/authorised); a 3xx
   *  bounce to Authentik surfaces as opaqueredirect, a denial as a non-2xx. */
  private probe(url: string): Promise<boolean> {
    return fetch(url, {
      method: 'GET',
      redirect: 'manual',
      credentials: 'include',
      cache: 'no-store',
    })
      .then((res) => {
        if (res.type === 'opaqueredirect' || res.status === 0) return false;
        return res.ok;
      })
      .catch(() => false);
  }

  /** Full-page navigation into Authentik, returning here afterwards. */
  login(): void {
    const next = encodeURIComponent(window.location.href);
    window.location.href = this.config.loginUrl.replace('{next}', next);
  }

  /** Full-page navigation through Authentik's session invalidation flow. */
  logout(): void {
    const next = encodeURIComponent(window.location.origin + '/');
    window.location.href = this.config.logoutUrl.replace('{next}', next);
  }

  get signedIn(): boolean {
    return this.status() === 'in';
  }
}
