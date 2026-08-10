const PRODUCT_IMPORT_MODES = [
  "CREATE_ONLY",
  "CREATE_OR_UPDATE",
  "UPDATE_ONLY",
];

const MEDIA_IMPORT_MODES = [
  "MERGE",
  "REPLACE",
];

const IMPORTABLE_IMAGE_ROLES = [
  "PRIMARY",
  "GALLERY",
  "SWATCH",
  "LIFESTYLE",
  "MANUAL",
];

const PRODUCT_TYPES = [
  "SIMPLE",
  "VARIABLE",
];

const PRODUCT_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
];

const CHANNEL_CODES = [
  "WEBSITE",
  "KIOSK",
];

const CHANNEL_PUBLISH_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "UNPUBLISHED",
];

const WEIGHT_UNITS = [
  "G",
  "KG",
  "LB",
  "OZ",
];

const DIMENSION_UNITS = [
  "MM",
  "CM",
  "M",
  "IN",
];

const CSV_DELIMITERS = {
  LIST: "|",
  FEATURES: "|",
  BOX: "|",
};

const COLUMN_PREFIX = {
  VARIANT_ATTRIBUTE: "variant:",
  SPECIFICATION: "spec:",
  REGULAR_PRICE: "regularPrice:",
  SELLING_PRICE: "sellingPrice:",
  COMPARE_AT_PRICE: "compareAtPrice:",
  COST_PRICE: "costPrice:",
};

const RESERVED_COLUMNS = [
  "parentSku",
  "name",
  "slug",
  "productType",
  "status",
  "brandCode",
  "primaryCategorySlug",
  "categorySlugs",
  "shortDescription",
  "description",
  "features",
  "whatsInTheBox",
  "warrantyText",
  "taxCode",
  "taxPercent",
  "sortOrder",
  "isFeatured",
  "isSearchable",
  "websiteVisible",
  "websitePublishStatus",
  "websiteTitle",
  "websiteDescription",
  "kioskVisible",
  "kioskPublishStatus",
  "kioskTitle",
  "kioskDescription",
  "metaTitle",
  "metaDescription",
  "metaKeywords",
  "canonicalUrl",
  "collectionSlugs",
  "mediaImportMode",
  "primaryMediaAssetId",
  "primaryImageTitle",
  "primaryImageAltText",
  "galleryMediaAssetIds",
  "variantSku",
  "barcode",
  "variantName",
  "variantStatus",
  "variantSortOrder",
  "isDefault",
  "weight",
  "weightUnit",
  "length",
  "width",
  "height",
  "dimensionUnit",
  "variantMediaGroup",
  "variantMediaImportMode",
  "variantMediaAssetId",
  "variantImageRole",
  "variantImageTitle",
  "variantImageAltText",
  "variantPrimaryMediaAssetId",
  "variantGalleryMediaAssetIds",
  "variantSwatchMediaAssetId",
];

module.exports = {
  PRODUCT_IMPORT_MODES,
  PRODUCT_TYPES,
  PRODUCT_STATUSES,
  CHANNEL_CODES,
  CHANNEL_PUBLISH_STATUSES,
  WEIGHT_UNITS,
  DIMENSION_UNITS,
  CSV_DELIMITERS,
  COLUMN_PREFIX,
  RESERVED_COLUMNS,
  MEDIA_IMPORT_MODES,
  IMPORTABLE_IMAGE_ROLES,
};
