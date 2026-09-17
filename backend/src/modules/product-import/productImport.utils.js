const {
    COLUMN_PREFIX,
    CSV_DELIMITERS,
    RESERVED_COLUMNS,
  } = require("./productImport.constants");
  
  /*
  |--------------------------------------------------------------------------
  | Generic Helpers
  |--------------------------------------------------------------------------
  */
  
  const clean = (value) =>
    value === undefined || value === null
      ? ""
      : String(value).trim();
  
  const cleanUpper = (value) =>
    clean(value).toUpperCase();
  
  const normalizeNullable = (value) => {
    const text = clean(value);
    return text === "" ? null : text;
  };
  
  const normalizeHeader = (header) =>
    clean(header)
      .replace(/\s+/g, "")
      .replace(/_/g, "")
      .toLowerCase();
  
  const slugify = (value) =>
    clean(value)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-");
  
  /*
  |--------------------------------------------------------------------------
  | Boolean / Number
  |--------------------------------------------------------------------------
  */
  
  const normalizeBoolean = (value) => {
    const text = cleanUpper(value);
  
    if (
      [
        "TRUE",
        "YES",
        "Y",
        "1",
      ].includes(text)
    ) {
      return true;
    }
  
    if (
      [
        "FALSE",
        "NO",
        "N",
        "0",
      ].includes(text)
    ) {
      return false;
    }
  
    return null;
  };
  
  const normalizeNumber = (
    value,
    nullable = true
  ) => {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return nullable ? null : 0;
    }
  
    const number = Number(value);
  
    if (!Number.isFinite(number)) {
      return nullable ? null : 0;
    }
  
    return number;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Arrays
  |--------------------------------------------------------------------------
  */
  
  const normalizeArray = (
    value,
    delimiter = CSV_DELIMITERS.LIST
  ) => {
    if (!clean(value)) {
      return [];
    }
  
    return clean(value)
      .split(delimiter)
      .map((item) => item.trim())
      .filter(Boolean);
  };
  
  /*
  |--------------------------------------------------------------------------
  | Dynamic Columns
  |--------------------------------------------------------------------------
  */
  
  const getColumnsByPrefix = (
    headers,
    prefix
  ) =>
    headers.filter((header) =>
      clean(header)
        .toLowerCase()
        .startsWith(prefix.toLowerCase())
    );
  
  const extractVariantColumns = (
    headers
  ) =>
    getColumnsByPrefix(
      headers,
      COLUMN_PREFIX.VARIANT_ATTRIBUTE
    );
  
  const extractSpecificationColumns = (
    headers
  ) =>
    getColumnsByPrefix(
      headers,
      COLUMN_PREFIX.SPECIFICATION
    );
  
  const extractRegularPriceColumns = (
    headers
  ) =>
    getColumnsByPrefix(
      headers,
      COLUMN_PREFIX.REGULAR_PRICE
    );
  
  const extractSellingPriceColumns = (
    headers
  ) =>
    getColumnsByPrefix(
      headers,
      COLUMN_PREFIX.SELLING_PRICE
    );
  
  const extractCompareAtPriceColumns = (
    headers
  ) =>
    getColumnsByPrefix(
      headers,
      COLUMN_PREFIX.COMPARE_AT_PRICE
    );
  
  const extractCostPriceColumns = (
    headers
  ) =>
    getColumnsByPrefix(
      headers,
      COLUMN_PREFIX.COST_PRICE
    );
  
  /*
  |--------------------------------------------------------------------------
  | CSV Validation
  |--------------------------------------------------------------------------
  */
  
  const REQUIRED_COLUMNS = [
    "parentSku",
  ];
  
  const validateHeaders = (
    headers
  ) => {
    const errors = [];
  
    for (const column of REQUIRED_COLUMNS) {
      if (!headers.includes(column)) {
        errors.push(
          `Missing required column "${column}".`
        );
      }
    }
  
    return errors;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Product Grouping
  |--------------------------------------------------------------------------
  */
  
  const groupRowsByParentSku = (
    rows
  ) => {
    const groups = new Map();
  
    for (
      let index = 0;
      index < rows.length;
      index += 1
    ) {
      const row =
        rows[index];
  
      const parentSku =
        cleanUpper(
          row.parentSku
        );
  
      /*
       * Keep missing parent SKUs in separate groups.
       * Otherwise every invalid blank-SKU row would
       * accidentally become one large product.
       */
      const key =
        parentSku ||
        `__MISSING_PARENT_SKU_${index}`;
  
      if (
        !groups.has(key)
      ) {
        groups.set(
          key,
          []
        );
      }
  
      groups
        .get(key)
        .push(row);
    }
  
    return Array.from(
      groups.values()
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Dynamic Price List Names
  |--------------------------------------------------------------------------
  */
  
  const getPriceListCode = (
    header,
    prefix
  ) =>
    clean(
      header.substring(
        prefix.length
      )
    ).toUpperCase();
  
  /*
  |--------------------------------------------------------------------------
  | Build Empty Product Shell
  |--------------------------------------------------------------------------
  */
  
  const createProductShell = (
    row
  ) => ({
    parentSku: clean(row.parentSku),
    name: clean(row.name),
    slug: clean(row.slug),
    productType: cleanUpper(
      row.productType
    ),
    status: cleanUpper(
      row.status
    ),
    brandCode: cleanUpper(
      row.brandCode
    ),
    primaryCategorySlug:
      slugify(
        row.primaryCategorySlug
      ),
    categorySlugs:
      normalizeArray(
        row.categorySlugs
      ).map(slugify),
    rows: [],
  });
  
  /*
  |--------------------------------------------------------------------------
  | Reserved Column
  |--------------------------------------------------------------------------
  */
  
  const isReservedColumn = (
    column
  ) =>
    RESERVED_COLUMNS.includes(
      column
    );
  
  /*
  |--------------------------------------------------------------------------
  | Exports
  |--------------------------------------------------------------------------
  */
  
  module.exports = {
    clean,
    cleanUpper,
    normalizeNullable,
    normalizeHeader,
    normalizeBoolean,
    normalizeNumber,
    normalizeArray,
    slugify,
  
    validateHeaders,
  
    extractVariantColumns,
    extractSpecificationColumns,
    extractRegularPriceColumns,
    extractSellingPriceColumns,
    extractCompareAtPriceColumns,
    extractCostPriceColumns,
  
    groupRowsByParentSku,
  
    getPriceListCode,
  
    createProductShell,
  
    isReservedColumn,
  };