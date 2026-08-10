const {
  header,
  param,
  query,
} = require(
  "express-validator"
);

const getPublicCategoryValidation =
  [
    header("x-company-code")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage(
        "x-company-code cannot exceed 50 characters."
      ),

    query("companyCode")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage(
        "companyCode cannot exceed 50 characters."
      ),

    param("slug")
      .trim()
      .notEmpty()
      .withMessage(
        "Category slug is required."
      )
      .isLength({ max: 250 })
      .withMessage(
        "Category slug cannot exceed 250 characters."
      ),

    query("channel")
      .optional()
      .isIn([
        "WEBSITE",
        "KIOSK",
      ])
      .withMessage(
        "channel must be WEBSITE or KIOSK."
      ),

    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage(
        "page must be at least 1."
      ),

    query("pageSize")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage(
        "pageSize must be between 1 and 100."
      ),

    query("minPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage(
        "minPrice must be zero or greater."
      ),

    query("maxPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage(
        "maxPrice must be zero or greater."
      ),

    query("sort")
      .optional()
      .isIn([
        "FEATURED",
        "NEWEST",
        "PRICE_LOW_TO_HIGH",
        "PRICE_HIGH_TO_LOW",
        "PRICE_ASC",
        "PRICE_DESC",
        "NAME_ASC",
        "NAME_DESC",
      ])
      .withMessage(
        "Invalid category product sort option."
      ),

    (req, res, next) => {
      const companyCode =
        req.headers[
          "x-company-code"
        ] ||
        req.query.companyCode;

      if (!companyCode) {
        return res.status(400).json({
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
  getPublicCategoryValidation,
};
