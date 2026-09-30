const kioskAiService =
  require(
    "./kioskAi.service"
  );

const getPublicApiBaseUrl =
  require(
    "../../utils/getPublicApiBaseUrl"
  );


const conversation =
  async (
    req,
    res,
    next
  ) => {

    try {

      const result =
        await kioskAiService
          .conversation({
            sessionId:
              req.body
                ?.sessionId,

            message:
              req.body
                ?.message,

            context:
              req.body
                ?.context ||
              {},

            companyCode:
              req.headers[
                "x-company-code"
              ] ||
              req.body
                ?.companyCode ||
              "MYSHOPS",

            apiBaseUrl:
              getPublicApiBaseUrl(
                req
              ),
          });


      return res
        .status(
          200
        )
        .json({
          success:
            true,

          data:
            result,
        });

    } catch (
      error
    ) {

      return next(
        error
      );
    }
  };


const executeRealtimeTool =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        executeTool,
      } = require(
        "./kioskAi.tools"
      );


      console.log(
        "[KIOSK-AI-TOOL] request",
        {
          name:
            req.body
              ?.name,

          arguments:
            req.body
              ?.arguments,
        }
      );


      const result =
        await executeTool({
          name:
            req.body
              ?.name,

          arguments:
            req.body
              ?.arguments,

          companyCode:
            req.headers[
              "x-company-code"
            ] ||
            req.body
              ?.companyCode ||
            "MYSHOPS",

          apiBaseUrl:
            getPublicApiBaseUrl(
              req
            ),
        });


      console.log(
        "[KIOSK-AI-TOOL] result",
        {
          name:
            req.body
              ?.name,

          query:
            result
              ?.query,

          totalItems:
            result
              ?.totalItems,

          returnedProducts:
            Array.isArray(
              result
                ?.products
            )
              ? result.products.length
              : 0,

          productNames:
            Array.isArray(
              result
                ?.products
            )
              ? result.products
                  .slice(
                    0,
                    5
                  )
                  .map(
                    product =>
                      product.name
                  )
              : [],
        }
      );


      return res
        .status(
          200
        )
        .json({
          success:
            true,

          data:
            result,
        });

    } catch (
      error
    ) {

      return next(
        error
      );
    }
  };


const resetSession =
  async (
    req,
    res,
    next
  ) => {

    try {

      const result =
        await kioskAiService
          .resetSession(
            req.body
              ?.sessionId
          );


      return res
        .status(
          200
        )
        .json({
          success:
            true,

          data:
            result,
        });

    } catch (
      error
    ) {

      return next(
        error
      );
    }
  };


module.exports = {
  conversation,
  executeRealtimeTool,
  resetSession,
};
