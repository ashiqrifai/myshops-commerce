export interface Supplier {
  id: string;
  companyId: string;
  code: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  websiteUrl: string | null;
  notes: string | null;
  isActive: boolean;
  sortOrder: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFormValues {
  name: string;
  code?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  websiteUrl?: string;
  notes?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface SupplierListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: "name" | "code" | "sortOrder" | "isActive" | "createdAt" | "updatedAt";
  sortDirection?: "ASC" | "DESC";
}

export interface SupplierPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SupplierListResponse {
  success: boolean;
  data: Supplier[];
  pagination: SupplierPagination;
}

export interface SupplierResponse {
  success: boolean;
  message?: string;
  data: Supplier;
}

export interface DeleteSupplierResponse {
  success: boolean;
  message?: string;
  data: { id: string };
}
