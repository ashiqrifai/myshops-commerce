export type MediaAssetType =
  | "IMAGE"
  | "VIDEO"
  | "AUDIO"
  | "PDF"
  | "DOCUMENT"
  | "ARCHIVE"
  | "MODEL_3D"
  | "OTHER";

export type MediaAssetClassification =
  | "MARKETING"
  | "PRODUCT"
  | "CATEGORY"
  | "BRAND"
  | "CMS"
  | "PROMOTION"
  | "LEGAL"
  | "BLOG"
  | "STORE"
  | "AI"
  | "DOWNLOAD"
  | "OTHER";

export type MediaAssetStatus =
  | "UPLOADING"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "ARCHIVED";

export type MediaStorageProvider =
  | "LOCAL"
  | "S3"
  | "R2"
  | "AZURE_BLOB"
  | "GCS"
  | "DIGITALOCEAN_SPACES";

export type MediaAssetOrientation =
  | "LANDSCAPE"
  | "PORTRAIT"
  | "SQUARE"
  | "UNKNOWN";

export type MediaAssetVariantType =
  | "ORIGINAL"
  | "THUMBNAIL"
  | "SMALL"
  | "MEDIUM"
  | "LARGE"
  | "DESKTOP"
  | "TABLET"
  | "MOBILE"
  | "KIOSK"
  | "PREVIEW";

export interface MediaUserSummary {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export interface MediaFolderSummary {
  id: string;
  name: string;
  code: string;
}

export interface MediaFolderTreeNode {
  id: string;
  companyId: string;
  parentFolderId?: string | null;
  name: string;
  code: string;
  description?: string | null;
  displayOrder: number;
  isSystemFolder: boolean;
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  assetCount?: string | number;
  childFolderCount?: string | number;
  children: MediaFolderTreeNode[];
}

export interface MediaAssetVariant {
  id: string;
  companyId: string;
  mediaAssetId: string;
  variantType: MediaAssetVariantType;
  format: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  fileSize: string | number;
  storageProvider: MediaStorageProvider;
  storagePath: string;
  publicUrl?: string | null;
  checksum: string;
  isPrimary: boolean;
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAssetUsage {
  id: string;
  companyId: string;
  mediaAssetId: string;
  module: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  usageContext?: string | null;
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  companyId: string;
  folderId?: string | null;

  assetType: MediaAssetType;
  classification: MediaAssetClassification;
  status: MediaAssetStatus;

  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;

  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  extension: string;
  fileSize: string | number;
  checksum: string;

  storageProvider: MediaStorageProvider;
  storagePath: string;
  publicUrl?: string | null;
  thumbnailPath?: string | null;
  previewPath?: string | null;

  width?: number | null;
  height?: number | null;
  durationSeconds?: string | number | null;
  orientation: MediaAssetOrientation;
  dominantColor?: string | null;
  hasTransparency?: boolean | null;

  copyright?: string | null;
  license?: string | null;

  isPublic: boolean;
  isOptimized: boolean;
  isActive: boolean;

  uploadedBy?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;

  createdAt: string;
  updatedAt: string;

  folder?: MediaFolderSummary | null;
  uploadedByUser?: MediaUserSummary | null;
  variants?: MediaAssetVariant[];
  usageRecords?: MediaAssetUsage[];
}

export interface MediaFolderTreeResponse {
  success: boolean;
  data: MediaFolderTreeNode[];
}

export interface MediaAssetsPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface MediaAssetsResponse {
  success: boolean;
  data: MediaAsset[];
  pagination: MediaAssetsPagination;
}

export interface MediaAssetResponse {
  success: boolean;
  message?: string;
  data: MediaAsset;
}

export interface UploadMediaAssetResponse {
  success: boolean;
  message?: string;
  data: MediaAsset;
  meta?: {
    duplicate?: boolean;
  };
}

export interface MediaAssetsListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  folderId?: string | null;
  assetType?: MediaAssetType;
  classification?: MediaAssetClassification;
  status?: MediaAssetStatus;
  isPublic?: boolean;
  isActive?: boolean;
  sortBy?:
    | "title"
    | "originalFileName"
    | "fileSize"
    | "assetType"
    | "classification"
    | "status"
    | "createdAt"
    | "updatedAt";
  sortDirection?: "ASC" | "DESC";
}

export interface UpdateMediaAssetBody {
  folderId?: string | null;
  classification?: MediaAssetClassification;
  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;
  copyright?: string | null;
  license?: string | null;
  isPublic?: boolean;
}

export interface UpdateMediaAssetRequest {
  id: string;
  body: UpdateMediaAssetBody;
}

export interface CreateMediaFolderBody {
    name: string;
    code?: string;
    parentFolderId?: string | null;
    description?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  }
  
  export interface CreateMediaFolderRequest {
    body: CreateMediaFolderBody;
  }
  
  export interface MediaFolderResponse {
    success: boolean;
    message?: string;
    data: MediaFolderTreeNode;
  }

  export interface MediaAssetUsageResponse {
    success: boolean;
    data: MediaAssetUsage[];
    meta: {
      totalItems: number;
    };
  }
  
  export interface MediaAssetLifecycleResponse {
    success: boolean;
    message?: string;
    data: MediaAsset;
  }