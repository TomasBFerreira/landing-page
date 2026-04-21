import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InfraDiagramComponent } from '../infra-diagram/infra-diagram.component';
import { ServicesGridComponent } from '../services-grid/services-grid.component';
import { CmsService, HeroContent } from '../cms.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, InfraDiagramComponent, ServicesGridComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  /** Fallback hero — same copy as Directus ships. Served while the CMS
   *  fetch is in flight and if it fails (CORS, 5xx, network). */
  readonly hero = signal<HeroContent>({
    eyebrow:      '// homelab · proxmox · k3s · vault · authentik',
    title_prefix: 'data',
    title_accent: 'baes',
    title_suffix: '.net',
    subline:      'A self-hosted homelab running on bare-metal Proxmox — Kubernetes workloads on k3s, secrets in Vault, SSO via Authentik, a GitOps deploy pipeline, and a small AI integration in the incident path. Everything below is live.',
    badges: [
      { label: 'Proxmox VE'   },
      { label: 'k3s'          },
      { label: 'Rancher'      },
      { label: 'Vault HA'     },
      { label: 'Authentik SSO'},
      { label: 'Traefik'      },
      { label: 'Cloudflare'   },
    ],
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
