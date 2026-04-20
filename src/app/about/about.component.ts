import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface RunningProject {
  name: string;
  summary: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  readonly projects: RunningProject[] = [
    {
      name: 'Ops Portal',
      summary: 'Eight Go microservices (cmdb, audit, deployments, domain, identity, incidents, infrastructure, shell) behind an Angular admin UI. The control plane for the rest of the homelab.',
    },
    {
      name: 'Tomaj Flix (streambox)',
      summary: 'Self-hosted streaming platform. Go backend scans a media library, pulls TMDB metadata, downloads subtitles on demand. SvelteKit frontend plays in the browser.',
    },
    {
      name: 'Wiki.js',
      summary: 'Operations wiki mirroring repo-side infra docs, runbooks, and per-service pages. Deployed across dev, QA, and prod clusters.',
    },
    {
      name: 'Media stack',
      summary: 'Sonarr, Radarr, Prowlarr, and Seerr working together to request, find, and land media. Feeds straight into the Tomaj Flix library.',
    },
    {
      name: 'Nextcloud',
      summary: 'Self-hosted file sync + CalDAV/CardDAV. Replaces the Dropbox / Google Drive slot in the stack.',
    },
    {
      name: 'Observability (otel-monitoring)',
      summary: 'Prometheus, Loki, Tempo, and Grafana on a central monitoring host. Every service emits OTel signals to the same place.',
    },
  ];
}
