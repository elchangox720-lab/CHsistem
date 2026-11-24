import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards';

export const routes: Routes = [
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
        path: '',
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
