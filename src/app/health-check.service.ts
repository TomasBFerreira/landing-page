import { Injectable, signal } from '@angular/core';
import { ServiceDef, ServiceStatus } from './models/service.model';

export interface ServiceState {
  service: ServiceDef;
  status:  ServiceStatus;
  latency: number | null;
}

@Injectable({ providedIn: 'root' })
export class HealthCheckService {
  private readonly POLL_INTERVAL = 30_000;
  private readonly TIMEOUT_MS    = 5_000;

  readonly states = signal<ServiceState[]>([]);

  init(services: ServiceDef[]): void {
    const initial: ServiceState[] = services.map(s => ({
      service: s,
      status:  'pending',
      latency: null,
    }));
    this.states.set(initial);

    this.checkAll(services);
    setInterval(() => this.checkAll(services), this.POLL_INTERVAL);
  }

  private async checkAll(services: ServiceDef[]): Promise<void> {
    const results = await Promise.all(services.map(s => this.check(s)));
    this.states.set(results);
  }

  private async check(service: ServiceDef): Promise<ServiceState> {
    const start = performance.now();
    try {
      const ctrl = new AbortController();
      const tid   = setTimeout(() => ctrl.abort(), this.TIMEOUT_MS);

      await fetch(service.healthUrl, {
        method: 'HEAD',
        mode:   'no-cors',
        cache:  'no-store',
        signal: ctrl.signal,
      });
      clearTimeout(tid);

      return { service, status: 'up', latency: Math.round(performance.now() - start) };
    } catch {
      return { service, status: 'down', latency: null };
    }
  }
}
