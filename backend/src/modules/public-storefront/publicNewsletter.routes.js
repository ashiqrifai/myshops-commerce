const express =
  require(
    "express"
  );

const db =
  require(
    "../../models"
  );

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Subscribe
|--------------------------------------------------------------------------
|
| POST
| /api/v1/public/newsletter/subscribe
|
|--------------------------------------------------------------------------
*/

router.post(
  "/subscribe",
  async (
    req,
    res,
    next
  ) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Email
      |--------------------------------------------------------------------------
      */

      const email =
        String(
          req.body?.email ||
            ""
        )
          .trim()
          .toLowerCase();

      if (!email) {
        return res
          .status(400)
          .json({
            success:
              false,

            error: {
              code:
                "EMAIL_REQUIRED",

              message:
                "Email address is required.",
            },
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Basic Email Validation
      |--------------------------------------------------------------------------
      */

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          email
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error: {
              code:
                "INVALID_EMAIL",

              message:
                "Please enter a valid email address.",
            },
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Company
      |--------------------------------------------------------------------------
      |
      | Current MyShops storefront.
      |
      |--------------------------------------------------------------------------
      */

      const company =
        await db.Company.findOne({
          where: {
            code:
              "MYSHOPS",

            isActive:
              true,
          },

          attributes: [
            "id",
            "name",
            "code",
          ],
        });

      if (!company) {
        return res
          .status(404)
          .json({
            success:
              false,

            error: {
              code:
                "COMPANY_NOT_FOUND",

              message:
                "Company not found.",
            },
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Existing Subscription
      |--------------------------------------------------------------------------
      */

      const existing =
        await db
          .NewsletterSubscriber
          .findOne({
            where: {
              companyId:
                company.id,

              email,
            },
          });

      /*
      |--------------------------------------------------------------------------
      | Existing Active Subscriber
      |--------------------------------------------------------------------------
      */

      if (
        existing &&
        existing.status ===
          "SUBSCRIBED"
      ) {
        return res
          .status(200)
          .json({
            success:
              true,

            data: {
              subscribed:
                true,

              alreadySubscribed:
                true,

              email:
                existing.email,
            },

            message:
              "You are already subscribed to MyShops updates.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Re-subscribe
      |--------------------------------------------------------------------------
      */

      if (existing) {
        existing.status =
          "SUBSCRIBED";

        existing.subscribedAt =
          new Date();

        existing.unsubscribedAt =
          null;

        await existing.save();

        return res
          .status(200)
          .json({
            success:
              true,

            data: {
              subscribed:
                true,

              alreadySubscribed:
                false,

              email:
                existing.email,
            },

            message:
              "Thank you for subscribing to MyShops.",
          });
      }

      /*
      |--------------------------------------------------------------------------
      | New Subscriber
      |--------------------------------------------------------------------------
      */

      const subscriber =
        await db
          .NewsletterSubscriber
          .create({
            companyId:
              company.id,

            email,

            status:
              "SUBSCRIBED",

            subscribedAt:
              new Date(),

            unsubscribedAt:
              null,
          });

      return res
        .status(201)
        .json({
          success:
            true,

          data: {
            subscribed:
              true,

            alreadySubscribed:
              false,

            email:
              subscriber.email,
          },

          message:
            "Thank you for subscribing to MyShops.",
        });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  }
);

module.exports =
  router;