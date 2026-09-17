export interface InstagramMediaVariant {
    id:
      string;
  
    variantType:
      string;
  
    format?:
      string | null;
  
    mimeType?:
      string | null;
  
    width?:
      number | null;
  
    height?:
      number | null;
  
    publicUrl?:
      string | null;
  
    isPrimary?:
      boolean;
  }
  
  export interface InstagramMediaAsset {
    id:
      string;
  
    title?:
      string | null;
  
    originalFileName?:
      string;
  
    altText?:
      string | null;
  
    publicUrl?:
      string | null;
  
    previewPath?:
      string | null;
  
    thumbnailPath?:
      string | null;
  
    variants?:
      InstagramMediaVariant[];
  }
  
  export interface InstagramPost {
    id:
      string;
  
    companyId:
      string;
  
    mediaAssetId:
      string;
  
    instagramUrl:
      string;
  
    caption:
      string | null;
  
    altText:
      string | null;
  
    sortOrder:
      number;
  
    isActive:
      boolean;
  
    createdAt:
      string;
  
    updatedAt:
      string;
  
    mediaAsset?:
      InstagramMediaAsset | null;
  }
  
  export interface InstagramPostFormValues {
    mediaAssetId:
      string | null;
  
    instagramUrl:
      string;
  
    caption:
      string | null;
  
    altText:
      string | null;
  
    sortOrder:
      number;
  
    isActive:
      boolean;
  }
  
  export interface InstagramPostListParams {
    page?:
      number;
  
    pageSize?:
      number;
  
    search?:
      string;
  
    isActive?:
      boolean;
  
    sortBy?:
      | "sortOrder"
      | "isActive"
      | "createdAt"
      | "updatedAt";
  
    sortDirection?:
      | "ASC"
      | "DESC";
  }
  
  export interface InstagramPostPagination {
    page:
      number;
  
    pageSize:
      number;
  
    totalItems:
      number;
  
    totalPages:
      number;
  }
  
  export interface InstagramPostListResponse {
    success:
      boolean;
  
    data:
      InstagramPost[];
  
    pagination:
      InstagramPostPagination;
  }
  
  export interface InstagramPostResponse {
    success:
      boolean;
  
    message?:
      string;
  
    data:
      InstagramPost;
  }
  
  export interface DeleteInstagramPostResponse {
    success:
      boolean;
  
    message:
      string;
  
    data: {
      id:
        string;
    };
  }