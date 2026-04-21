import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CmsService, AboutIntro, AboutProject } from '../cms.service';

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
export class AboutComponent implements OnInit {
  /** Fallback intro — used if CMS is unreachable. Mirrors what Directus
   *  `about_intro` ships with, so the page reads the same either way. */
  readonly intro = signal<AboutIntro>({
    title:        'databaes.net',
    ledePrimaryHtml:   '',
    ledeSecondaryHtml: '',
  } as unknown as AboutIntro);

  readonly ledePrimaryHtml   = signal<string>(
    'A personal homelab run by ' +
    '<a href="https://github.com/TomasBFerreira" target="_blank" rel="noopener">Tomas Ferreira</a>. ' +
    'Bare-metal Proxmox underneath; a small k3s cluster on top for ' +
    'workloads; Authentik for identity, Vault for secrets, Traefik + ' +
    'Cloudflare for ingress (prod) and Tailscale for lower envs. Every ' +
    'deploy goes through GitHub Actions + blue/green worker slots.',
  );

  readonly ledeSecondaryHtml = signal<string>(
    'This page is deliberately short. The ' +
    '<a href="/showcase">showcase</a> has the AI-integration write-up; ' +
    'the wiki (behind SSO) has everything else — per-service ' +
    'architecture, runbooks, diagrams.',
  );

  readonly title = signal<string>('databaes.net');

  readonly projects = signal<RunningProject[]>([
    { name: 'Ops Portal',                      summary: 'Eight Go microservices (cmdb, audit, deployments, domain, identity, incidents, infrastructure, shell) behind an Angular admin UI. The control plane for the rest of the homelab.' },
    { name: 'Tomaj Flix (streambox)',          summary: 'Self-hosted streaming platform. Go backend scans a media library, pulls TMDB metadata, downloads subtitles on demand. SvelteKit frontend plays in the browser.' },
    { name: 'Wiki.js',                         summary: 'Operations wiki mirroring repo-side infra docs, runbooks, and per-service pages. Deployed across dev, QA, and prod clusters.' },
    { name: 'Media stack',                     summary: 'Sonarr, Radarr, Prowlarr, and Seerr working together to request, find, and land media. Feeds straight into the Tomaj Flix library.' },
    { name: 'Nextcloud',                       summary: 'Self-hosted file sync + CalDAV/CardDAV. Replaces the Dropbox / Google Drive slot in the stack.' },
    { name: 'Observability (otel-monitoring)', summary: 'Prometheus, Loki, Tempo, and Grafana on a central monitoring host. Every service emits OTel signals to the same place.' },
  ]);

  constructor(private cms: CmsService) {}

  ngOnInit(): void {
    this.cms.aboutIntro().subscribe(intro => {
      if (!intro) return;
      this.title.set(intro.title);
      this.ledePrimaryHtml.set(this.markdownLinksToHtml(intro.lede_primary));
      this.ledeSecondaryHtml.set(this.markdownLinksToHtml(intro.lede_secondary));
    });

    this.cms.aboutProjects().subscribe(rows => {
      if (!rows || rows.length === 0) return;
      this.projects.set(rows.map((r: AboutProject) => ({ name: r.name, summary: r.summary })));
    });
  }

  /** Converts [label](url) to <a href="url" …>label</a>. External URLs open
   *  in a new tab; same-origin routes stay in-page. Everything else in the
   *  string is passed through. Enough for the narrow CMS use-case here —
   *  we're not running a general markdown renderer. */
  private markdownLinksToHtml(s: string): string {
    if (!s) return '';
    const escaped = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, url: string) => {
      const external = /^https?:\/\//i.test(url);
      return external
        ? `<a href="${url}" target="_blank" rel="noopener">${label}</a>`
        : `<a href="${url}">${label}</a>`;
    });
  }
}
