import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ServiceDef, ServiceStatus } from './models/service.model';
import { AppConfigService } from './app-config.service';

export interface ServiceState {
  service: ServiceDef;
  status:  ServiceStatus;
  latency: number | null;
}

interface ServiceResponse {
  id:          string;
  name:        string;
  description: string;
  env:         string;
  url:         string;
  icon:        string;
  tags:        string[];
  status:      ServiceStatus;
  latency:     number | null;
}

@Injectable({ providedIn: 'root' })
export class HealthCheckService {
  private readonly POLL_INTERVAL = 30_000;

  readonly states = signal<ServiceState[]>([]);

  constructor(private http: HttpClient, private config: AppConfigService) {}

  init(): void {
    this.fetchServices();
    setInterval(() => this.fetchServices(), this.POLL_INTERVAL);
  }

  private fetchServices(): void {
    this.http.get<ServiceResponse[]>(`${this.config.apiBaseUrl}/api/services`).subscribe({
      next: (results) => {
        this.states.set(
          results.map(r => ({
            service: {
              id:          r.id,
              name:        r.name,
              description: r.description,
              env:         r.env as ServiceDef['env'],
              url:         r.url,
              icon:        r.icon,
              tags:        r.tags,
            },
            status:  r.status,
            latency: r.latency,
          }))
        );
      },
      error: () => {
        // Preserve existing service definitions but mark all as unknown.
        this.states.set(
          this.states().map(s => ({ ...s, status: 'unknown', latency: null }))
        );
      },
    });
  }
}
