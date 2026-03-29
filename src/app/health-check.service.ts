import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ServiceDef, ServiceStatus } from './models/service.model';
import { environment } from '../environments/environment';

export interface ServiceState {
  service: ServiceDef;
  status:  ServiceStatus;
  latency: number | null;
}

interface StatusResponse {
  id:      string;
  status:  ServiceStatus;
  latency: number | null;
}

@Injectable({ providedIn: 'root' })
export class HealthCheckService {
  private readonly POLL_INTERVAL = 30_000;

  readonly states = signal<ServiceState[]>([]);

  constructor(private http: HttpClient) {}

  init(services: ServiceDef[]): void {
    const initial: ServiceState[] = services.map(s => ({
      service: s,
      status:  'pending',
      latency: null,
    }));
    this.states.set(initial);

    this.fetchStatus(services);
    setInterval(() => this.fetchStatus(services), this.POLL_INTERVAL);
  }

  private fetchStatus(services: ServiceDef[]): void {
    this.http.get<StatusResponse[]>(environment.statusApiUrl).subscribe({
      next: (results) => {
        const byId = new Map(results.map(r => [r.id, r]));
        this.states.set(
          services.map(s => {
            const r = byId.get(s.id);
            return {
              service: s,
              status:  r?.status ?? 'unknown',
              latency: r?.latency ?? null,
            };
          })
        );
      },
      error: () => {
        // Mark all as unknown if the status API itself is unreachable
        this.states.set(
          services.map(s => ({ service: s, status: 'unknown', latency: null }))
        );
      },
    });
  }
}
