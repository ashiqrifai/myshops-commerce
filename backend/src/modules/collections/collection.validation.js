const {
  body,
  query,
  param,
} = require(
  "express-validator"
);

/*
|--------------------------------------------------------------------------
| Common helpers
|--------------------------------------------------------------------------
*/

const optionalUuid = (
  field,
  label
) =>
  body(field)
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isUUID()
    .withMessage(
      `${label} must be a valid UUID.`
    );

const optionalDate = (
  field,
  label
) =>
  body(field)
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isISO8601()
    .withMessage(
      `${label} must be a valid date.`
    )
    .toDate();

/*
|--------------------------------------------------------------------------
| Common
|--------------------------------------------------------------------------
*/

const collectionIdValidation = [
  param("id")
    .isUUID()
    .withMessage(
      "A valid collection ID is required."
    ),
];

/*
|--------------------------------------------------------------------------
| List
|--------------------------------------------------------------------------
*/

const listCollectionsValidation = [
  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Page must be at least 1."
    )
    .toInt(),

  query("pageSize")
    .optional()
    .isInt({
      min: 1,
      max: 200,
    })
    .withMessage(
      "Page size must be between 1 and 200."
    )
    .toInt(),

  query("search")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim(),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage(
      "isActive must be true or false."
    )
    .toBoolean(),

  query("isFeatured")
    .optional()
    .isBoolean()
    .withMessage(
      "isFeatured must be true or false."
    )
    .toBoolean(),

  query("showInMenu")
    .optional()
    .isBoolean()
    .withMessage(
      "showInMenu must be true or false."
    )
    .toBoolean(),

  query("showOnHome")
    .optional()
    .isBoolean()
    .withMessage(
      "showOnHome must be true or false."
    )
    .toBoolean(),

  query("published")
    .optional()
    .isBoolean()
    .withMessage(
      "published must be true or false."
    )
    .toBoolean(),

  query("collectionType")
    .optional()
    .isIn([
      "MANUAL",
      "SMART",
    ])
    .withMessage(
      "Collection type must be MANUAL or SMART."
    ),

  query("sortBy")
    .optional()
    .isIn([
      "name",
      "slug",
      "collectionType",
      "sortOrder",
      "isActive",
      "isFeatured",
      "showInMenu",
      "showOnHome",
      "publishedFrom",
      "publishedUntil",
      "createdAt",
      "updatedAt",
    ])
    .withMessage(
      "Invalid collection sort field."
    ),

  query("sortDirection")
    .optional()
    .isIn([
      "ASC",
      "DESC",
    ])
    .withMessage(
      "Sort direction must be ASC or DESC."
    ),
];

/*
|--------------------------------------------------------------------------
| Reusable collection fields
|--------------------------------------------------------------------------
*/

