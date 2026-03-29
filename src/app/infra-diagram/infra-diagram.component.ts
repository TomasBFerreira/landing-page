import { Component, computed, signal } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { HealthCheckService }  from '../health-check.service';
import { ServiceStatus }       from '../models/service.model';

type Env = 'prod' | 'qa' | 'dev';

@Component({
  selector: 'app-infra-diagram',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './infra-diagram.component.html',
  styleUrl: './infra-diagram.component.scss',
})
export class InfraDiagramComponent {
  activeEnv = signal<Env>('prod');

  constructor(private health: HealthCheckService) {}

  setEnv(env: Env) { this.activeEnv.set(env); }

  dispProd     = computed(() => (this.activeEnv() === 'prod' || this.activeEnv() === 'qa') ? null : 'none');
  dispProdOnly = computed(() => this.activeEnv() === 'prod' ? null : 'none');
  dispQa       = computed(() => this.activeEnv() === 'qa'   ? null : 'none');
  dispDev      = computed(() => this.activeEnv() === 'dev'  ? null : 'none');

  statusOf(id: string): ServiceStatus {
    return this.health.states().find(s => s.service.id === id)?.status ?? 'unknown';
  }

  dotClass(id: string): string {
    return `status-dot status-dot--${this.statusOf(id)}`;
  }
}
