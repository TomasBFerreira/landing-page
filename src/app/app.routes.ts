import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    title: 'databaes.net — a homelab that fixes itself',
  },
  { path: '**', redirectTo: '' },
];
