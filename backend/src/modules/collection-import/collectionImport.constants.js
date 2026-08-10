const COLLECTION_IMPORT_MODES = [
    "CREATE_ONLY",
    "UPDATE_ONLY",
    "CREATE_OR_UPDATE",
  ];
  
  const COLLECTION_IMPORT_HEADERS = [
    "name",
    "slug",
  
    "description",
    "shortDescription",
  
    "collectionType",
    "sortOrder",
  
    "isActive",
    "isFeatured",
    "showInMenu",
    "showOnHome",
    "isSearchable",
    "showProductCount",
  
    "publishedFrom",
    "publishedUntil",
  
    "metaTitle",
    "metaDescription",
    "metaKeywords",
    "canonicalUrl",
  
    "robotsIndex",
    "robotsFollow",
  ];
  
  module.exports = {
    COLLECTION_IMPORT_MODES,
    COLLECTION_IMPORT_HEADERS,
  };