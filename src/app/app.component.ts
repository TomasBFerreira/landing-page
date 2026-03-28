import { Component, OnInit } from '@angular/core';
import { HeaderComponent }      from './header/header.component';
import { InfraDiagramComponent } from './infra-diagram/infra-diagram.component';
import { ServicesGridComponent } from './services-grid/services-grid.component';
import { FooterComponent }       from './footer/footer.component';
import { HealthCheckService }    from './health-check.service';
import { SERVICES }              from './services.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, InfraDiagramComponent, ServicesGridComponent, FooterComponent],
  template: `
    <app-header />
    <main>
      <app-infra-diagram />
      <app-services-grid />
    </main>
    <app-footer />
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  constructor(private health: HealthCheckService) {}

  ngOnInit(): void {
    this.health.init(SERVICES);
  }
}
