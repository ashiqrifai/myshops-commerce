const db =
  require(
    "../models"
  );

const {
  verifyCustomerAccessToken,
} = require(
  "../modules/customer-auth/customerAuth.utils"
);

module.exports =
  async (
    req,
    res,
    next
  ) => {
    try {
      const authorization =
        req.headers.authorization ||
        "";

      /*
       * Guest checkout:
       * No Bearer token is valid.
       */
      if (
        !authorization.startsWith(
          "Bearer "
        )
      ) {
        return next();
      }

      const token =
        authorization
          .substring(7)
          .trim();

      if (!token) {
        return next();
      }

      let payload;

      /*
       * This middleware is OPTIONAL authentication.
       *
       * If the token is expired, invalid, malformed,
       * or belongs to another token type, continue
       * the request as a guest.
       */
      try {
        payload =
          verifyCustomerAccessToken(
            token
          );
      } catch (
        error
      ) {
        console.warn(
          "Optional customer authentication ignored invalid/expired token."
        );

        return next();
      }

      /*
       * Token exists but is not a valid customer
       * access token. Treat it as unauthenticated.
       */
      if (
        payload?.type !==
          "CUSTOMER_ACCESS" ||
        !payload?.sub ||
        !payload?.companyId
      ) {
        console.warn(
          "Optional customer authentication ignored non-customer token."
        );

        return next();
      }

      const customer =
        await db.Customer.findOne({
          where: {
            id:
              payload.sub,

            companyId:
              payload.companyId,

            status:
              "ACTIVE",

            isActive:
              true,
          },

          attributes: [
            "id",
            "companyId",
            "firstName",
            "lastName",
            "email",
            "mobile",
            "status",
            "preferredLanguage",
            "preferredCurrency",
          ],
        });

      /*
       * Customer no longer exists / inactive.
       *
       * Because this is optional authentication,
       * continue the request as guest.
       */
      if (!customer) {
        console.warn(
          "Optional customer authentication ignored unavailable customer."
        );

        return next();
      }

      req.customer =
        customer.get({
          plain:
            true,
        });

      req.context = {
        ...(
          req.context ||
          {}
        ),

        customerId:
          customer.id,

        companyId:
          customer.companyId,

        channel:
          "STOREFRONT",
      };

      return next();
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };