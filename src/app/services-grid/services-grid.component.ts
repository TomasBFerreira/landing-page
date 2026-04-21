import { Component }          from '@angular/core';
import { CommonModule }        from '@angular/common';
import { ServiceCardComponent } from '../service-card/service-card.component';
import { HealthCheckService }   from '../health-check.service';
import { ServiceEnv }           from '../models/service.model';

interface EnvGroup {
  env:      ServiceEnv;
  label:    string;
  sublabel: string;
  ipHint:   string;
}

@Component({
  selector: 'app-services-grid',
  standalone: true,
  imports: [CommonModule, ServiceCardComponent],
  templateUrl: './services-grid.component.html',
  styleUrl: './services-grid.component.scss',
})
export class ServicesGridComponent {
  readonly groups: EnvGroup[] = [
    { env: 'infra', label: 'Infrastructure', sublabel: 'Shared platform services', ipHint: '' },
    { env: 'prod',  label: 'Applications',   sublabel: 'User-facing prod services', ipHint: '' },
  ];

  constructor(private health: HealthCheckService) {}

  statesFor(env: ServiceEnv) {
    return this.health.states().filter(s => s.service.env === env);
  }

  upCount(env: ServiceEnv) {
    return this.statesFor(env).filter(s => s.status === 'up').length;
  }
}