const collectionFieldValidation = [
  body("slug")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 250,
    })
    .withMessage(
      "Slug cannot exceed 250 characters."
    ),

  body("description")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Description must be text."
    ),

  body("shortDescription")
    .optional({
      nullable: true,
    })
    .isString()
    .withMessage(
      "Short description must be text."
    )
    .isLength({
      max: 500,
    })
    .withMessage(
      "Short description cannot exceed 500 characters."
    ),

  body("collectionType")
    .optional()
    .isIn([
      "MANUAL",
      "SMART",
    ])
    .withMessage(
      "Collection type must be MANUAL or SMART."
    ),

  body("smartRules")
    .optional({
      nullable: true,
    })
    .custom(
      (
        value,
        {
          req,
        }
      ) => {
        if (
          value ===
          null ||
          value ===
          undefined
        ) {
          return true;
        }

        if (
          typeof value !==
            "object" ||
          Array.isArray(
            value
          )
        ) {
          throw new Error(
            "smartRules must be an object."
          );
        }

        const match =
          String(
            value.match ||
            "ALL"
          )
            .trim()
            .toUpperCase();

        if (
          ![
            "ALL",
            "ANY",
          ].includes(
            match
          )
        ) {
          throw new Error(
            "smartRules.match must be ALL or ANY."
          );
        }

        if (
          !Array.isArray(
            value.rules
          )
        ) {
          throw new Error(
            "smartRules.rules must be an array."
          );
        }

        const allowedFields =
          new Set([
            "EXPRESS_DELIVERY_ENABLED",
            "STATUS",
            "IS_FEATURED",
            "IS_SEARCHABLE",
            "PRODUCT_TYPE",
            "BRAND_ID",
            "CATEGORY_ID",
          ]);

        const allowedOperators =
          new Set([
            "IS",
            "IS_NOT",
          ]);

        for (
          const rule of
          value.rules
        ) {
          if (
            !rule ||
            typeof rule !==
              "object" ||
            Array.isArray(
              rule
            )
          ) {
            throw new Error(
              "Every smart collection rule must be an object."
            );
          }

          const field =
            String(
              rule.field ||
              ""
            )
              .trim()
              .toUpperCase();

          const operator =
            String(
              rule.operator ||
              "IS"
            )
              .trim()
              .toUpperCase();

          if (
            !allowedFields.has(
              field
            )
          ) {
            throw new Error(
              `Unsupported smart collection field: ${field || "(blank)"}.`
            );
          }

          if (
            !allowedOperators.has(
              operator
            )
          ) {
            throw new Error(
              `Unsupported smart collection operator: ${operator}.`
            );
          }
        }

        if (
          String(
            req.body.collectionType ||
            ""
          )
            .trim()
            .toUpperCase() ===
            "SMART" &&
          value.rules.length ===
            0
        ) {
          throw new Error(
            "A SMART collection must contain at least one rule."
          );
        }

        return true;
      }
    ),

  body("sortOrder")
    .optional()
    .isInt({
      min: 0,
    })
    .withMessage(
      "Sort order must be zero or greater."
    )
    .toInt(),

  optionalUuid(
    "thumbnailAssetId",
    "Thumbnail asset ID"
  ),

  optionalUuid(
    "bannerAssetId",
    "Banner asset ID"
  ),

  optionalUuid(
    "mobileBannerAssetId",
    "Mobile banner asset ID"
  ),

  optionalUuid(
    "landingPageId",
    "Landing page ID"
  ),

  optionalDate(
    "publishedFrom",
    "Published From"
  ),

  optionalDate(
    "publishedUntil",
    "Published Until"
  ),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage(
      "isActive must be true or false."
    )
    .toBoolean(),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage(
      "isFeatured must be true or false."
    )
    .toBoolean(),

  body("showInMenu")
    .optional()
    .isBoolean()
    .withMessage(
      "showInMenu must be true or false."
    )
    .toBoolean(),

  body("showOnHome")
    .optional()
    .isBoolean()
    .withMessage(
      "showOnHome must be true or false."
    )
    .toBoolean(),

  body("isSearchable")
    .optional()
    .isBoolean()
    .withMessage(
      "isSearchable must be true or false."
    )
    .toBoolean(),

  body("showProductCount")
    .optional()
    .isBoolean()
    .withMessage(
      "showProductCount must be true or false."
    )
    .toBoolean(),

  body("robotsIndex")
    .optional()
    .isBoolean()
    .withMessage(
      "robotsIndex must be true or false."
    )
    .toBoolean(),

  body("robotsFollow")
    .optional()
    .isBoolean()
    .withMessage(
      "robotsFollow must be true or false."
    )
    .toBoolean(),

  body("metaTitle")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 250,
    })
    .withMessage(
      "Meta title cannot exceed 250 characters."
    ),

  body("metaDescription")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Meta description cannot exceed 500 characters."
    ),

  body("metaKeywords")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isString()
    .withMessage(
      "Meta keywords must be text."
    ),

  body("canonicalUrl")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isString()
    .withMessage(
      "Canonical URL must be text."
    ),
];

/*
|--------------------------------------------------------------------------
| Create
|--------------------------------------------------------------------------
*/

const createCollectionValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage(
      "Collection name is required."
    )
    .isLength({
      max: 250,
    })
    .withMessage(
      "Collection name cannot exceed 250 characters."
    ),

  ...collectionFieldValidation,
];

/*
|--------------------------------------------------------------------------
| Update
|--------------------------------------------------------------------------
*/

const updateCollectionValidation = [
  ...collectionIdValidation,

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "Collection name cannot be empty."
    )
    .isLength({
      max: 250,
    })
    .withMessage(
      "Collection name cannot exceed 250 characters."
    ),

  ...collectionFieldValidation,
];

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

const changeCollectionStatusValidation = [
  ...collectionIdValidation,

  body("isActive")
    .exists()
    .withMessage(
      "isActive is required."
    )
    .isBoolean()
    .withMessage(
      "isActive must be true or false."
    )
    .toBoolean(),
];

/*
|--------------------------------------------------------------------------
| Products
|--------------------------------------------------------------------------
*/

const listCollectionProductsValidation = [
  ...collectionIdValidation,

  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Page must be at least 1."
    )
    .toInt(),

  query("pageSize")
    .optional()
    .isInt({
      min: 1,
      max: 200,
    })
    .withMessage(
      "Page size must be between 1 and 200."
    )
    .toInt(),

  query("search")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim(),

  query("status")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .trim(),
];

const replaceCollectionProductsValidation = [
  ...collectionIdValidation,

  body("productIds")
    .isArray()
    .withMessage(
      "productIds must be an array."
    ),

  body("productIds.*")
    .custom(
      (value) => {
        if (
          typeof value ===
          "string"
        ) {
          return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            value
          );
        }

        if (
          value &&
          typeof value ===
            "object"
        ) {
          const id =
            value.productId ||
            value.id;

          return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            String(
              id ||
                ""
            )
          );
        }

        return false;
      }
    )
    .withMessage(
      "Every collection product must contain a valid product ID."
    ),
];

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  collectionIdValidation,
  listCollectionsValidation,
  createCollectionValidation,
  updateCollectionValidation,
  changeCollectionStatusValidation,
  listCollectionProductsValidation,
  replaceCollectionProductsValidation,
};