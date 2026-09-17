const path = require("path");

const express = require("express");

const cors = require("cors");

const helmet = require("helmet");

const morgan = require("morgan");

const cookieParser = require("cookie-parser");

const env = require("./config/env");

const apiRoutes =
  require(
    "./routes"
  );

const healthRoutes =
  require(
    "./routes/healthRoutes"
  );

const notFound =
  require(
    "./middleware/notFound"
  );

const errorHandler =
  require(
    "./middleware/errorHandler"
  );

const publicNavigationRoutes =
  require(
    "./modules/navigation/publicNavigation.routes"
  );

const publicCategoryRoutes =
  require(
    "./modules/categories/publicCategory.routes"
  );

const publicOrderRoutes =
  require(
    "./routes/publicOrderRoutes"
  );

const customerOrderRoutes =
  require(
    "./modules/customer-orders/customerOrder.routes"
  );

const publicCouponRoutes =
  require(
    "./routes/publicCouponRoutes"
  );

  const publicProtectionRoutes =
  require(
    "./routes/publicProtectionRoutes"
  );

  const productAttachmentRoutes =
  require(
    "./modules/product-attachments/productAttachment.routes"
  );

  const publicRecommendationRoutes =
  require(
    "./modules/public-storefront/publicRecommendation.routes"
  );

  const publicInstagramRoutes =
  require(
    "./modules/public-storefront/publicInstagram.routes"
  );

  const instagramPostRoutes =
  require(
    "./modules/instagram-posts/instagramPost.routes"
  );

  const zohoInventoryIntegrationRoutes =
  require(
    "./routes/zohoInventoryIntegration.routes"
  );

  const paymentExceptionRoutes =
  require(
    "./routes/paymentExceptionRoutes"
  );

  const publicNewsletterRoutes =
  require(
    "./modules/public-storefront/publicNewsletter.routes"
  );

/*
 * Admin coupon management routes.
 *
 * These are protected inside
 * coupon.routes.js using:
 *
 * authenticate
 * authorize("pricing.read/create/update/delete")
 */
const couponAdminRoutes =
  require(
    "./modules/coupons/coupon.routes"
  );

  const networkInternationalRoutes =
  require(
    "./routes/networkInternationalRoutes"
  );

  const protectionSchemeRoutes =
  require(
    "./modules/protection-schemes/protectionScheme.routes"
  );

  const protectionAssignmentRoutes =
  require(
    "./modules/protection-assignments/protectionAssignment.routes"
  );

  const protectionSettingRoutes =
  require(
    "./modules/protection-settings/protectionSetting.routes"
  );

  const publicProductAttachmentRoutes =
  require(
    "./routes/publicProductAttachmentRoutes"
  );

  const publicActivityRoutes =
  require(
    "./modules/public-storefront/publicActivity.routes"
  );

  const publicDeliveryEligibilityRoutes =
  require(
    "./routes/publicDeliveryEligibilityRoutes"
  );

  const zohoIntegrationRoutes =
  require(
    "./routes/zohoIntegration.routes"
  );

  const adminZohoIntegrationRoutes =
  require(
    "./routes/adminZohoIntegration.routes"
  );


const app =
  express();

app.disable(
  "x-powered-by"
);

app.set(
  "trust proxy",
  1
);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy:
        "cross-origin",
    },
  })
);

app.use(
  cors({
    origin: [
      env.urls
        .adminWebUrl,

      env.urls
        .publicWebUrl,
    ],

    credentials:
      true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-Device-Id",
      "x-company-code",
    ],
  })
);

app.use(
  express.json({
    limit:
      "25mb",
  })
);

app.use(
  express.urlencoded({
    extended:
      true,

    limit:
      "25mb",
  })
);

app.use(
  cookieParser()
);

if (
  env.nodeEnv ===
  "development"
) {
  app.use(
    morgan(
      "dev"
    )
  );
} else {
  app.use(
    morgan(
      "combined"
    )
  );
}

app.get(
  "/",
  (
    req,
    res
  ) => {
    res
      .status(
        200
      )
      .json({
        success:
          true,

        data: {
          name:
            "MyShops Commerce API",

          message:
            "API is running.",
        },
      });
  }
);

app.use(
  "/health",
  healthRoutes
);

app.use(
  "/media",

  express.static(
    path.resolve(
      process.cwd(),
      "storage",
      "media"
    ),
    {
      fallthrough:
        false,

      immutable:
        false,

      maxAge:
        env.nodeEnv ===
        "production"
          ? "7d"
          : 0,
    }
  )
);

/*
 * Main application API router.
 *
 * Existing routes such as:
 *
 * /api/v1/pricing/price-lists
 * /api/v1/admin/...
 *
 * are mounted through this router.
 */
app.use(
  "/api/v1",
  apiRoutes
);

/*
 * Public storefront routes.
 */

app.use(
  "/api/v1/public/navigation",
  publicNavigationRoutes
);

app.use(
  "/api/v1/public/categories",
  publicCategoryRoutes
);

app.use(
  "/api/v1/public/orders",
  publicOrderRoutes
);

app.use(
  "/api/v1/customer/orders",
  customerOrderRoutes
);

app.use(
  "/api/v1/public/coupons",
  publicCouponRoutes
);

app.use(
  "/api/v1/protection-schemes",
  protectionSchemeRoutes
);

app.use(
  "/api/v1/protection-settings",
  protectionSettingRoutes
);

app.use(
  "/api/v1/protection-assignments",
  protectionAssignmentRoutes
);


app.use(
  "/api/v1/public/storefront",
  publicActivityRoutes
);


/*
 * Admin Coupon Management API.
 *
 * GET
 * /api/v1/pricing/coupons
 *
 * GET
 * /api/v1/pricing/coupons/:id
 *
 * POST
 * /api/v1/pricing/coupons
 *
 * PUT
 * /api/v1/pricing/coupons/:id
 *
 * PATCH
 * /api/v1/pricing/coupons/:id/status
 *
 * DELETE
 * /api/v1/pricing/coupons/:id
 */
app.use(
  "/api/v1/pricing/coupons",
  couponAdminRoutes
);

app.use(
  "/api/v1/payments/network-international",
  networkInternationalRoutes
);

app.use(
  "/api/v1/public/coupons",
  publicCouponRoutes
);

app.use(
  "/api/v1/public/protection",
  publicProtectionRoutes
);

app.use(
  "/api/v1/product-attachment-rules",
  productAttachmentRoutes
);

app.use(
  "/api/v1/public/product-attachments",
  publicProductAttachmentRoutes
);

app.use(
  "/api/v1/public/storefront",
  publicRecommendationRoutes
);

app.use(
  "/api/v1/public/storefront",
  publicInstagramRoutes
);

app.use(
  "/api/v1/admin/instagram-posts",
  instagramPostRoutes
);

app.use(
  "/api/v1/integrations/zoho",
  zohoInventoryIntegrationRoutes
);

app.use(
  "/api/v1/public/checkout",
  publicDeliveryEligibilityRoutes
);

app.use(
  "/api/v1/admin/payment-exceptions",
  paymentExceptionRoutes
);

app.use(
  "/api/v1/integrations/zoho",
  zohoIntegrationRoutes
);

app.use(
  "/api/v1/public/newsletter",
  publicNewsletterRoutes
);

/*
|--------------------------------------------------------------------------
| Admin Zoho Integration
|--------------------------------------------------------------------------
*/

app.use(
  "/api/v1/admin/zoho",
  adminZohoIntegrationRoutes
);

/*
 * These must remain last.
 */
app.use(
  notFound
);

app.use(
  errorHandler
);



module.exports =
  app;