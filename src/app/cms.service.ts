import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { shareReplay, Observable, of, catchError, map } from 'rxjs';

/**
 * LP-F4 Phase 3: Directus consumer.
 *
 * Fetches the landing-page content collections from the public (anon-read)
 * Directus instance at cms.databaes.net. Each getter returns an Observable
 * that resolves once, is cached for the session, and falls back to `null`
 * on error so callers can keep their hard-coded defaults.
 *
 * The CMS is wired for CORS against the four landing-page origins (see
 * directus/manifests/base/app-deployment.yaml → CORS_ORIGIN). If the
 * request fails (CORS, 5xx, network), callers stay on their baked-in
 * content — the page never goes blank because the CMS is down.
 */

// ── Collection shapes (mirror directus/seed/schema.json) ─────────────────────

export interface HeroContent {
  eyebrow:      string;
  title_prefix: string;
  title_accent: string;
  title_suffix: string;
  subline:      string;
  badges:       Array<{ label: string }>;
  cta_label:    string;
  cta_route:    string;
}

export interface AboutIntro {
  title:          string;
  lede_primary:   string;
  lede_secondary: string;
}

export interface AboutProject {
  id:      number;
  sort:    number;
  name:    string;
  summary: string;
}

export type IntegrationKind = 'host' | 'read' | 'write';

export interface IntegrationPoint {
  id:      number;
  sort:    number;
  kind:    IntegrationKind;
  heading: string;
  body:    string;
}

export interface ShowcaseStep {
  id:      number;
  sort:    number;
  step_id: string;
  label:   string;
  detail:  string;
  gate?:   'human' | 'auto' | '' | null;
}

export interface ShowcaseChoice {
  id:      number;
  sort:    number;
  icon:    string;
  heading: string;
  body:    string;
}

// ── Service ──────────────────────────────────────────────────────────────────

interface CmsSingletonResponse<T> { data: T | null; }
interface CmsListResponse<T>      { data: T[]; }

@Injectable({ providedIn: 'root' })
export class CmsService {
  private readonly BASE_URL = 'https://cms.databaes.net';

  /** Emits the raw error string (if any) from the last fetch per collection.
   *  Useful for ops diagnostics but not displayed in the UI. */
  readonly lastError = signal<Record<string, string | null>>({});

  private cache = new Map<string, Observable<unknown>>();

  constructor(private http: HttpClient) {}

  heroContent():               Observable<HeroContent       | null> { return this.singleton('hero_content'); }
  aboutIntro():                Observable<AboutIntro        | null> { return this.singleton('about_intro'); }
  aboutProjects():             Observable<AboutProject[]    | null> { return this.list     ('about_projects'); }
  showcaseIntegrationPoints(): Observable<IntegrationPoint[]| null> { return this.list     ('showcase_integration_points'); }
  showcaseSteps():             Observable<ShowcaseStep[]    | null> { return this.list     ('showcase_steps'); }
  showcaseChoices():           Observable<ShowcaseChoice[]  | null> { return this.list     ('showcase_choices'); }

  private singleton<T>(collection: string): Observable<T | null> {
    const key = `s:${collection}`;
    let obs = this.cache.get(key) as Observable<T | null> | undefined;
    if (!obs) {
      obs = this.http.get<CmsSingletonResponse<T>>(`${this.BASE_URL}/items/${collection}`).pipe(
        map(r => r.data),
        catchError(err => this.onError(collection, err)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.cache.set(key, obs);
    }
    return obs;
  }

  private list<T>(collection: string): Observable<T[] | null> {
    const key = `l:${collection}`;
    let obs = this.cache.get(key) as Observable<T[] | null> | undefined;
    if (!obs) {
      obs = this.http.get<CmsListResponse<T>>(`${this.BASE_URL}/items/${collection}?sort=sort&limit=-1`).pipe(
        map(r => r.data),
        catchError(err => this.onError(collection, err)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.cache.set(key, obs);
    }
    return obs;
  }

  private onError(collection: string, err: unknown): Observable<null> {
    const msg = (err instanceof Error ? err.message : 'unknown') + '';
    this.lastError.update(m => ({ ...m, [collection]: msg }));
    return of(null);
  }
}
