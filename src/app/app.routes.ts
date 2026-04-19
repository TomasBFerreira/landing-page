import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    title: 'databaes.net — homelab',
  },
  {
    path: 'showcase',
    loadComponent: () => import('./showcase/showcase.component').then(m => m.ShowcaseComponent),
    title: 'Showcase · databaes.net',
  },
  {
    path: 'ai',
    loadComponent: () => import('./ai/ai.component').then(m => m.AiComponent),
    title: 'AI incident resolver · databaes.net',
  },
  { path: '**', redirectTo: '' },
];
