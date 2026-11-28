import { Routes } from '@angular/router';
import { authGuard, guestGuard, landingGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing),
    canActivate: [landingGuard],
  },
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./pages/catalogo/catalogo').then((m) => m.Catalogo),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    canActivate: [guestGuard],
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'panel',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./pages/clients/clients').then((m) => m.Clients),
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./pages/products/products').then((m) => m.Products),
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('./pages/inventory/inventory').then((m) => m.Inventory),
      },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./pages/sales/sales').then((m) => m.Sales),
      },
      {
        path: 'ventas/nueva',
        loadComponent: () =>
          import('./pages/sale-new/sale-new').then((m) => m.SaleNew),
      },
      {
        path: 'web/contenido',
        loadComponent: () =>
          import('./pages/web-content/web-content').then((m) => m.WebContent),
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'web',
        loadComponent: () =>
          import('./pages/web/web').then((m) => m.Web),
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./pages/users/users').then((m) => m.Users),
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
