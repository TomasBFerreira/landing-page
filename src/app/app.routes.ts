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
    path: 'about',
    loadComponent: () => import('./about/about.component').then(m => m.AboutComponent),
    title: 'About · databaes.net',
  },
  { path: '**', redirectTo: '' },
];
