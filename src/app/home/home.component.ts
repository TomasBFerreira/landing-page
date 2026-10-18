import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TopologyMapComponent } from '../topology/topology-map.component';
import { ServiceLauncherComponent } from '../launcher/service-launcher.component';
import { CmsService, HeroContent } from '../cms.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TopologyMapComponent, ServiceLauncherComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  /** Fallback hero — same copy as Directus ships. Served while the CMS
   *  fetch is in flight and if it fails (CORS, 5xx, network). */
  readonly hero = signal<HeroContent>({
    eyebrow:      'Homelab · Proxmox · k3s · Vault · Authentik',
    title_prefix: 'data',
    title_accent: 'baes',
    title_suffix: '.net',
    subline:      'A self-hosted homelab on bare-metal Proxmox: k3s workloads, Vault, Authentik SSO and a GitOps deploy pipeline. The map below is live.',
    badges: [],
    cta_label: "how it's integrated →",
    cta_route: '/showcase',
  });

  constructor(private cms: CmsService) {}

  ngOnInit(): void {
    this.cms.heroContent().subscribe(data => {
      if (data) this.hero.set(data);
    });
  }
}
