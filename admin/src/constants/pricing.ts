import type {
    PriceListType,
  } from "@/types/priceList";
  
  import type {
    SelectFieldOption,
  } from "@/components/admin/forms";
  
  export const PRICE_LIST_TYPES: SelectFieldOption[] = [
    {
      value: "STANDARD",
      label: "Standard",
    },
    {
      value: "RETAIL",
      label: "Retail",
    },
    {
      value: "B2B",
      label: "B2B",
    },
    {
      value: "WHOLESALE",
      label: "Wholesale",
    },
    {
      value: "VIP",
      label: "VIP",
    },
    {
      value: "EMPLOYEE",
      label: "Employee",
    },
    {
      value: "PROMOTIONAL",
      label: "Promotional",
    },
  ];
  
  export const CHANNEL_OPTIONS: SelectFieldOption[] = [
    {
      value: "WEBSITE",
      label: "Website",
    },
    {
      value: "POS",
      label: "Point of Sale",
    },
    {
      value: "KIOSK",
      label: "Kiosk",
    },
    {
      value: "MOBILE_APP",
      label: "Mobile App",
    },
    {
      value: "MARKETPLACE",
      label: "Marketplace",
    },
  ];
  
  export const CURRENCY_OPTIONS: SelectFieldOption[] = [
    {
      value: "AED",
      label: "AED",
    },
    {
      value: "USD",
      label: "USD",
    },
    {
      value: "SAR",
      label: "SAR",
    },
    {
      value: "QAR",
      label: "QAR",
    },
    {
      value: "KWD",
      label: "KWD",
    },
    {
      value: "OMR",
      label: "OMR",
    },
    {
      value: "BHD",
      label: "BHD",
    },
  ];
  
  export const DEFAULT_PRICE_LIST_FORM = {
    code: "",
  
    name: "",
  
    description: "",
  
    priceListType:
      "STANDARD" as PriceListType,
  
    channelCode:
      "WEBSITE",
  
    currencyCode:
      "AED",
  
    priority: 1,
  
    validFrom: null,
  
    validUntil: null,
  
    isDefault: false,
  
    isActive: true,
  
    isTaxInclusive: false,
  };