export type CustomerAddressType =
  | "HOME"
  | "OFFICE"
  | "APARTMENT"
  | "VILLA"
  | "WAREHOUSE"
  | "HOTEL"
  | "GIFT"
  | "OTHER";

export type CustomerAddressEmirate =
  | "ABU_DHABI"
  | "DUBAI"
  | "SHARJAH"
  | "AJMAN"
  | "UMM_AL_QUWAIN"
  | "RAS_AL_KHAIMAH"
  | "FUJAIRAH";

export interface CustomerAddressRecipient {
  firstName: string;
  lastName:
    | string
    | null;
  fullName: string;
  companyName:
    | string
    | null;
  mobile: string;
  email:
    | string
    | null;
}

export interface CustomerAddressLocation {
  countryCode: string;
  country: string;
  emirate:
    CustomerAddressEmirate;
  emirateDisplayName: string;
  city:
    | string
    | null;
  area: string;
  street: string;
  building: string;
  floor:
    | string
    | null;
  apartment:
    | string
    | null;
  villaNumber:
    | string
    | null;
  landmark:
    | string
    | null;
  postalCode:
    | string
    | null;
  latitude:
    | number
    | null;
  longitude:
    | number
    | null;
}

export interface CustomerAddress {
  id: string;
  companyId: string;
  customerId: string;
  addressType:
    CustomerAddressType;
  label: string;
  recipient:
    CustomerAddressRecipient;
  location:
    CustomerAddressLocation;
  deliveryInstructions:
    | string
    | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerAddressInput {
  addressType:
    CustomerAddressType;
  label: string;
  firstName: string;
  lastName?: string;
  companyName?: string;
  mobile: string;
  email?: string;
  countryCode: string;
  country: string;
  emirate:
    CustomerAddressEmirate;
  city?: string;
  area: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
  villaNumber?: string;
  landmark?: string;
  postalCode?: string;
  latitude?:
    | number
    | null;
  longitude?:
    | number
    | null;
  deliveryInstructions?: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export interface CustomerAddressFieldError {
  field: string;
  message: string;
}

export interface CustomerAddressApiErrorShape {
  code:
    | string
    | undefined;
  message: string;
  details:
    CustomerAddressFieldError[];
}
