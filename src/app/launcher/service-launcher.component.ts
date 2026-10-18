import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthCheckService, ServiceState } from '../health-check.service';

interface LauncherGroup { label: string; items: ServiceState[]; }

/** Display grouping for prod tiles. Anything not listed falls into "More" so a new tile never vanishes. */
const GROUPS: { label: string; ids: string[] }[] = [
  { label: 'Apps',  ids: ['tomajflix', 'mcc', 'investing', 'wedding', 'nextcloud', 'signup'] },
  { label: 'Media', ids: ['seerr', 'sonarr', 'radarr', 'prowlarr', 'qbittorrent'] },
  { label: 'Tools', ids: ['ops-portal', 'wikijs', 'directus-cms', 'semaphore', 'mc-console'] },
];

/**
 * Compact launcher: names and a status dot. Liveliness is a secondary signal
 * here, summarised in one line, not the point of the page.
 */
@Component({
  selector: 'app-service-launcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-launcher.component.html',
  styleUrl: './service-launcher.component.scss',
})
export class ServiceLauncherComponent {
  constructor(private health: HealthCheckService) {}

  readonly groups = computed<LauncherGroup[]>(() => {
    const prod = this.health.states().filter(s => s.service.env === 'prod');
    const claimed = new Set(GROUPS.flatMap(g => g.ids));
    const groups = GROUPS.map(g => ({
      label: g.label,
      items: g.ids.map(id => prod.find(s => s.service.id === id)).filter((s): s is ServiceState => !!s),
    }));
    const rest = prod.filter(s => !claimed.has(s.service.id));
    if (rest.length) groups.push({ label: 'More', items: rest });
    return groups.filter(g => g.items.length);
  });

  /** Only services with a known probe result count; unprobed ones are neither up nor down. */
  readonly summary = computed(() => {
    const known = this.health.states().filter(s => s.status === 'up' || s.status === 'down');
    const up = known.filter(s => s.status === 'up').length;
    return { up, known: known.length, down: known.length - up };
  });
}
