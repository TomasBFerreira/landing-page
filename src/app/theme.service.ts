import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';

/**
 * LP-F5 theme service.
 *
 * Source of truth for the data-theme attribute on <html>. Initial theme is
 * set by the inline bootstrap in index.html (before CSS loads so there's
 * no flash); this service just re-reads it, exposes a signal, and persists
 * future toggles to localStorage.
 *
 * Default is light. OS prefers-color-scheme is only honoured if the user
 * has never made an explicit choice.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.readCurrent());

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  set(t: Theme): void {
    this.theme.set(t);
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch (_) { /* storage disabled — just don't persist */ }
  }

  private readCurrent(): Theme {
    const attr = document.documentElement.getAttribute('data-theme');
    return attr === 'dark' ? 'dark' : 'light';
  }
}
