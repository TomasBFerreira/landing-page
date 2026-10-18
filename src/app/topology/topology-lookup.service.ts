import { Injectable, computed } from '@angular/core';
import { HealthCheckService } from '../health-check.service';
import { SERVICES } from '../services.config';
import { ServiceStatus } from '../models/service.model';

export interface Linkable { serviceId?: string; /** Keep the status dot but don't offer an "Open" link. */ noLink?: boolean; }

/** Live status and link lookups shared by the map and the inspector. */
@Injectable({ providedIn: 'root' })
export class TopologyLookupService {
  private readonly statusById = computed(() =>
    new Map(this.health.states().map(s => [s.service.id, s.status] as [string, ServiceStatus])));

  private readonly urlById = new Map(SERVICES.map(s => [s.id, s.url] as [string, string]));

  constructor(private health: HealthCheckService) {}

  statusFor(item: Linkable): ServiceStatus | null {
    if (!item.serviceId) return null;
    return this.statusById().get(item.serviceId) ?? 'unknown';
  }

  urlFor(item: Linkable): string | null {
    return item.serviceId && !item.noLink ? this.urlById.get(item.serviceId) ?? null : null;
  }
}
