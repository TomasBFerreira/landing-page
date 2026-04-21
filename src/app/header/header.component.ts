import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HealthCheckService } from '../health-check.service';
import { ThemeService }       from '../theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  currentTime = signal(new Date());

  upCount   = computed(() => this.health.states().filter(s => s.status === 'up').length);
  downCount = computed(() => this.health.states().filter(s => s.status === 'down').length);
  total     = computed(() => this.health.states().length);
  allUp     = computed(() => this.downCount() === 0 && this.total() > 0 && this.upCount() === this.total());

  constructor(private health: HealthCheckService, readonly theme: ThemeService) {}

  ngOnInit(): void {
    setInterval(() => this.currentTime.set(new Date()), 1000);
  }

  toggleTheme() { this.theme.toggle(); }
}
