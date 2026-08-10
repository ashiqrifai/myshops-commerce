const publicStorefrontAiService =
  require(
    "./publicStorefrontAi.service"
  );

exports.chat =
  async (
    req,
    res,
    next
  ) => {
    try {
      const companyCode =
        req.headers[
          "x-company-code"
        ] ||
        req.query.companyCode;

      const result =
        await publicStorefrontAiService
          .chat({
            companyCode,
            message:
              req.body.message,
            conversation:
              req.body
                .conversation ||
              [],
            pageContext:
              req.body
                .pageContext ||
              {},
            cartContext:
              req.body
                .cartContext ||
              {},
            channel:
              req.body.channel ||
              "WEBSITE",
          });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
