export type PriceListType =
  | "STANDARD"
  | "RETAIL"
  | "B2B"
  | "WHOLESALE"
  | "VIP"
  | "EMPLOYEE"
  | "PROMOTIONAL";

export type SortDirection =
  | "ASC"
  | "DESC";

export interface PriceListUser {
  id: string;

  firstName:
    string;

  lastName:
    string;

  email:
    string;
}

export interface PriceList {
  id: string;

  companyId:
    string;

  code:
    string;

  name:
    string;

  description:
    string | null;

  priceListType:
    PriceListType;

  channelCode:
    string;

  currencyCode:
    string;

  isTaxInclusive:
    boolean;

  priority:
    number;

  validFrom:
    string | null;

  validUntil:
    string | null;

  isDefault:
    boolean;

  isActive:
    boolean;

  createdBy:
    string | null;

  updatedBy:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;

  createdByUser?:
    PriceListUser | null;

  updatedByUser?:
    PriceListUser | null;
}

export interface PriceListFormValues {
  name:
    string;

  code?:
    string;

  description?:
    string | null;

  priceListType:
    PriceListType;

  channelCode:
    string;

  currencyCode:
    string;

  isTaxInclusive:
    boolean;

  priority:
    number;

  validFrom?:
    string | null;

  validUntil?:
    string | null;

  isDefault:
    boolean;

  isActive:
    boolean;
}

export interface PriceListListParams {
  page?:
    number;

  pageSize?:
    number;

  search?:
    string;

  priceListType?:
    PriceListType;

  channelCode?:
    string;

  currencyCode?:
    string;

  isActive?:
    boolean;

  isDefault?:
    boolean;

  sortBy?:
    | "name"
    | "code"
    | "priceListType"
    | "channelCode"
    | "currencyCode"
    | "priority"
    | "isDefault"
    | "isActive"
    | "validFrom"
    | "validUntil"
    | "createdAt"
    | "updatedAt";

  sortDirection?:
    SortDirection;
}

export interface Pagination {
  page:
    number;

  pageSize:
    number;

  totalItems:
    number;

  totalPages:
    number;
}

export interface PriceListListResponse {
  success:
    boolean;

  data:
    PriceList[];

  pagination:
    Pagination;
}

export interface PriceListResponse {
  success:
    boolean;

  message?:
    string;

  data:
    PriceList;
}

export interface DeletePriceListResponse {
  success:
    boolean;

  message:
    string;

  data: {
    id:
      string;
  };
}