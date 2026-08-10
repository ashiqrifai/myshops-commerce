export type AttributeInputType =
  | "TEXT"
  | "NUMBER"
  | "BOOLEAN"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "COLOR_SWATCH"
  | "DATE"
  | "RICH_TEXT";

export type AttributeDataType =
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "DATE"
  | "JSON";

export interface AttributeOption {
  id: string;
  companyId: string;
  attributeId: string;
  label: string;
  value: string;
  swatchValue?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeCategorySummary {
  id: string;
  name: string;
  slug?: string | null;
  code?: string | null;
  parentId?: string | null;
  isActive?: boolean;
}

export interface CategoryAttributeAssignment {
  id: string;
  companyId: string;
  categoryId: string;
  attributeId: string;
  isRequired: boolean;
  isFilterable: boolean;
  isVariantDefining: boolean;
  displayOrder: number;
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: AttributeCategorySummary | null;
}

export interface AttributeUserSummary {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export interface Attribute {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description?: string | null;
  inputType: AttributeInputType;
  dataType: AttributeDataType;
  unit?: string | null;
  isVariantDefining: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  isComparable: boolean;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  options?: AttributeOption[];
  categoryAssignments?: CategoryAttributeAssignment[];
  createdByUser?: AttributeUserSummary | null;
  updatedByUser?: AttributeUserSummary | null;
}

export interface AttributeOptionFormValue {
  id?: string | null;
  clientId: string;
  label: string;
  value: string;
  swatchValue: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface CategoryAssignmentFormValue {
  id?: string | null;
  categoryId: string;
  isRequired: boolean;
  isFilterable: boolean;
  isVariantDefining: boolean;
  displayOrder: number;
  isActive: boolean;
}

export interface AttributeFormValues {
  name: string;
  code: string;
  description: string | null;
  inputType: AttributeInputType;
  dataType: AttributeDataType;
  unit: string | null;
  isVariantDefining: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  isComparable: boolean;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
  options: AttributeOptionFormValue[];
  categoryAssignments: CategoryAssignmentFormValue[];
}

export interface AttributePayload {
  name: string;
  code: string;
  description: string | null;
  inputType: AttributeInputType;
  dataType: AttributeDataType;
  unit: string | null;
  isVariantDefining: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  isComparable: boolean;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
  options: Array<{
    id?: string;
    label: string;
    value: string;
    swatchValue: string | null;
    displayOrder: number;
    isActive: boolean;
  }>;
  categoryAssignments: Array<{
    categoryId: string;
    isRequired: boolean;
    isFilterable: boolean;
    isVariantDefining: boolean;
    displayOrder: number;
    isActive: boolean;
  }>;
}

export interface AttributeListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  inputType?: AttributeInputType;
  dataType?: AttributeDataType;
  isVariantDefining?: boolean;
  isFilterable?: boolean;
  isActive?: boolean;
  categoryId?: string;
  sortBy?:
    | "name"
    | "code"
    | "inputType"
    | "dataType"
    | "displayOrder"
    | "isVariantDefining"
    | "isFilterable"
    | "isActive"
    | "createdAt"
    | "updatedAt";
  sortDirection?: "ASC" | "DESC";
}

export interface AttributeListResponse {
  success: boolean;
  data: Attribute[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface AttributeResponse {
  success: boolean;
  message?: string;
  data: Attribute;
}

export interface AttributeOptionResponse {
  success: boolean;
  message?: string;
  data: AttributeOption;
}

export interface DeleteAttributeResponse {
  success: boolean;
  message?: string;
  data: {
    id: string;
  };
}
