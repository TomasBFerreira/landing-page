import { Component, Input } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { ServiceState }     from '../health-check.service';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-card.component.html',
  styleUrl: './service-card.component.scss',
})
export class ServiceCardComponent {
  @Input({ required: true }) state!: ServiceState;

  get statusLabel(): string {
    switch (this.state.status) {
      case 'up':      return this.state.latency != null ? `${this.state.latency} ms` : 'online';
      case 'down':    return 'unreachable';
      case 'pending': return 'checking...';
      default:        return 'unknown';
    }
  }
}
