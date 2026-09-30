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

  const publicContactRoutes =
  require(
    "./modules/public-storefront/publicContact.routes"
  );

const accessControlRoutes =
  require(
    "./modules/access-control/accessControl.routes"
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

  const {
    kioskRouter:
      kioskDevicePublicRoutes,
  } = require(
    "./modules/kiosk-devices/kioskDevice.routes"
  );


const kioskAiRoutes =
  require(
    "./modules/kiosk-ai/kioskAi.routes"
  );


const kioskCheckoutRoutes =
  require(
    "./modules/kiosk-checkout/kioskCheckout.routes"
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

/*
|--------------------------------------------------------------------------
| TEMPORARY REQUEST MEMORY MONITOR
|--------------------------------------------------------------------------
|
| Diagnostic only.
|
| Tracks API requests so we can identify which request is active when
| Node heap suddenly grows by hundreds or thousands of MB.
|
| Remove after the memory issue has been identified.
|--------------------------------------------------------------------------
*/

let memoryRequestSequence =
  0;

const bytesToMb =
  (value) =>
    Math.round(
      value /
        1024 /
        1024
    );

app.use(
  (
    req,
    res,
    next
  ) => {
    /*
     * Ignore static media requests. They are numerous and are not useful
     * for diagnosing JavaScript heap growth.
     */
    if (
      req.path ===
        "/media" ||
      req.path.startsWith(
        "/media/"
      )
    ) {
      next();

      return;
    }

    memoryRequestSequence +=
      1;

    const requestId =
      memoryRequestSequence;

    const startedAt =
      Date.now();

    const startMemory =
      process.memoryUsage();

    const startHeapMb =
      bytesToMb(
        startMemory.heapUsed
      );

    const method =
      req.method;

    const requestUrl =
      req.originalUrl ||
      req.url;

    /*
     * Log the start only once the process is already using substantial
     * memory. Normal low-memory requests do not need to flood the log.
     */
    if (
      startHeapMb >=
      250
    ) {
      console.warn(
        "[REQ-MEM START-HIGH]",
        {
          requestId,
          method,
          url:
            requestUrl,
          heapUsedMB:
            startHeapMb,
          heapTotalMB:
            bytesToMb(
              startMemory.heapTotal
            ),
          rssMB:
            bytesToMb(
              startMemory.rss
            ),
        }
      );
    }

    let completed =
      false;

    const finish =
      (
        eventName
      ) => {
        if (
          completed
        ) {
          return;
        }

        completed =
          true;

        const endMemory =
          process.memoryUsage();

        const endHeapMb =
          bytesToMb(
            endMemory.heapUsed
          );

        const heapDeltaMb =
          endHeapMb -
          startHeapMb;

        const durationMs =
          Date.now() -
          startedAt;

        /*
         * Log requests that:
         *
         * 1. Increased heap by at least 50 MB, OR
         * 2. Finished while total heap usage was >= 250 MB.
         */
        if (
          heapDeltaMb >=
            50 ||
          endHeapMb >=
            250
        ) {
          console.warn(
            "[REQ-MEM HIGH]",
            {
              requestId,
              event:
                eventName,
              method,
              url:
                requestUrl,
              statusCode:
                res.statusCode,
              durationMs,
              startHeapMB:
                startHeapMb,
              endHeapMB:
                endHeapMb,
              heapDeltaMB:
                heapDeltaMb,
              heapTotalMB:
                bytesToMb(
                  endMemory.heapTotal
                ),
              rssMB:
                bytesToMb(
                  endMemory.rss
                ),
              externalMB:
                bytesToMb(
                  endMemory.external
                ),
            }
          );
        }
      };

    res.once(
      "finish",
      () =>
        finish(
          "finish"
        )
    );

    res.once(
      "close",
      () =>
        finish(
          "close"
        )
    );

    next();
  }
);



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
|--------------------------------------------------------------------------
| Android Kiosk Device API
|--------------------------------------------------------------------------
|
| POST /api/v1/kiosk/activate
| GET  /api/v1/kiosk/bootstrap
| POST /api/v1/kiosk/heartbeat
|
*/

app.use(
  "/api/v1/kiosk",
  kioskDevicePublicRoutes
);


app.use(
  "/api/v1/kiosk",
  kioskAiRoutes
);


app.use(
  "/api/v1/kiosk",
  kioskCheckoutRoutes
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

app.use(
  "/api/v1/public/contact",
  publicContactRoutes
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

app.use(
  "/api/v1/admin/access-control",
  accessControlRoutes
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