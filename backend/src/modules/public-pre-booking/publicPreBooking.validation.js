const {
    param,
    query,
    validationResult,
  } = require(
    "express-validator"
  );
  
  const validate =
    (
      req,
      res,
      next
    ) => {
      const errors =
        validationResult(
          req
        );
  
      if (
        errors.isEmpty()
      ) {
        return next();
      }
  
      return res
        .status(400)
        .json({
          success:
            false,
  
          error: {
            code:
              "VALIDATION_ERROR",
  
            message:
              "Request validation failed.",
  
            details:
              errors.array(),
          },
        });
    };
  
  exports.campaignValidation =
    [
      param("slug")
        .trim()
        .notEmpty()
        .withMessage(
          "Campaign slug is required."
        )
        .isLength({
          max: 250,
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
          "Channel must be WEBSITE or KIOSK."
        ),
  
      validate,
    ];
  
  exports.campaignProductValidation =
    [
      param("slug")
        .trim()
        .notEmpty()
        .withMessage(
          "Campaign slug is required."
        )
        .isLength({
          max: 250,
        }),
  
      param("productSlug")
        .trim()
        .notEmpty()
        .withMessage(
          "Product slug is required."
        )
        .isLength({
          max: 320,
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
          "Channel must be WEBSITE or KIOSK."
        ),
  
      validate,
    ];