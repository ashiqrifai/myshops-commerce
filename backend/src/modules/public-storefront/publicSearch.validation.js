const {
    header,
    query,
  } = require(
    "express-validator"
  );
  
  const getPublicSearchValidation =
    [
      header("x-company-code")
        .optional()
        .trim()
        .isLength({
          min: 1,
          max: 50,
        })
        .withMessage(
          "x-company-code cannot exceed 50 characters."
        ),
  
      query("companyCode")
        .optional()
        .trim()
        .isLength({
          min: 1,
          max: 50,
        })
        .withMessage(
          "companyCode cannot exceed 50 characters."
        ),
  
      query("q")
        .optional({
          nullable: true,
          checkFalsy: true,
        })
        .trim()
        .isLength({
          max: 250,
        })
        .withMessage(
          "Search query cannot exceed 250 characters."
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
  
      query("brandIds")
        .optional({
          nullable: true,
          checkFalsy: true,
        })
        .trim(),
  
      query("categoryIds")
        .optional({
          nullable: true,
          checkFalsy: true,
        })
        .trim(),
  
      query("minPrice")
        .optional()
        .isFloat({
          min: 0,
        })
        .withMessage(
          "minPrice must be zero or greater."
        )
        .toFloat(),
  
      query("maxPrice")
        .optional()
        .isFloat({
          min: 0,
        })
        .withMessage(
          "maxPrice must be zero or greater."
        )
        .toFloat(),
  
      query("sort")
        .optional()
        .isIn([
          "RELEVANCE",
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
          "Invalid product sort option."
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
    getPublicSearchValidation,
  };