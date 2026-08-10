const ATTRIBUTE_IMPORT_MODES = [
    "CREATE_ONLY",
    "UPDATE_ONLY",
    "CREATE_OR_UPDATE",
  ];
  
  const ATTRIBUTE_IMPORT_HEADERS = [
    "name",
    "code",
    "description",
    "inputType",
    "dataType",
    "unit",
  
    "isVariantDefining",
    "isFilterable",
    "isSearchable",
    "isComparable",
    "isRequired",
  
    "displayOrder",
    "isActive",
  
    /*
     * Pipe-separated options.
     *
     * Examples:
     *
     * 128 GB|256 GB|512 GB
     *
     * Black::black::#000000|White::white::#FFFFFF
     *
     * Format:
     * label
     * label::value
     * label::value::swatchValue
     */
    "options",
  
    /*
     * Pipe-separated category slugs.
     *
     * Example:
     * mobile-phones|tablets|laptops
     */
    "categorySlugs",
  ];
  
  module.exports = {
    ATTRIBUTE_IMPORT_MODES,
    ATTRIBUTE_IMPORT_HEADERS,
  };