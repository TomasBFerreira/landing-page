import { Component } from '@angular/core';
import { HeroComponent } from '../hero/hero.component';
import { InfraDiagramComponent } from '../infra-diagram/infra-diagram.component';
import { ServicesGridComponent } from '../services-grid/services-grid.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, InfraDiagramComponent, ServicesGridComponent],
  template: `
    <app-hero />
    <div class="home__inner">
      <app-infra-diagram />
      <app-services-grid />
    </div>
  `,
  styles: [`
    .home__inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px 80px;
    }
  `],
})
export class HomeComponent {}
