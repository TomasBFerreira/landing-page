import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppConfigService } from '../app-config.service';

interface AccountAction {
  title: string;
  description: string;
  /** Absolute URL into Authentik's native flows. */
  href: string;
  cta: string;
  /** Inline SVG path data (24x24 viewBox). */
  icon: string;
}

/**
 * Self-service account hub. The homelab uses Authentik for identity, so this
 * page is a branded launcher that deep-links into Authentik's native
 * user-settings + recovery flows rather than reimplementing account management.
 * Authentik stays the single source of truth (it owns password policy, MFA,
 * sessions, recovery email). The auth base URL is runtime-configured per env.
 */
@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent {
  readonly actions: AccountAction[];

  constructor(config: AppConfigService) {
    const base = (config.authBaseUrl || 'https://auth.databaes.net').replace(/\/$/, '');
    this.actions = [
      {
        title: 'Profile & email',
        description: 'Update your display name and the email address tied to your account.',
        href: `${base}/if/user/#/settings`,
        cta: 'Edit profile',
        icon: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6Z',
      },
      {
        title: 'Change password',
        description: 'Set a new password while signed in. Takes effect immediately.',
        href: `${base}/if/user/#/settings;page=page-password`,
        cta: 'Change password',
        icon: 'M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm3 8H9V6a3 3 0 0 1 6 0v3Z',
      },
      {
        title: 'Reset a forgotten password',
        description: 'Locked out? Get a password-reset link sent to your email.',
        href: `${base}/if/flow/default-recovery-flow/`,
        cta: 'Reset via email',
        icon: 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1.4 2L12 12l7.6-5H4.4Z',
      },
      {
        title: 'Security',
        description: 'Two-factor authentication, registered devices, and active sessions.',
        href: `${base}/if/user/#/settings;page=page-mfa`,
        cta: 'Manage security',
        icon: 'M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Zm-1 13-3.5-3.5L9 10l2 2 4-4 1.5 1.5L11 15Z',
      },
    ];
  }
}
