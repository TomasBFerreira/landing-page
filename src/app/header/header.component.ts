import { Component, computed, OnInit } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HealthCheckService } from '../health-check.service';
import { ThemeService }       from '../theme.service';
import { AuthService }        from '../auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  downCount = computed(() => this.health.states().filter(s => s.status === 'down').length);
  total     = computed(() => this.health.states().length);
  allUp     = computed(() => this.downCount() === 0 && this.total() > 0
    && this.health.states().filter(s => s.status === 'up').length === this.total());

  constructor(
    private health: HealthCheckService,
    readonly theme: ThemeService,
    readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.auth.check();
  }

  toggleTheme() { this.theme.toggle(); }
  login()       { this.auth.login(); }
  logout()      { this.auth.logout(); }
}
