const {
    Op,
  } = require(
    "sequelize"
  );
  
  const db = require(
    "../../../models"
  );
  
  const {
    COLUMN_PREFIX,
    CSV_DELIMITERS,
  } = require(
    "../productImport.constants"
  );
  
  const {
    clean,
    cleanUpper,
  } = require(
    "../productImport.utils"
  );
  
  /*
  |--------------------------------------------------------------------------
  | Standard CSV Columns
  |--------------------------------------------------------------------------
  */
  
  const PRODUCT_COLUMNS = [
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
    "erpId",
    "isDirectDelivery",
    "directDeliverySupplierCode",
    "directDeliveryLeadTimeDays",
    "directDeliveryNote",
    "expressDeliveryEnabled",
    "expressDeliveryHours",
    "deliveryMinDays",
    "deliveryMaxDays",
    "deliveryNote",
  
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
  ];
  
  const VARIANT_COLUMNS = [
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
    "variantOverrideDeliverySettings",
    "variantExpressDeliveryEnabled",
    "variantExpressDeliveryHours",
    "variantDeliveryMinDays",
    "variantDeliveryMaxDays",
    "variantDeliveryNote",
    "variantMediaGroup",
    "variantMediaImportMode",
    "variantPrimaryMediaAssetId",
    "variantGalleryMediaAssetIds",
    "variantSwatchMediaAssetId",
    "variantMediaAssetId",
    "variantImageRole",
    "variantImageTitle",
    "variantImageAltText",
  ];
  
  const PRICE_FIELDS = [
    {
      prefix:
        COLUMN_PREFIX
          .REGULAR_PRICE,
  
      field:
        "regularPrice",
    },
    {
      prefix:
        COLUMN_PREFIX
          .SELLING_PRICE,
  
      field:
        "sellingPrice",
    },
    {
      prefix:
        COLUMN_PREFIX
          .COMPARE_AT_PRICE,
  
      field:
        "compareAtPrice",
    },
    {
      prefix:
        COLUMN_PREFIX
          .COST_PRICE,
  
      field:
        "costPrice",
    },
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Column Documentation
  |--------------------------------------------------------------------------
  */
  
  const COLUMN_DEFINITIONS = {
    parentSku: {
      required:
        true,
  
      scope:
        "PRODUCT",
  
      description:
        "Unique parent product SKU. Repeat the same value for every variant row.",
    },
  
    name: {
      required:
        true,
  
      scope:
        "PRODUCT",
  
      description:
        "Product name. Must be the same on every row belonging to the product.",
    },
  
    slug: {
      required:
        false,
  
      scope:
        "PRODUCT",
  
      description:
        "SEO URL slug. When blank, the product name is converted into a slug.",
    },
  
    productType: {
      required:
        true,
  
      scope:
        "PRODUCT",
  
      allowedValues: [
        "SIMPLE",
        "VARIABLE",
      ],
  
      description:
        "SIMPLE products use one row. VARIABLE products may contain multiple variant rows.",
    },
  
    status: {
      required:
        true,
  
      scope:
        "PRODUCT",
  
      allowedValues: [
        "DRAFT",
        "ACTIVE",
        "INACTIVE",
        "ARCHIVED",
      ],
  
      description:
        "Product status.",
    },
  
    brandCode: {
      required:
        false,
  
      scope:
        "PRODUCT",
  
      description:
        "Existing brand code.",
    },
  
    primaryCategorySlug: {
      required:
        true,
  
      scope:
        "PRODUCT",
  
      description:
        "Existing primary category slug.",
    },
  
    categorySlugs: {
      required:
        false,
  
      scope:
        "PRODUCT",
  
      delimiter:
        CSV_DELIMITERS.LIST,
  
      description:
        "Additional category slugs separated by |.",
    },
  
    collectionSlugs: {
      required:
        false,
  
      scope:
        "PRODUCT",
  
      delimiter:
        CSV_DELIMITERS.LIST,
  
      description:
        "Collection slugs separated by |.",
    },
  
    shortDescription: {
      required:
        false,
  
      scope:
        "PRODUCT",
  
      description:
        "Short product description.",
    },
  
    description: {
      required:
        false,
  
      scope:
        "PRODUCT",
  
      description:
        "Full product description.",
    },
  
    features: {
      required:
        false,
  
      scope:
        "PRODUCT",
  
      delimiter:
        CSV_DELIMITERS.FEATURES,
  
      description:
        "Product features separated by |.",
    },
  
    whatsInTheBox: {
      required:
        false,
  
      scope:
        "PRODUCT",
  
      delimiter:
        CSV_DELIMITERS.BOX,
  
      description:
        "Items included in the box separated by |.",
    },
  
    warrantyText: {
      required:
        false,
  
      scope:
        "PRODUCT",
  
      description:
        "Warranty information.",
    },
  
    taxCode: {
      required:
        false,
  
      scope:
        "PRODUCT",
  
      description:
        "Tax code or tax reference.",
    },
  
    taxPercent: {
      required:
        false,
  
      scope:
        "PRODUCT",
  
      description:
        "Tax percentage between 0 and 100.",
    },
  
    sortOrder: {
      required:
        false,
  
      scope:
        "PRODUCT",
  
      description:
        "Product display order.",
    },
  
    isFeatured: {
      required:
        false,
  
      scope:
        "PRODUCT",
  
      allowedValues: [
        "TRUE",
        "FALSE",
      ],
  
      defaultValue:
        "FALSE",
  
      description:
        "Whether the product is featured.",
    },
  
    isSearchable: {
      required:
        false,
  
      scope:
        "PRODUCT",
  
      allowedValues: [
        "TRUE",
        "FALSE",
      ],
  
      defaultValue:
        "TRUE",
  
      description:
        "Whether the product appears in search.",
    },

    mediaImportMode: {
        required: false,
        scope: "PRODUCT",
        allowedValues: [
            "MERGE",
            "REPLACE",
        ],
        defaultValue: "MERGE",
        description:
            "How product images are imported.",
    },
    
    primaryMediaAssetId: {
        required: false,
        scope: "PRODUCT",
        description:
            "Media Library original filename or MediaAsset UUID used as the primary product image.",
    },
    
    primaryImageTitle: {
        required: false,
        scope: "PRODUCT",
        description:
            "Primary image title.",
    },
    
    primaryImageAltText: {
        required: false,
        scope: "PRODUCT",
        description:
            "Primary image alt text.",
    },
    
    galleryMediaAssetIds: {
        required: false,
        scope: "PRODUCT",
        delimiter: "|",
        description:
            "Gallery Media Library filenames or MediaAsset UUIDs separated by |.",
    },
    
    variantMediaGroup: {
      required: false,
      scope: "VARIANT",
      description:
        "Reusable media group code. Variants with the same code receive the same primary, gallery and swatch media. Define the media on at least one row in the group.",
    },

    variantMediaImportMode: {
      required: false,
      scope: "VARIANT",
      allowedValues: ["MERGE", "REPLACE"],
      defaultValue: "MERGE",
      description:
        "Merge with or replace existing media for this variant.",
    },

    variantPrimaryMediaAssetId: {
      required: false,
      scope: "VARIANT",
      description:
        "Media Library filename or MediaAsset UUID for the variant primary image.",
    },

    variantGalleryMediaAssetIds: {
      required: false,
      scope: "VARIANT",
      delimiter: CSV_DELIMITERS.LIST,
      description:
        "Variant gallery filenames or MediaAsset UUIDs separated by |.",
    },

    variantSwatchMediaAssetId: {
      required: false,
      scope: "VARIANT",
      description:
        "Media Library filename or MediaAsset UUID for the variant swatch image.",
    },

    variantMediaAssetId: {
        required: false,
        scope: "VARIANT",
        description:
            "Media Library original filename or MediaAsset UUID used for this variant.",
    },
    
    variantImageRole: {
        required: false,
        scope: "VARIANT",
        allowedValues: [
            "PRIMARY",
            "GALLERY",
            "SWATCH",
            "LIFESTYLE",
            "MANUAL",
        ],
        defaultValue: "PRIMARY",
        description:
            "Variant image role.",
    },
    
    variantImageTitle: {
        required: false,
        scope: "VARIANT",
        description:
            "Variant image title.",
    },
    
    variantImageAltText: {
        required: false,
        scope: "VARIANT",
        description:
            "Variant image alt text.",
    },
    erpId: {
      required:
        false,

      scope:
        "PRODUCT",

      description:
        "External ERP item identifier. For Zoho, store the Zoho item_id here.",
    },

    isDirectDelivery: {
      required:
        false,

      scope:
        "PRODUCT",

      allowedValues: [
        "TRUE",
        "FALSE",
      ],

      description:
        "TRUE when this product is fulfilled directly by the supplier.",
    },

    directDeliverySupplierCode: {
      required:
        false,

      scope:
        "PRODUCT",

      description:
        "Existing supplier code. Required when isDirectDelivery is TRUE.",
    },

    directDeliveryLeadTimeDays: {
      required:
        false,

      scope:
        "PRODUCT",

      description:
        "Non-negative whole number of supplier delivery lead-time days.",
    },

    directDeliveryNote: {
      required:
        false,

      scope:
        "PRODUCT",

      description:
        "Direct-delivery note. Maximum 500 characters.",
    },

  
    websiteVisible: {
      required:
        false,
  
      scope:
        "PRODUCT_CHANNEL",
  
      allowedValues: [
        "TRUE",
        "FALSE",
      ],
  
      defaultValue:
        "TRUE",
  
      description:
        "Whether the product is visible on the website.",
    },
  
    websitePublishStatus: {
      required:
        false,
  
      scope:
        "PRODUCT_CHANNEL",
  
      allowedValues: [
        "DRAFT",
        "PUBLISHED",
        "UNPUBLISHED",
      ],
  
      defaultValue:
        "DRAFT",
  
      description:
        "Website publishing status.",
    },
  
    websiteTitle: {
      required:
        false,
  
      scope:
        "PRODUCT_CHANNEL",
  
      description:
        "Optional website-specific product title.",
    },
  
    websiteDescription: {
      required:
        false,
  
      scope:
        "PRODUCT_CHANNEL",
  
      description:
        "Optional website-specific description.",
    },
  
    kioskVisible: {
      required:
        false,
  
      scope:
        "PRODUCT_CHANNEL",
  
      allowedValues: [
        "TRUE",
        "FALSE",
      ],
  
      defaultValue:
        "TRUE",
  
      description:
        "Whether the product is visible in the kiosk.",
    },
  
    kioskPublishStatus: {
      required:
        false,
  
      scope:
        "PRODUCT_CHANNEL",
  
      allowedValues: [
        "DRAFT",
        "PUBLISHED",
        "UNPUBLISHED",
      ],
  
      defaultValue:
        "DRAFT",
  
      description:
        "Kiosk publishing status.",
    },
  
    kioskTitle: {
      required:
        false,
  
      scope:
        "PRODUCT_CHANNEL",
  
      description:
        "Optional kiosk-specific product title.",
    },
  
    kioskDescription: {
      required:
        false,
  
      scope:
        "PRODUCT_CHANNEL",
  
      description:
        "Optional kiosk-specific description.",
    },
  
    metaTitle: {
      required:
        false,
  
      scope:
        "SEO",
  
      description:
        "SEO meta title.",
    },
  
    metaDescription: {
      required:
        false,
  
      scope:
        "SEO",
  
      description:
        "SEO meta description.",
    },
  
    metaKeywords: {
      required:
        false,
  
      scope:
        "SEO",
  
      description:
        "SEO keywords.",
    },
  
    canonicalUrl: {
      required:
        false,
  
      scope:
        "SEO",
  
      description:
        "Absolute canonical URL.",
    },
  
    variantSku: {
      required:
        false,
  
      scope:
        "VARIANT",
  
      description:
        "Unique variant SKU. Required for VARIABLE products.",
    },
  
    barcode: {
      required:
        false,
  
      scope:
        "VARIANT",
  
      description:
        "Unique variant barcode.",
    },
  
    variantName: {
      required:
        false,
  
      scope:
        "VARIANT",
  
      description:
        "Variant-specific name.",
    },
  
    variantStatus: {
      required:
        false,
  
      scope:
        "VARIANT",
  
      allowedValues: [
        "DRAFT",
        "ACTIVE",
        "INACTIVE",
        "ARCHIVED",
      ],
  
      description:
        "Variant status. Falls back to product status when blank.",
    },
  
    variantSortOrder: {
      required:
        false,
  
      scope:
        "VARIANT",
  
      description:
        "Variant display order.",
    },
  
    isDefault: {
      required:
        false,
  
      scope:
        "VARIANT",
  
      allowedValues: [
        "TRUE",
        "FALSE",
      ],
  
      description:
        "Marks the default product variant.",
    },
  
    weight: {
      required:
        false,
  
      scope:
        "VARIANT",
  
      description:
        "Variant weight.",
    },
  
    weightUnit: {
      required:
        false,
  
      scope:
        "VARIANT",
  
      allowedValues: [
        "G",
        "KG",
        "LB",
        "OZ",
      ],
  
      description:
        "Required when weight is supplied.",
    },
  
    length: {
      required:
        false,
  
      scope:
        "VARIANT",
  
      description:
        "Variant length.",
    },
  
    width: {
      required:
        false,
  
      scope:
        "VARIANT",
  
      description:
        "Variant width.",
    },
  
    height: {
      required:
        false,
  
      scope:
        "VARIANT",
  
      description:
        "Variant height.",
    },
  
    dimensionUnit: {
      required:
        false,
  
      scope:
        "VARIANT",
  
      allowedValues: [
        "MM",
        "CM",
        "M",
        "IN",
      ],
  
      description:
        "Required when length, width or height is supplied.",
    },
  };
  
  /*
  |--------------------------------------------------------------------------
  | Generic Helpers
  |--------------------------------------------------------------------------
  */
  
  const unique = (
    values
  ) => [
    ...new Set(
      values.filter(Boolean)
    ),
  ];
  
  const createTemplateError = (
    message,
    code,
    statusCode = 400
  ) => {
    const error =
      new Error(message);
  
    error.code =
      code;
  
    error.statusCode =
      statusCode;
  
    return error;
  };
  
  /*
  |--------------------------------------------------------------------------
  | CSV Escaping
  |--------------------------------------------------------------------------
  */
  
  const escapeCsvValue = (
    value
  ) => {
    if (
      value === undefined ||
      value === null
    ) {
      return "";
    }
  
    let text;
  
    if (
      typeof value ===
      "object"
    ) {
      text =
        JSON.stringify(value);
    } else {
      text =
        String(value);
    }
  
    const mustQuote =
      text.includes(",") ||
      text.includes('"') ||
      text.includes("\n") ||
      text.includes("\r");
  
    if (!mustQuote) {
      return text;
    }
  
    return `"${text.replace(
      /"/g,
      '""'
    )}"`;
  };
  
  const convertRowsToCsv = ({
    headers,
    rows,
    includeBom = true,
  }) => {
    const lines = [
      headers
        .map(
          escapeCsvValue
        )
        .join(","),
    ];
  
    for (
      const row of rows
    ) {
      lines.push(
        headers
          .map(
            (header) =>
              escapeCsvValue(
                row[header]
              )
          )
          .join(",")
      );
    }
  
    const csv =
      lines.join(
        "\r\n"
      );
  
    /*
     * UTF-8 BOM helps Microsoft Excel correctly
     * identify Unicode CSV content.
     */
    return includeBom
      ? `\uFEFF${csv}`
      : csv;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Template Metadata Loaders
  |--------------------------------------------------------------------------
  */
  
  const loadTemplateAttributes =
  async ({
    companyId,
    transaction,
  }) =>
    db.Attribute.findAll({
      where: {
        companyId,
        isActive: true,
      },

      attributes: [
        "id",
        "code",
        "name",
        "inputType",
        "dataType",
        "unit",
        "isVariantDefining",
        "isRequired",
        "isActive",
      ],

      order: [
        [
          "isVariantDefining",
          "DESC",
        ],
        [
          "name",
          "ASC",
        ],
      ],

      transaction,
    });

    const loadTemplatePriceLists =
    async ({
      companyId,
      transaction,
    }) =>
      db.PriceList.findAll({
        where: {
          companyId,
  
          isActive:
            true,
        },
  
        attributes: [
          "id",
          "code",
          "name",
          "currencyCode",
          "channelCode",
          "priceListType",
          "isTaxInclusive",
          "isDefault",
          "isActive",
        ],
  
        order: [
          [
            "isDefault",
            "DESC",
          ],
          [
            "code",
            "ASC",
          ],
        ],
  
        transaction,
      });
  
  const loadTemplateReferences =
    async ({
      companyId,
      transaction,
    }) => {
      const [
        attributes,
        priceLists,
      ] = await Promise.all([
        loadTemplateAttributes({
          companyId,
          transaction,
        }),
  
        loadTemplatePriceLists({
          companyId,
          transaction,
        }),
      ]);
  
      return {
        attributes,
        priceLists,
      };
    };
  
  /*
  |--------------------------------------------------------------------------
  | Dynamic Header Builders
  |--------------------------------------------------------------------------
  */
  
  const buildVariantAttributeHeaders = (
    attributes
  ) =>
    attributes
      .filter(
        (attribute) =>
          attribute.isVariantDefining ===
          true
      )
      .map(
        (attribute) =>
          `${COLUMN_PREFIX.VARIANT_ATTRIBUTE}${cleanUpper(
            attribute.code
          )}`
      );
  
  const buildSpecificationHeaders = (
    attributes
  ) =>
    attributes
      .filter(
        (attribute) =>
          attribute.isVariantDefining !==
          true
      )
      .map(
        (attribute) =>
          `${COLUMN_PREFIX.SPECIFICATION}${cleanUpper(
            attribute.code
          )}`
      );
  
  const buildPriceHeaders = (
    priceLists
  ) => {
    const headers = [];
  
    for (
      const priceList of
      priceLists
    ) {
      const code =
        cleanUpper(
          priceList.code
        );
  
      if (!code) {
        continue;
      }
  
      for (
        const priceField of
        PRICE_FIELDS
      ) {
        headers.push(
          `${priceField.prefix}${code}`
        );
      }
    }
  
    return headers;
  };
  
  const buildTemplateHeaders = ({
    attributes,
    priceLists,
  }) =>
    unique([
      ...PRODUCT_COLUMNS,
  
      ...VARIANT_COLUMNS,
  
      ...buildVariantAttributeHeaders(
        attributes
      ),
  
      ...buildSpecificationHeaders(
        attributes
      ),
  
      ...buildPriceHeaders(
        priceLists
      ),
    ]);
  
  /*
  |--------------------------------------------------------------------------
  | Dynamic Column Definitions
  |--------------------------------------------------------------------------
  */
  
  const buildAttributeColumnDefinition = ({
    attribute,
    prefix,
    scope,
  }) => ({
    column:
      `${prefix}${cleanUpper(
        attribute.code
      )}`,
  
    required:
      attribute.isRequired ===
      true,
  
    scope,
  
    attributeId:
      attribute.id,
  
    attributeCode:
      attribute.code,
  
    attributeName:
      attribute.name,
  
    inputType:
      attribute.inputType,
  
    dataType:
      attribute.dataType,
  
    unit:
      attribute.unit ||
      null,
  
    description:
      scope ===
      "VARIANT_ATTRIBUTE"
        ? `Variant-defining attribute: ${attribute.name}.`
        : `Product specification: ${attribute.name}.`,
  });
  
  const buildPriceColumnDefinitions = (
    priceLists
  ) => {
    const definitions = [];
  
    for (
      const priceList of
      priceLists
    ) {
      const code =
        cleanUpper(
          priceList.code
        );
  
      if (!code) {
        continue;
      }
  
      for (
        const definition of
        PRICE_FIELDS
      ) {
        definitions.push({
          column:
            `${definition.prefix}${code}`,
  
          required: [
            "regularPrice",
            "sellingPrice",
          ].includes(
            definition.field
          ),
  
          scope:
            "VARIANT_PRICE",
  
          priceField:
            definition.field,
  
          priceListId:
            priceList.id,
  
          priceListCode:
            priceList.code,
  
          priceListName:
            priceList.name,
  
          currencyCode:
            priceList.currencyCode,
  
          channelCode:
            priceList.channelCode,
  
          isTaxInclusive:
            priceList.isTaxInclusive,
  
          description:
            `${definition.field} for price list ${priceList.code}.`,
        });
      }
    }
  
    return definitions;
  };
  
  const buildTemplateColumnDefinitions = ({
    headers,
    attributes,
    priceLists,
  }) => {
    const definitions =
      new Map();
  
    for (
      const header of
      headers
    ) {
      if (
        COLUMN_DEFINITIONS[
          header
        ]
      ) {
        definitions.set(
          header,
          {
            column:
              header,
  
            ...COLUMN_DEFINITIONS[
              header
            ],
          }
        );
      }
    }
  
    for (
      const attribute of
      attributes
    ) {
      const definition =
        buildAttributeColumnDefinition({
          attribute,
  
          prefix:
            attribute
                .isVariantDefining ===
              true
              ? COLUMN_PREFIX
                  .VARIANT_ATTRIBUTE
              : COLUMN_PREFIX
                  .SPECIFICATION,
  
          scope:
            attribute
                .isVariantDefining ===
              true
              ? "VARIANT_ATTRIBUTE"
              : "SPECIFICATION",
        });
  
      definitions.set(
        definition.column,
        definition
      );
    }
  
    for (
      const definition of
      buildPriceColumnDefinitions(
        priceLists
      )
    ) {
      definitions.set(
        definition.column,
        definition
      );
    }
  
    return headers.map(
      (header) =>
        definitions.get(
          header
        ) || {
          column:
            header,
  
          required:
            false,
  
          scope:
            "UNKNOWN",
  
          description:
            null,
        }
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Example Value Helpers
  |--------------------------------------------------------------------------
  */
  
  const buildExampleAttributeValue = (
    attribute,
    index = 0
  ) => {
    switch (
      attribute.dataType
    ) {
      case "NUMBER":
        return index === 0
          ? "10"
          : "20";
  
      case "BOOLEAN":
        return index === 0
          ? "TRUE"
          : "FALSE";
  
      case "DATE":
        return "2026-01-01";
  
      case "JSON":
        return '{"key":"value"}';
  
      default:
        return attribute
            .isVariantDefining ===
          true
          ? (
              index === 0
                ? "OPTION_1"
                : "OPTION_2"
            )
          : "Sample value";
    }
  };
  
  const addDynamicExampleValues = ({
    row,
    attributes,
    priceLists,
    variantIndex,
  }) => {
    for (
      const attribute of
      attributes
    ) {
      const prefix =
        attribute
            .isVariantDefining ===
          true
          ? COLUMN_PREFIX
              .VARIANT_ATTRIBUTE
          : COLUMN_PREFIX
              .SPECIFICATION;
  
      const header =
        `${prefix}${cleanUpper(
          attribute.code
        )}`;
  
      /*
       * Product specifications are product-level and should
       * remain identical on every variant row.
       */
      row[header] =
        buildExampleAttributeValue(
          attribute,
          attribute
              .isVariantDefining ===
            true
            ? variantIndex
            : 0
        );
    }
  
    for (
      const priceList of
      priceLists
    ) {
      const code =
        cleanUpper(
          priceList.code
        );
  
      row[
        `${COLUMN_PREFIX.REGULAR_PRICE}${code}`
      ] =
        variantIndex === 0
          ? "999.00"
          : "1099.00";
  
      row[
        `${COLUMN_PREFIX.SELLING_PRICE}${code}`
      ] =
        variantIndex === 0
          ? "899.00"
          : "999.00";
  
      row[
        `${COLUMN_PREFIX.COMPARE_AT_PRICE}${code}`
      ] =
        variantIndex === 0
          ? "999.00"
          : "1099.00";
  
      row[
        `${COLUMN_PREFIX.COST_PRICE}${code}`
      ] =
        variantIndex === 0
          ? "700.00"
          : "800.00";
    }
  
    return row;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Example Rows
  |--------------------------------------------------------------------------
  */
  
  const buildVariableExampleRows = ({
    attributes,
    priceLists,
  }) => {
    const firstRow = {
      parentSku:
        "SAMPLE-PRODUCT-001",
  
      name:
        "Sample Variable Product",
  
      slug:
        "sample-variable-product",
  
      productType:
        "VARIABLE",
  
      status:
        "DRAFT",
  
      brandCode:
        "SAMPLE_BRAND",
  
      primaryCategorySlug:
        "sample-category",
  
      categorySlugs:
        "sample-category|secondary-category",
  
      shortDescription:
        "Sample short description",
  
      description:
        "Sample full product description",
  
      features:
        "Feature one|Feature two",
  
      whatsInTheBox:
        "Product|User guide|Warranty card",
  
      warrantyText:
        "One-year warranty",
  
      taxCode:
        "VAT5",
  
      taxPercent:
        "5",
  
      sortOrder:
        "1",
  
      isFeatured:
        "FALSE",
  
      isSearchable:
        "TRUE",
  
      websiteVisible:
        "TRUE",
  
      websitePublishStatus:
        "DRAFT",
  
      websiteTitle:
        "Sample Website Product",
  
      websiteDescription:
        "Sample website description",
  
      kioskVisible:
        "TRUE",
  
      kioskPublishStatus:
        "DRAFT",
  
      kioskTitle:
        "Sample Kiosk Product",
  
      kioskDescription:
        "Sample kiosk description",
  
      metaTitle:
        "Sample Product",
  
      metaDescription:
        "Sample product meta description",
  
      metaKeywords:
        "sample,product",
  
      canonicalUrl:
        "",
  
      collectionSlugs:
        "featured-products",
    
        mediaImportMode:
        "MERGE",
    
        primaryMediaAssetId:
            "sample-product-front.jpg",
        
        primaryImageTitle:
            "Front View",
        
        primaryImageAltText:
            "Front view of the product",
        
        galleryMediaAssetIds:
            "sample-product-back.jpg|sample-product-side.jpg",
  
      variantSku:
        "SAMPLE-PRODUCT-001-V1",
  
      barcode:
        "100000000001",
  
      variantName:
        "Sample Variant 1",
    
        variantMediaAssetId:
    "sample-product-variant-1.jpg",

        variantImageRole:
            "PRIMARY",

        variantImageTitle:
            "Variant Front",

        variantImageAltText:
            "Variant front image",
        
      variantStatus:
        "DRAFT",
  
      variantSortOrder:
        "0",
  
      isDefault:
        "TRUE",
  
      weight:
        "1.25",
  
      weightUnit:
        "KG",
  
      length:
        "20",
  
      width:
        "10",
  
      height:
        "5",
  
      dimensionUnit:
        "CM",
    };
  
    const secondRow = {
      ...firstRow,
  
      variantSku:
        "SAMPLE-PRODUCT-001-V2",
  
      barcode:
        "100000000002",
  
      variantName:
        "Sample Variant 2",
    
        variantMediaAssetId:
        "sample-product-variant-2.jpg",
    
    variantImageRole:
        "PRIMARY",
    
    variantImageTitle:
        "Variant 2 Front",
    
    variantImageAltText:
        "Variant 2 front image",  
  
      variantSortOrder:
        "1",
  
      isDefault:
        "FALSE",
  
      /*
       * Product-level fields remain exactly the same
       * across every variant row.
       */
    };
  
    addDynamicExampleValues({
      row:
        firstRow,
  
      attributes,
  
      priceLists,
  
      variantIndex:
        0,
    });
  
    addDynamicExampleValues({
      row:
        secondRow,
  
      attributes,
  
      priceLists,
  
      variantIndex:
        1,
    });
  
    return [
      firstRow,
      secondRow,
    ];
  };
  
  const buildSimpleExampleRow = ({
    attributes,
    priceLists,
  }) => {
    const row = {
      parentSku:
        "SAMPLE-SIMPLE-001",
  
      name:
        "Sample Simple Product",
  
      slug:
        "sample-simple-product",
  
      productType:
        "SIMPLE",
  
      status:
        "DRAFT",
  
      brandCode:
        "SAMPLE_BRAND",
  
      primaryCategorySlug:
        "sample-category",
  
      categorySlugs:
        "",
  
      shortDescription:
        "Sample simple product",
  
      description:
        "Sample simple product description",
  
      features:
        "Feature one|Feature two",
  
      whatsInTheBox:
        "Product|User guide",
  
      warrantyText:
        "One-year warranty",
  
      taxCode:
        "VAT5",
  
      taxPercent:
        "5",
  
      sortOrder:
        "2",
  
      isFeatured:
        "FALSE",
  
      isSearchable:
        "TRUE",
  
      websiteVisible:
        "TRUE",
  
      websitePublishStatus:
        "DRAFT",
  
      websiteTitle:
        "",
  
      websiteDescription:
        "",
  
      kioskVisible:
        "TRUE",
  
      kioskPublishStatus:
        "DRAFT",
  
      kioskTitle:
        "",
  
      kioskDescription:
        "",
  
      metaTitle:
        "",
  
      metaDescription:
        "",
  
      metaKeywords:
        "",
  
      canonicalUrl:
        "",
  
      collectionSlugs:
        "",
    
        mediaImportMode:
        "MERGE",
    
        primaryMediaAssetId:
            "sample-product-front.jpg",
        
        primaryImageTitle:
            "Front",
        
        primaryImageAltText:
            "Front image",
        
        galleryMediaAssetIds:
            "",
  
      variantSku:
        "SAMPLE-SIMPLE-001",
  
      barcode:
        "100000000003",
  
      variantName:
        "Default",
        
        variantMediaAssetId:
        "sample-product-variant-1.jpg",
    
    variantImageRole:
        "PRIMARY",
    
    variantImageTitle:
        "Default",
    
    variantImageAltText:
        "Default image",
  
      variantStatus:
        "DRAFT",
  
      variantSortOrder:
        "0",
  
      isDefault:
        "TRUE",
  
      weight:
        "",
  
      weightUnit:
        "",
  
      length:
        "",
  
      width:
        "",
  
      height:
        "",
  
      dimensionUnit:
        "",
    };
  
    /*
     * Variant-defining attributes are intentionally left blank
     * for the SIMPLE example.
     */
    for (
      const attribute of
      attributes
    ) {
      const prefix =
        attribute
            .isVariantDefining ===
          true
          ? COLUMN_PREFIX
              .VARIANT_ATTRIBUTE
          : COLUMN_PREFIX
              .SPECIFICATION;
  
      const header =
        `${prefix}${cleanUpper(
          attribute.code
        )}`;
  
      row[header] =
        attribute
            .isVariantDefining ===
          true
          ? ""
          : buildExampleAttributeValue(
              attribute,
              0
            );
    }
  
    for (
      const priceList of
      priceLists
    ) {
      const code =
        cleanUpper(
          priceList.code
        );
  
      row[
        `${COLUMN_PREFIX.REGULAR_PRICE}${code}`
      ] =
        "499.00";
  
      row[
        `${COLUMN_PREFIX.SELLING_PRICE}${code}`
      ] =
        "449.00";
  
      row[
        `${COLUMN_PREFIX.COMPARE_AT_PRICE}${code}`
      ] =
        "499.00";
  
      row[
        `${COLUMN_PREFIX.COST_PRICE}${code}`
      ] =
        "350.00";
    }
  
    return row;
  };
  
  const buildExampleRows = ({
    attributes,
    priceLists,
  }) => [
    buildSimpleExampleRow({
      attributes,
      priceLists,
    }),
  
    ...buildVariableExampleRows({
      attributes,
      priceLists,
    }),
  ];
  
  /*
  |--------------------------------------------------------------------------
  | Template Summary
  |--------------------------------------------------------------------------
  */
  
  const buildTemplateSummary = ({
    headers,
    attributes,
    priceLists,
    rows,
  }) => ({
    columnCount:
      headers.length,
  
    exampleRowCount:
      rows.length,
  
    productColumnCount:
      PRODUCT_COLUMNS.length,
  
    variantColumnCount:
      VARIANT_COLUMNS.length,
  
    variantAttributeCount:
      attributes.filter(
        (attribute) =>
          attribute.isVariantDefining ===
          true
      ).length,
  
    specificationCount:
      attributes.filter(
        (attribute) =>
          attribute.isVariantDefining !==
          true
      ).length,
  
    priceListCount:
      priceLists.length,
  
    priceColumnCount:
      priceLists.length *
      PRICE_FIELDS.length,
  });
  
  /*
  |--------------------------------------------------------------------------
  | Main Template Service
  |--------------------------------------------------------------------------
  */
  
  const buildProductImportTemplate =
    async ({
      companyId,
  
      includeExamples =
        false,
  
      includeBom =
        true,
  
      transaction =
        null,
    }) => {
      if (!companyId) {
        throw createTemplateError(
          "companyId is required.",
          "PRODUCT_IMPORT_TEMPLATE_COMPANY_REQUIRED"
        );
      }
  
      const {
        attributes,
        priceLists,
      } =
        await loadTemplateReferences({
          companyId,
          transaction,
        });
  
      const headers =
        buildTemplateHeaders({
          attributes,
          priceLists,
        });
  
      const rows =
        includeExamples
          ? buildExampleRows({
              attributes,
              priceLists,
            })
          : [];
  
      const columnDefinitions =
        buildTemplateColumnDefinitions({
          headers,
          attributes,
          priceLists,
        });
  
      const csv =
        convertRowsToCsv({
          headers,
          rows,
          includeBom,
        });
  
      const dateText =
        new Date()
          .toISOString()
          .slice(
            0,
            10
          );
  
      return {
        success:
          true,
  
        companyId,
  
        fileName:
          includeExamples
            ? `product-import-example-${dateText}.csv`
            : `product-import-template-${dateText}.csv`,
  
        mimeType:
          "text/csv; charset=utf-8",
  
        encoding:
          "utf-8",
  
        includeExamples,
  
        headers,
  
        rows,
  
        csv,
  
        columns:
          columnDefinitions,
  
        references: {
          attributes:
            attributes.map(
              (attribute) => ({
                id:
                  attribute.id,
  
                code:
                  attribute.code,
  
                name:
                  attribute.name,
  
                inputType:
                  attribute.inputType,
  
                dataType:
                  attribute.dataType,
  
                unit:
                  attribute.unit,
  
                isVariantDefining:
                  attribute.isVariantDefining,
  
                isRequired:
                  attribute.isRequired,
              })
            ),
  
          priceLists:
            priceLists.map(
              (priceList) => ({
                id:
                  priceList.id,
  
                code:
                  priceList.code,
  
                name:
                  priceList.name,
  
                currencyCode:
                  priceList.currencyCode,
  
                channelCode:
                  priceList.channelCode,
  
                priceListType:
                  priceList.priceListType,
  
                isTaxInclusive:
                  priceList.isTaxInclusive,
  
                isDefault:
                  priceList.isDefault,
              })
            ),
        },
  
        summary:
          buildTemplateSummary({
            headers,
            attributes,
            priceLists,
            rows,
          }),
      };
    };
  
  /*
  |--------------------------------------------------------------------------
  | Exports
  |--------------------------------------------------------------------------
  */
  
  module.exports = {
    buildProductImportTemplate,
  
    loadTemplateReferences,
  
    loadTemplateAttributes,
  
    loadTemplatePriceLists,
  
    buildTemplateHeaders,
  
    buildVariantAttributeHeaders,
  
    buildSpecificationHeaders,
  
    buildPriceHeaders,
  
    buildTemplateColumnDefinitions,
  
    buildAttributeColumnDefinition,
  
    buildPriceColumnDefinitions,
  
    buildExampleRows,
  
    buildSimpleExampleRow,
  
    buildVariableExampleRows,
  
    buildExampleAttributeValue,
  
    buildTemplateSummary,
  
    convertRowsToCsv,
  
    escapeCsvValue,
  
    PRODUCT_COLUMNS,
  
    VARIANT_COLUMNS,
  
    PRICE_FIELDS,
  
    COLUMN_DEFINITIONS,
  };