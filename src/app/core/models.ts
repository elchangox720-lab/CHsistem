export type Role = 'admin' | 'vendedor' | 'inventario';
export type MovementType = 'entrada' | 'salida' | 'ajuste';
export type SaleStatus = 'pagada' | 'pendiente' | 'anulada';

export interface ProductSpec {
  label: string;
  value: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Client {
  _id: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  model?: string;
  specs?: ProductSpec[];
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicProduct {
  _id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  model?: string;
  price: number;
  specs: ProductSpec[];
  available: boolean;
}

export interface CatalogResponse {
  items: PublicProduct[];
  total: number;
  brands: string[];
  models: string[];
  categories: string[];
}

export interface StockMovement {
  _id: string;
  product: string | { _id: string; name: string; sku: string };
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  user?: string | { _id: string; name: string };
  createdAt: string;
}

export interface SaleItem {
  product: string | { _id: string; name: string; sku: string };
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  _id: string;
  invoiceNumber: string;
  client: string | Pick<Client, '_id' | 'name' | 'taxId' | 'email'>;
  items: SaleItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  status: SaleStatus;
  notes?: string;
  user?: string | { _id: string; name: string };
  createdAt: string;
  updatedAt?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface DashboardSummary {
  clients: number;
  products: number;
  lowStock: number;
  users: number;
  salesToday: { total: number; count: number };
  salesMonth: { total: number; count: number };
  recentSales: Sale[];
  lowStockProducts: Product[];
}

export interface ClientInput {
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  active: boolean;
}

export interface ProductInput {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  model?: string;
  specs?: ProductSpec[];
  price: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  active: boolean;
}

export interface UserInput {
  name: string;
  email: string;
  role: Role;
  password?: string;
  active: boolean;
}

export interface SaleInput {
  clientId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
  }>;
  taxRate: number;
  status: 'pagada' | 'pendiente';
  notes?: string;
}
