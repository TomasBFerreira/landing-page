import { Injectable } from '@angular/core';

interface AppConfig {
  apiBaseUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  apiBaseUrl = '';

  load(): Promise<void> {
    return fetch('/environment.json')
      .then(r => r.json() as Promise<AppConfig>)
      .then(cfg => { this.apiBaseUrl = cfg.apiBaseUrl.replace(/\/$/, ''); })
      .catch(() => console.error('Failed to load /environment.json — API base URL not set'));
  }
}
