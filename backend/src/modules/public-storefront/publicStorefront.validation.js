const {
    query,
    header,
  } = require("express-validator");
  
  exports.getPublicStorefrontPageValidation =
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
  
      query("slug")
        .optional()
        .trim()
        .isLength({
          max: 180,
        })
        .withMessage(
          "slug cannot exceed 180 characters."
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
          return res.status(400).json({
            success: false,
            message:
              "Company code is required.",
            code: "COMPANY_CODE_REQUIRED",
          });
        }
  
        return next();
      },
    ];