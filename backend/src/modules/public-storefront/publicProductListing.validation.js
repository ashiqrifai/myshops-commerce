const {
  query,
} = require(
  "express-validator"
);

const getPublicProductListingValidation = [
  query("companyCode")
    .optional()
    .trim()
    .isLength({
      min: 1,
      max: 80,
    }),

  query("channel")
    .optional()
    .trim()
    .toUpperCase()
    .isIn([
      "WEBSITE",
      "KIOSK",
    ])
    .withMessage(
      "channel must be WEBSITE or KIOSK."
    ),

  query("url")
    .trim()
    .notEmpty()
    .withMessage(
      "url is required."
    )
    .isLength({
      max: 500,
    })
    .withMessage(
      "url must be 500 characters or fewer."
    ),

  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage(
      "page must be at least 1."
    )
    .toInt(),

  query("pageSize")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage(
      "pageSize must be between 1 and 100."
    )
    .toInt(),

  query("search")
    .optional()
    .trim()
    .isLength({
      max: 200,
    }),

  query("brandIds")
    .optional()
    .isString(),

  query("categoryIds")
    .optional()
    .isString(),

  query("minPrice")
    .optional()
    .isFloat({
      min: 0,
    })
    .toFloat(),

  query("maxPrice")
    .optional()
    .isFloat({
      min: 0,
    })
    .toFloat(),

  query("sort")
    .optional()
    .isIn([
      "FEATURED",
      "PRICE_LOW_TO_HIGH",
      "PRICE_HIGH_TO_LOW",
      "PRICE_ASC",
      "PRICE_DESC",
      "NAME_ASC",
      "NAME_DESC",
    ])
    .withMessage(
      "Invalid product listing sort option."
    ),

  (
    req,
    res,
    next
  ) => {
    const companyCode =
      req.headers[
        "x-company-code"
      ] ||
      req.query.companyCode;

    if (!companyCode) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Company code is required.",
          code:
            "COMPANY_CODE_REQUIRED",
        });
    }

    return next();
  },
];

module.exports = {
  getPublicProductListingValidation,
};
