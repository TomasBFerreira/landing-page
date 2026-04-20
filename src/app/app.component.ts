import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { HealthCheckService } from './health-check.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <app-header />
    <main id="main-content" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  constructor(private health: HealthCheckService) {}

  ngOnInit(): void {
    this.health.init();
  }
}
