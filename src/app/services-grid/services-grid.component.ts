import { Component }           from '@angular/core';
import { CommonModule }         from '@angular/common';
import { ServiceCardComponent } from '../service-card/service-card.component';
import { HealthCheckService }   from '../health-check.service';

@Component({
  selector: 'app-services-grid',
  standalone: true,
  imports: [CommonModule, ServiceCardComponent],
  templateUrl: './services-grid.component.html',
  styleUrl: './services-grid.component.scss',
})
export class ServicesGridComponent {
  constructor(private health: HealthCheckService) {}

  /** User-facing apps (prod env). Infrastructure is shown in the topology map. */
  apps() {
    return this.health.states().filter(s => s.service.env === 'prod');
  }
}
