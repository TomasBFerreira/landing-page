import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

interface AdminSurface {
  name:    string;
  url:     string;
  purpose: string;
  /** Short glyph. Not an emoji — keeps the retro-terminal look. */
  glyph:   string;
}

interface ActivityChange {
  id:           number;
  title:        string;
  status:       string;
  risk:         string;
  change_type:  string;
  affected_cis: string[];
  created_at:   string;
  updated_at:   string;
}

interface ActivityIncident {
  id:           number;
  title:        string;
  severity:     string;
  status:       string;
  affected_cis: string[];
  tags:         string[];
  created_at:   string;
  updated_at:   string;
  resolved_at?: string | null;
}

interface ActivityResponse {
  generated_at:    string;
  recent_changes:  ActivityChange[];
  open_incidents:  ActivityIncident[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  /** Fixed list — these are the admin surfaces across the homelab.
   *  Intentionally static (not from CMS); a dashboard link list that
   *  reshapes every page reload would be weird. */
  readonly surfaces: AdminSurface[] = [
    { glyph: '✎', name: 'Directus CMS',      url: 'https://cms.databaes.net/admin',
      purpose: 'Edit landing-page copy — hero, about, showcase. Admin login in Vault at secret/databaes-directus/prod/credentials.' },
    { glyph: '☰', name: 'Ops Portal',        url: 'https://ops.databaes.net/',
      purpose: 'CMDB, incidents, changes, deployments, infrastructure actions. Auth via Authentik.' },
    { glyph: '▤', name: 'Wiki.js',           url: 'https://wiki.databaes.net/',
      purpose: 'Long-form docs, runbooks, per-service architecture pages. Auth via Authentik.' },
    { glyph: '◷', name: 'Grafana',           url: 'https://grafana.databaes.net/',
      purpose: 'Dashboards, alerts, logs. SLO views + AI-pipeline health.' },
    { glyph: '⬢', name: 'Rancher',           url: 'https://rancher-dev.databaes.net/',
      purpose: 'k3s cluster management. Deploys, namespaces, workloads.' },
    { glyph: '⛨', name: 'Authentik',         url: 'https://auth.databaes.net/if/admin/',
      purpose: 'Identity + SSO provider. Users, groups, applications.' },
  ];

  readonly activity        = signal<ActivityResponse | null>(null);
  readonly activityError   = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Snapshot baked at deploy, served same-origin (see
    // .github/workflows/deploy.yml → "Snapshot CMDB recent activity").
    this.http.get<ActivityResponse>('/recent-activity.json').subscribe({
      next: (r) => this.activity.set(r),
      error: (err: HttpErrorResponse) =>
        this.activityError.set(`recent-activity snapshot missing (HTTP ${err.status})`),
    });
  }

  /** Class hook for status chips on both changes and incidents. */
  statusClass(value: string): string {
    return 'status-chip status-chip--' + value.toLowerCase().replace(/[^a-z]/g, '-');
  }
}
