export interface PublicCollectionMediaVariant {
    id: string;
  
    variantType:
      string;
  
    format:
      string | null;
  
    mimeType:
      string | null;
  
    width:
      number | null;
  
    height:
      number | null;
  
    isPrimary:
      boolean;
  
    publicUrl:
      string | null;
  }
  
  export interface PublicCollectionMedia {
    id:
      string;
  
    title:
      string | null;
  
    altText:
      string | null;
  
    caption:
      string | null;
  
    assetType:
      string;
  
    classification:
      string;
  
    mimeType:
      string | null;
  
    width:
      number | null;
  
    height:
      number | null;
  
    orientation:
      string | null;
  
    dominantColor:
      string | null;
  
    publicUrl:
      string | null;
  
    thumbnailUrl:
      string | null;
  
    previewUrl:
      string | null;
  
    variants:
      PublicCollectionMediaVariant[];
  }
  
  export interface PublicCollectionPrice {
    id:
      string;
  
    priceListId:
      string;
  
    currencyCode:
      string;
  
    isTaxInclusive:
      boolean;
  
    sellingPrice:
      number | null;
  
    regularPrice:
      number | null;
  
    compareAtPrice:
      number | null;
  }
  
  export interface PublicCollectionProduct {
    id:
      string;
  
    name:
      string;
  
    slug:
      string;
  
    productType:
      string;
  
    parentSku:
      string | null;
  
    shortDescription:
      string | null;
  
    isFeatured:
      boolean;
  
    taxPercent:
      number;
  
    brand:
      | {
          id:
            string;
  
          name:
            string;
  
          slug:
            string | null;
        }
      | null;
  
    primaryCategory:
      | {
          id:
            string;
  
          name:
            string;
  
          slug:
            string | null;
        }
      | null;
  
    image:
      | {
          id:
            string;
  
          imageRole:
            string;
  
          altText:
            string | null;
  
          title:
            string | null;
  
          mediaAsset:
            PublicCollectionMedia | null;
        }
      | null;
  
    defaultVariant:
      | {
          id:
            string;
  
          sku:
            string;
  
          barcode:
            string | null;
  
          name:
            string;
  
          isDefault:
            boolean;
        }
      | null;
  
    price:
      PublicCollectionPrice | null;
  
    productUrl:
      string;
  
    collectionOrder:
      number;
  }
  
  export interface PublicCollection {
    id:
      string;
  
    name:
      string;
  
    slug:
      string;
  
    description:
      string | null;
  
    shortDescription:
      string | null;
  
    collectionType:
      "MANUAL" | "SMART";
  
    isFeatured:
      boolean;
  
    showProductCount:
      boolean;
  
    thumbnailAsset:
      PublicCollectionMedia | null;
  
    bannerAsset:
      PublicCollectionMedia | null;
  
    mobileBannerAsset:
      PublicCollectionMedia | null;
  
    image:
      PublicCollectionMedia | null;
  
    metaTitle:
      string | null;
  
    metaDescription:
      string | null;
  
    metaKeywords:
      string | null;
  
    canonicalUrl:
      string | null;
  
    robotsIndex:
      boolean;
  
    robotsFollow:
      boolean;
  }
  
  export interface PublicCollectionFilter {
    code:
      string;
  
    label:
      string;
  
    type:
      string;
  
    minimum?:
      number | null;
  
    maximum?:
      number | null;
  
    currencyCode?:
      string;
  
    options?: Array<{
      id:
        string;
  
      label:
        string;
  
      slug?:
        string | null;
  
      count:
        number;
    }>;
  }
  
  export interface PublicCollectionData {
    company: {
      id:
        string;
  
      name:
        string;
  
      code:
        string;
  
      currency:
        string;
    };
  
    collection:
      PublicCollection;
  
    breadcrumbs: Array<{
      label:
        string;
  
      url:
        string;
    }>;
  
    products:
      PublicCollectionProduct[];
  
    filters:
      PublicCollectionFilter[];
  
    sortOptions: Array<{
      value:
        string;
  
      label:
        string;
    }>;
  
    pagination: {
      page:
        number;
  
      pageSize:
        number;
  
      totalItems:
        number;
  
      totalPages:
        number;
  
      hasPreviousPage:
        boolean;
  
      hasNextPage:
        boolean;
    };
  
    appliedFilters: {
      search:
        string | null;
  
      brandIds:
        string[];
  
      minPrice:
        number | null;
  
      maxPrice:
        number | null;
  
      sort:
        string;
    };
  
    resolvedPriceList:
      | {
          id:
            string;
  
          code:
            string;
  
          name:
            string;
  
          currencyCode:
            string;
  
          isTaxInclusive:
            boolean;
        }
      | null;
  
    meta: {
      channel:
        string;
  
      generatedAt:
        string;
    };
  }
  
  export interface PublicCollectionResponse {
    success:
      boolean;
  
    data:
      PublicCollectionData;
  }